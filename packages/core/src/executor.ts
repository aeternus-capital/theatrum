import type Entity from './entity.ts';
import type Method from './method.ts';
import Errors, { TheatrumError } from './errors.ts';
import type {
    Actor,
    IMethods,
    ExecuteTracer,
    ExecutorOptions,
    ExecutorContext,
    ExecutorMetrics,
    ExecutorResponse,
    InferMethodParams,
    InferMethodResult,
} from './types.ts';

/**
 * # Executor
 * This module is sandbox for running methods.
 * To create an executor, you need to specify the actor on whose behalf the methods will be executed.
 * After creation executor generate a context which will be passed into all methods, that it runs.
 *
 * @example Basic usage (through theatrum)
 * ```ts
 * import theatrum from '@/theatrum.ts';
 *
 * // Create actor
 * const actor = theatrum.createActor('user', [], {
 *     userId: 1,
 * });
 *
 * // Create executor
 * const executor = theatrum.createExecutor(actor);
 *
 * // Run methods
 * executor.run('math.sum', {
 *     a: 4,
 *     b: 5,
 * })
 *     .then((result) => console.log(result))  // 9
 *     .catch((error) => console.error(error));  // error if it was thrown while execution
 * ```
 * @module
 */
class Executor<Methods extends IMethods, Context extends object = object> {
    private readonly methods: Methods;
    private readonly metrics: Map<string, string | number | boolean>;
    private readonly context: ExecutorContext<Entity<string> | Entity<string>[]>;
    private readonly tracer: ExecuteTracer | null;
    private readonly getMethodNameByInstance: (method: Method) => string | null;

    /**
     * Executor constructor
     *
     * @param {IMethods} methods Methods
     * @param {Actor} actor Actor on whose behalf the methods will be executed
     * @param {ExecutorOptions} options Executor options
     *
     * @constructor
     */
    constructor(methods: Methods, actor: Actor, options: ExecutorOptions<Context>) {
        this.methods = methods;
        this.metrics = new Map<string, string | number | boolean>();
        this.tracer = options?.tracer || null;
        this.getMethodNameByInstance = options.getMethodNameByInstance;
        this.context = {
            ...options,
            actor,
            run: this.runInternal.bind(this),
            tracer: {
                sendEvent: this.sendTraceEvent.bind(this),
            },
            metrics: {
                set: this.setMetric.bind(this),
                unset: this.unsetMetric.bind(this),
                startRecord: this.startRecordMetric.bind(this),
                endRecord: this.endRecordMetric.bind(this),
            },
        };

        this.sendTraceEvent('executor:init', {
            actor,
            options,
        });
    }

    /**
     * Method run one of theatrum methods by name
     *
     * @param method Method name
     * @param params Method params
     */
    public async run<T extends keyof Methods>(method: T, params: InferMethodParams<Methods[T]>): Promise<InferMethodResult<Methods[T]>> {
        this.sendTraceEvent('executor:run', {
            'internal:method': method,
            params,
        });

        const methodInstance: Methods[T] = this.methods[method] || null;
        if (methodInstance === null) {
            throw Errors.unknownMethod();
        }

        this.sendTraceEvent('executor:check_actor', {
            'internal:method': method,
        });

        if (!methodInstance.checkEntity(this.context.actor.entity)) {
            throw Errors.unsupportedActor();
        }

        this.sendTraceEvent('executor:check_roles', {
            'internal:method': method,
        });

        if (!methodInstance.checkRoles(this.context.actor.roles)) {
            throw Errors.accessDenied();
        }

        this.sendTraceEvent('executor:invoke', {
            'internal:method': method,
        });

        const result = await methodInstance.invoke(params, {
            ...this.context,
            tracer: {
                sendEvent: this.sendTraceEventFromMethod(String(method)).bind(this),
            },
        });

        this.sendTraceEvent('executor:result', {
            'internal:method': method,
            result,
        });

        return result;
    }

    /**
     * Method create wrapper around 'run' method which catching errors and transform it to normal response
     *
     * @param method Method name
     * @param params Method params
     */
    public async runWithWrapper<T extends keyof Methods>(method: T, params: InferMethodParams<Methods[T]>): Promise<ExecutorResponse<InferMethodResult<Methods[T]>>> {
        try {
            return {
                result: await this.run(method, params),
            };
        } catch (e) {
            if (e instanceof TheatrumError) {
                return {
                    error: e,
                };
            }

            return {
                error: Errors.internalError(),
            };
        }
    }

    /**
     * Method run one method from handler of another method
     *
     * @example Basic usage (in method)
     * ```ts
     * const handler = async (params: any, ctx: ExecutorContext<typeof User>) => {
     *     const result = await ctx.run(MathSum, {
     *         a: 4,
     *         b: 5
     *     });
     *
     *     return result;  // 9
     * };
     * ```
     *
     * @param method Method instance
     * @param params Method params
     */
    private runInternal<T extends Method>(method: T, params: InferMethodParams<T>): Promise<InferMethodResult<T>> {
        const methodName = this.tracer !== null ? this.getMethodNameByInstance(method) : null;

        this.sendTraceEvent('executor:run', {
            'internal:method': methodName,
            'internal:isInternal': true,
            params,
        });

        this.sendTraceEvent('executor:check_actor', {
            'internal:method': methodName,
        });

        if (!method.checkEntity(this.context.actor.entity)) {
            throw Errors.unsupportedActor();
        }

        this.sendTraceEvent('executor:invoke', {
            'internal:method': methodName,
        });

        return method.invoke(params, {
            ...this.context,
            tracer: {
                sendEvent: this.sendTraceEventFromMethod(methodName).bind(this),
            },
        });
    }

    /**
     * Method exports metrics which were recorded while the methods were executing
     */
    public exportMetrics(): ExecutorMetrics {
        return Object.fromEntries(
            Array.from(this.metrics.entries())
                .map(([ key, value ]) => {
                    return [`user_${key.toLowerCase().replaceAll(' ', '_')}`, value];
                })
        );
    }

    /**
     * Method create metric
     *
     * @param {string} key Metric name
     * @param {string | number | boolean} value Metric value
     */
    private setMetric(key: string, value: string | number | boolean): void {
        this.metrics.set(key, value);
    }

    /**
     * Method remove metric
     *
     * @param {string} key Metric name
     */
    private unsetMetric(key: string): void {
        this.metrics.delete(key);
    }

    /**
     * Method create time metric
     *
     * @param {string} key Metric name
     */
    private startRecordMetric(key: string): void {
        const now = Date.now();
        this.unsetMetric(key);
        this.setMetric(key, now);
    }

    /**
     * Method calculates how much time has passed since creation of time metric
     *
     * @param {string} key Metric name
     */
    private endRecordMetric(key: string): void {
        const now = Date.now();
        const value = this.metrics.get(key);

        if (typeof value === 'number') {
            this.setMetric(key, now - value);
        }
    }

    /**
     * Method send event to tracer
     *
     * @param {string} event Event name
     * @param {object} data Event data
     */
    private sendTraceEvent(event: string, data?: object): void {
        if (this.tracer === null) {
            return;
        }

        this.tracer(Date.now(), event, data);
    }

    /**
     * Method create handler for specific method for sending event to tracer with more context
     *
     * @param {string | null} method Method name (if method not found in methods map, it will be called '<hidden method>' in console)
     */
    private sendTraceEventFromMethod(method: string | null): { (event: string, data?: object): void } {
        if (this.tracer === null) {
            return (_event: string, _data?: object): void => {};
        }

        return (event: string, data?: object): void => {
            this.sendTraceEvent.bind(this)(event, {
                ...data,
                'internal:method': method,
            });
        }
    }
}

export default Executor;
