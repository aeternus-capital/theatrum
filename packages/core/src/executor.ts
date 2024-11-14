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

class Executor<Methods extends IMethods, Context extends object = object> {
    private readonly methods: Methods;
    private readonly metrics: Map<string, string | number | boolean>;
    private readonly context: ExecutorContext<Entity<string> | Entity<string>[]>;
    private readonly tracer: ExecuteTracer | null;
    private readonly getMethodNameByInstance: (method: Method) => string | null;

    constructor(methods: Methods, actor: Actor, options: ExecutorOptions<Context>) {
        this.methods = methods;
        this.metrics = new Map<string, string | number | boolean>();
        this.tracer = options?.tracer || null;
        this.getMethodNameByInstance = options.getMethodNameByInstance;
        this.context = {
            ...options,
            actor,
            execute: this.runInternal.bind(this),
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

    public exportMetrics(): ExecutorMetrics {
        return Object.fromEntries(this.metrics.entries().map(([ key, value ]) => {
            return [`user_${key.toLowerCase().replaceAll(' ', '_')}`, value];
        }));
    }

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
        })
    }

    private setMetric(key: string, value: string | number | boolean): void {
        this.metrics.set(key, value);
    }

    private unsetMetric(key: string): void {
        this.metrics.delete(key);
    }

    private startRecordMetric(key: string): void {
        const now = Date.now();
        this.unsetMetric(key);
        this.setMetric(key, now);
    }

    private endRecordMetric(key: string): void {
        const now = Date.now();
        const value = this.metrics.get(key);

        if (typeof value === 'number') {
            this.setMetric(key, now - value);
        }
    }

    private sendTraceEvent(event: string, data?: object): void {
        if (this.tracer === null) {
            return;
        }

        this.tracer(Date.now(), event, data);
    }

    private sendTraceEventFromMethod(method: string | null) {
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
