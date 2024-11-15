import { z } from 'zod';
import Errors from './errors.ts';
import type { ZodError } from 'zod';
import type Entity from './entity.ts';
import {
    type MethodParams,
    type MethodHandler,
    type MethodOptions,
    type ExecutorContext,
    MethodRoleCompareMode,
    type MethodDocumentation,
} from './types.ts';

/**
 * # Method
 * Class which contains handler (user function with business logic) and specification which describe how to run it.
 *
 * @example Basic usage
 * ```ts
 * import UserEntity from '@/entity/user.ts';
 * import { Method, Validator, type ExecutorContext } from '@theatrum/core';
 *
 * interface MethodParams {
 *     a: number;
 *     b: number;
 * }
 *
 * type MethodResult = number;
 *
 * const handler = async ({ a, b }: MethodParams, ctx: ExecutorContext<typeof UserEntity>): Promise<MethodResult> => {
 *     return a + b;
 * };
 *
 * export default new Method<MethodParams, MethodResult>(handler, {
 *     entities: [],
 *     roles: [],
 *     params: {
 *         a: Validator.number(),
 *         b: Validator.number(),
 *     },
 * });
 * ```
 *
 * @example Method with documentation
 * ```ts
 * import UserEntity from '@/entity/user.ts';
 * import { Method, Validator, type ExecutorContext } from '@theatrum/core';
 *
 * interface MethodParams {
 *     a: number;
 *     b: number;
 * }
 *
 * type MethodResult = number;
 *
 * const handler = async ({ a, b }: MethodParams, ctx: ExecutorContext<typeof UserEntity>): Promise<MethodResult> => {
 *     return a + b;
 * };
 *
 * export default new Method<MethodParams, MethodResult>(handler, {
 *     entities: [ UserEntity ],
 *     roles: [],
 *     params: {
 *         a: Validator.number(),
 *         b: Validator.number(),
 *     },
 *     docs: {
 *         description: 'Method sums up two numbers',
 *         examples: [
 *             {
 *                 name: 'Basic example',
 *                 params: {
 *                     a: 4,
 *                     b: 5,
 *                 },
 *                 result: 9,
 *             },
 *             {
 *                 name: 'Inverse numbers',
 *                 description: 'Sum of number and its inverse number return zero',
 *                 params: {
 *                     a: 10,
 *                     b: -10,
 *                 },
 *                 result: 0,
 *             },
 *         ],
 *     },
 * });
 * ```
 * @module
 */
class Method<Params = any, Result = any> {
    /** Handler (function) which contains user business logic */
    private readonly handler: MethodHandler<Params, Result>;
    /** Entities which can run method */
    public readonly entities: Entity<string>[];
    /** Roles which needs to be in actor to run method */
    public readonly roles: string[];
    /** Mode of compare actor roles with method specification */
    private readonly rolesCompareMode: MethodRoleCompareMode;
    /** Schema of method params for validator */
    public readonly paramsSchema: MethodParams<Params>;
    /** Documentation about method, used in @theatrum/console */
    public readonly docs: MethodDocumentation<Params, Result>;

    /**
     * Method constructor
     * @param {MethodHandler} handler Handler (function) which contains user business logic
     * @param {MethodOptions} options Method specification describes how to run handler
     */
    constructor(handler: MethodHandler<Params, Result>, options: MethodOptions<Params, Result>) {
        this.handler = handler;
        this.entities = options.entities;
        this.roles = options.roles;
        this.rolesCompareMode = options.rolesCompareMode ?? MethodRoleCompareMode.EVERY;
        this.paramsSchema = options.params;
        this.docs = options.docs || {};
    }

    /**
     * Method run handler in executor context after pass pre-flight checks
     *
     * @param params Method params
     * @param {ExecutorContext} context Executor context
     */
    public async invoke(params: Params, context: ExecutorContext<Entity<string>>): Promise<Result> {
        context.tracer.sendEvent('method:invoked');
        context.tracer.sendEvent('method:check_params', {
            params,
        });

        const checkParams = await this.checkParams(params);
        if (!checkParams.success) {
            throw Errors.invalidParams(checkParams.error);
        }

        context.tracer.sendEvent('method:startup', {
            params,
            context,
        });

        const result = await this.handler(checkParams.data as Params, context);

        context.tracer.sendEvent('method:result', {
            result,
        });

        return result;
    }

    /**
     * Method check whether the entity can run the method
     *
     * @param {string} entityName Name of actor's entity
     */
    public checkEntity(entityName: string): boolean {
        return !!this.entities.find((x: Entity<string>) => x.name === entityName);
    }

    /**
     * Method check whether the actor with its roles can run the method
     *
     * @param {string[]} roles Roles of actor
     */
    public checkRoles(roles: string[]): boolean {
        if (this.rolesCompareMode === MethodRoleCompareMode.SOME) {
            return roles.some((role: string) => this.roles.includes(role));
        }

        return this.roles.every((role: string) => roles.includes(role));
    }

    /**
     * Method check whether the method can be called with the passed parameters
     *
     * @param params Method params
     */
    private checkParams(params: Params): Promise<{ success: boolean, data?: z.infer<z.ZodType>, error?: ZodError }> {
        const paramsSchema = z.object(this.paramsSchema);
        return paramsSchema.safeParseAsync(params);
    }
}

export default Method;
