import Errors from './errors.ts';
import Executor from './executor.ts';
import type Method from './method.ts';
import type { Actor, ExecutorOptions, IEntities, IMethods, IOptions, InferActorData, InferActorRoles } from './types.ts';

/**
 * # Theatrum
 * This class creates the main object through which almost all interaction with the framework is carried out.
 *
 * @example Basic usage
 * ```ts
 * import { Theatrum } from '@theatrum/core';
 * import UserEntity from './entities/user.ts';
 *
 * import MathSum from './math/sum.ts';
 * import MathMultiply from './math/multiply.ts';
 *
 * // Create map of entities where key is entity name
 * const entities = {
 *     'user': UserEntity,
 * };
 *
 * // Create map of methods where key is method name
 * const methods = {
 *     'math.sum': MathSum,
 *     'math.multiply': MathMultiply,
 * };
 *
 * // Create main object
 * const theatrum = new Theatrum<typeof entities, typeof methods>({
 *     methods,
 *     entities,
 * });
 *
 * // Create actor for calling methods
 * const user = theatrum.createActor('user', [], {
 *     userId: 1,
 * });
 *
 * // Create executor for user which will used as a sandbox for methods
 * const executor = theatrum.createExecutor(user);
 *
 * // Call the required method
 * executor.run('math.sum', {
 *     a: 4,
 *     b: 5,
 * })
 *     .then((result) => console.log(result))  // 9
 *     .catch((error) => console.error(error));  // error if it was thrown while execution
 *
 * // For auto-handling all errors use runWithWrapper
 * executor.runWithWrapper('math.sum', {
 *     a: 4,
 *     b: 5,
 * })
 *     .then(({ result, error }) => ...);  // if unknown error was thrown while execution executor will return 'Internal Error'
 * ```
 *
 * @module
 */
class Theatrum<Entities extends IEntities, Methods extends IMethods> {
    private readonly methods: Methods;
    private readonly entities: Entities;

    /**
     * Theatrum constructor
     *
     * @param {IOptions<IEntities, IMethods>} options Theatrum options
     * @constructor
     */
    constructor(options: IOptions<Entities, Methods>) {
        this.methods = options.methods;
        this.entities = options.entities;
    }

    /**
     * Method return methods map
     */
    public getMethods(): Methods {
        return this.methods;
    }

    /**
     * Method return entities map
     */
    public getEntities(): Entities {
        return this.entities;
    }

    /**
     * Method create executor for actor
     *
     * @param {Actor} actor Actor for which the executor is being created
     */
    public createExecutor<Context extends object = object>(actor: Actor, options?: Omit<ExecutorOptions<Context>, 'getMethodNameByInstance'>): Executor<Methods> {
        return new Executor<Methods, Context>(this.methods, actor, {
            ...options,
            tracer: options?.tracer,
            getMethodNameByInstance: this.getMethodNameByInstance.bind(this),
        } as ExecutorOptions<Context>);
    }

    /**
     * Method create actor
     *
     * @param name Entity name
     * @param roles Entity roles that will be given to the actor
     * @param data Actor data
     */
    public createActor<T extends keyof Entities>(name: T, roles: InferActorRoles<Entities[T]>, data: InferActorData<Entities[T]>): Actor<T, InferActorRoles<Entities[T]>, InferActorData<Entities[T]>> {
        const entity = this.entities[name];
        if (!entity) {
            throw Errors.invalidEntity();
        }

        return entity.createActor(roles, data);
    }

    /**
     * Method return name of method by method's instance
     *
     * @param {Method} method Method instance
     */
    private getMethodNameByInstance(method: Method): string | null {
        const entries = Object.entries(this.methods);
        for (const [key, value] of entries) {
            if (method === value) {
                return key;
            }
        }

        return null;
    }
}

export default Theatrum;
