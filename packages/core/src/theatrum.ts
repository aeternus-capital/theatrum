import Errors from './errors.ts';
import Executor from './executor.ts';
import type Method from './method.ts';
import type { Actor, ExecutorOptions, IEntities, IMethods, IOptions, InferActorData, InferActorRoles } from './types.ts';

class Theatrum<Entities extends IEntities, Methods extends IMethods> {
    private readonly methods: Methods;
    private readonly entities: Entities;

    constructor(options: IOptions<Entities, Methods>) {
        this.methods = options.methods;
        this.entities = options.entities;
    }

    public getMethods(): Methods {
        return this.methods;
    }

    public getEntities(): Entities {
        return this.entities;
    }

    public createExecutor<Context extends object = object>(actor: Actor, options?: Omit<ExecutorOptions<Context>, 'getMethodNameByInstance'>): Executor<Methods> {
        return new Executor<Methods, Context>(this.methods, actor, {
            ...options,
            tracer: options?.tracer,
            getMethodNameByInstance: this.getMethodNameByInstance.bind(this),
        } as ExecutorOptions<Context>);
    }

    public createActor<T extends keyof Entities>(name: T, roles: InferActorRoles<Entities[T]>, data: InferActorData<Entities[T]>): Actor<T, InferActorRoles<Entities[T]>, InferActorData<Entities[T]>> {
        const entity = this.entities[name];
        if (!entity) {
            throw Errors.invalidEntity();
        }

        return entity.createActor(roles, data);
    }

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
