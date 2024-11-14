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
    type DocumentationMethod,
} from './types.ts';

class Method<Params = any, Result = any> {
    private readonly handler: MethodHandler<Params, Result>;
    public readonly entities: Entity<string>[];
    public readonly roles: string[];
    private readonly rolesCompareMode: MethodRoleCompareMode;
    public readonly paramsSchema: MethodParams<Params>;
    public readonly docs: DocumentationMethod<Params, Result>;

    constructor(handler: MethodHandler<Params, Result>, options: MethodOptions<Params, Result>) {
        this.handler = handler;
        this.entities = options.entities;
        this.roles = options.roles;
        this.rolesCompareMode = options.rolesCompareMode ?? MethodRoleCompareMode.EVERY;
        this.paramsSchema = options.params;
        this.docs = options.docs || {};
    }

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

    public checkEntity(entityName: string): boolean {
        return !!this.entities.find((x: Entity<string>) => x.name === entityName);
    }

    public checkRoles(roles: string[]): boolean {
        if (this.rolesCompareMode === MethodRoleCompareMode.SOME) {
            return roles.some((role: string) => this.roles.includes(role));
        }

        return this.roles.every((role: string) => roles.includes(role));
    }

    private checkParams(params: Params): Promise<{ success: boolean, data?: z.infer<z.ZodType>, error?: ZodError }> {
        const paramsSchema = z.object(this.paramsSchema);
        return paramsSchema.safeParseAsync(params);
    }
}

export default Method;
