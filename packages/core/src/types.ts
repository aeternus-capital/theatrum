import type { ZodType } from 'zod';
import type Method from './method.ts';
import type Entity from './entity.ts';
import type { TheatrumError } from './errors.ts';

/*
    Documentation
 */

interface DocumentationEntityExample<Data> {
    name: string;
    data: Data;
}

export interface DocumentationEntity<Data> {
    displayName?: string;
    description?: string;
    examples?: DocumentationEntityExample<Data>;
}

interface DocumentationMethodExample<Params, Result> {
    name: string;
    description?: string;
    params: Params;
    result: Result;
}

export interface DocumentationMethod<Params, Result> {
    description?: string;
    examples?: DocumentationMethodExample<Params, Result>[];
}

/*
    Entity
 */

export type EntityParams<Params> = {
    [P in keyof Required<Params>]: ZodType<Params[P]>;
};

export interface EntityOptions<Tag extends string, Roles, Data> {
    name: Tag;
    schema: EntityParams<Data>;
    roles?: Roles[];
    docs?: DocumentationEntity<Data>;
}

/*
    Actor
 */

export type Actor<K = string, R = string[], T = object> = T & {
    entity: K;
    roles: R;
};

export type InferActor<T extends Entity<string>> = T extends {
    name: infer Name;
    createActor(roles: infer Roles, data: infer Data): unknown;
} ? Actor<Name, Roles, Data> : never;

export type InferActorRoles<T extends Entity<string>> = T extends {
    createActor(roles: infer Roles, data: unknown): unknown;
} ? Roles : never;

export type InferActorData<T extends Entity<string>> = T extends {
    createActor(roles: unknown, data: infer Data): unknown;
} ? Data : never;

/*
    Executor
 */

export type InferMethodParams<T> = T extends {
    invoke: (params: infer Params, ...args: never[]) => unknown;
} ? Params : never;

export type InferMethodResult<T> = T extends {
    invoke: (...args: never[]) => infer Result;
} ? Awaited<Result> : never;

export type ExecuteTracer = (timestamp: number, event: string, data?: object | undefined) => void;

export type ExecutorOptions<T extends object = object> = T & {
    tracer?: ExecuteTracer;
    getMethodNameByInstance: (method: Method) => string | null;
};

type ReduceActors<A extends (Entity<string> | unknown)[], Acc = never> = A extends [infer X extends Entity<string>, ...infer T]
    ? ReduceActors<T, Acc | InferActor<X>>
    : Acc;

export type ExecutorContext<T extends Entity<string> | Entity<string>[], C extends object = object> =
    Partial<C> & {
        execute: <T extends Method>(method: T, params: InferMethodParams<T>) => Promise<InferMethodResult<T>>;
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

type ExecutorResult<T> = {
    result: T;
};

type ExecutorError = {
    error: TheatrumError;
};

export type ExecutorResponse<T> = Partial<ExecutorResult<T>> & Partial<ExecutorError>;

export type ExecutorMetrics = {
    [K: string]: string | number | boolean
};

/*
    Method
 */

export type MethodHandler<Params, Result> =
    (params: Params, context: ExecutorContext<Entity<string> | Entity<string>[], any>) => Promise<Result>;

export type MethodParams<Params> = {
    [P in keyof Required<Params>]: ZodType<Params[P]>;
};

export enum MethodRoleCompareMode {
    SOME,
    EVERY,
}

export type MethodOptions<Params, Result> = {
    entities: Entity<string>[];
    roles: string[];
    rolesCompareMode?: MethodRoleCompareMode;
    params: MethodParams<Params>;
    docs?: DocumentationMethod<Params, Result>;
};

/*
    Theatrum
 */

export interface IMethods {
    [k: string]: Method;
}

export interface IEntities {
    [K: string]: Entity<typeof K>;
}

export interface IOptions<Entities extends IEntities, Methods extends IMethods> {
    methods: Methods;
    entities: Entities;
}
