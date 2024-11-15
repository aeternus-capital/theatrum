import type { ZodType } from 'zod';
import type Method from './method.ts';
import type Entity from './entity.ts';
import type { TheatrumError } from './errors.ts';

/*
    Entity
 */

/** @internal */
export type EntityParams<Params> = {
    [P in keyof Required<Params>]: ZodType<Params[P]>;
};

/** @internal */
interface EntityDocumentationExample<Data> {
    name: string;
    description?: string;
    data: Data;
}

/**
 * Entity documentation
 * @internal
 */
export interface EntityDocumentation<Data> {
    displayName?: string;
    description?: string;
    examples?: EntityDocumentationExample<Data>;
}

/**
 * Entity options
 * @internal
 */
export interface EntityOptions<Tag extends string, Roles, Data> {
    name: Tag;
    schema: EntityParams<Data>;
    roles?: Roles[];
    docs?: EntityDocumentation<Data>;
}

/*
    Actor
 */

/** Actor */
export type Actor<K = string, R = string[], T = object> = T & {
    entity: K;
    roles: R;
};

/** Helper for extract Actor type from entity */
export type InferActor<T extends Entity<string>> = T extends {
    name: infer Name;
    createActor(roles: infer Roles, data: infer Data): unknown;
} ? Actor<Name, Roles, Data> : never;

/** Helper for extract roles type from entity */
export type InferActorRoles<T extends Entity<string>> = T extends {
    createActor(roles: infer Roles, data: unknown): unknown;
} ? Roles : never;

/** Helper for extract data type from entity */
export type InferActorData<T extends Entity<string>> = T extends {
    createActor(roles: unknown, data: infer Data): unknown;
} ? Data : never;

/*
    Executor
 */

/** Helper for extract MethodParams type from method */
export type InferMethodParams<T> = T extends {
    invoke: (params: infer Params, ...args: never[]) => unknown;
} ? Params : never;

/** Helper for extract MethodResult type from method */
export type InferMethodResult<T> = T extends {
    invoke: (...args: never[]) => infer Result;
} ? Awaited<Result> : never;

/** Executor tracer */
export type ExecuteTracer = (timestamp: number, event: string, data?: object | undefined) => void;

/** Executor options */
export type ExecutorOptions<T extends object = object> = T & {
    tracer?: ExecuteTracer;
    getMethodNameByInstance: (method: Method) => string | null;
};

/** @internal */
type ReduceActors<A extends (Entity<string> | unknown)[], Acc = never> = A extends [infer X extends Entity<string>, ...infer T]
    ? ReduceActors<T, Acc | InferActor<X>>
    : Acc;

/** Executor context */
export type ExecutorContext<T extends Entity<string> | Entity<string>[], C extends object = object> =
    Partial<C> & {
        run: <T extends Method>(method: T, params: InferMethodParams<T>) => Promise<InferMethodResult<T>>;
        actor: T extends Entity<string> ? InferActor<T> : T extends Entity<string>[] ? ReduceActors<T> : never;
        tracer: {
            sendEvent: (event: string, data?: object) => void;
        },
        metrics: {
            set: (key: string, value: string | number | boolean) => void;
            unset: (key: string) => void;
            startRecord: (key: string) => void;
            endRecord: (key: string) => void;
        },
    };

/** @internal */
type ExecutorResult<T> = {
    result: T;
};

/** @internal */
type ExecutorError = {
    error: TheatrumError;
};

/** Executor response from wrapper */
export type ExecutorResponse<T> = Partial<ExecutorResult<T>> & Partial<ExecutorError>;

/** Executor metrics */
export type ExecutorMetrics = {
    [K: string]: string | number | boolean
};

/*
    Method
 */

/** Method handler */
export type MethodHandler<Params, Result> =
    (params: Params, context: ExecutorContext<Entity<string> | Entity<string>[], any>) => Promise<Result>;

/** Method params schema */
export type MethodParams<Params> = {
    [P in keyof Required<Params>]: ZodType<Params[P]>;
};

/** Method role compare mode */
export enum MethodRoleCompareMode {
    SOME,
    EVERY,
}

/** @internal */
interface MethodDocumentationExample<Params, Result> {
    name: string;
    description?: string;
    params: Params;
    result: Result;
}

/**
 * Method documentation
 * @internal
 */
export interface MethodDocumentation<Params, Result> {
    description?: string;
    examples?: MethodDocumentationExample<Params, Result>[];
}

/** Method options */
export type MethodOptions<Params, Result> = {
    entities: Entity<string>[];
    roles: string[];
    rolesCompareMode?: MethodRoleCompareMode;
    params: MethodParams<Params>;
    docs?: MethodDocumentation<Params, Result>;
};

/*
    Theatrum
 */

/** Method map */
export interface IMethods {
    /** @internal */
    [k: string]: Method;
}

/** Entities map */
export interface IEntities {
    /** @internal */
    [k: string]: Entity<typeof k>;
}

/** TheatrumOptions */
export interface IOptions<Entities extends IEntities, Methods extends IMethods> {
    methods: Methods;
    entities: Entities;
}
