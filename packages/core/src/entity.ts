import { z } from 'zod';
import Errors from './errors.ts';
import type { Actor, EntityParams, EntityOptions, DocumentationEntity } from './types.ts';

class Entity<T extends string, Roles extends string = string, Data = any> {
    public name: T;
    public roles: Roles[];
    public schema: EntityParams<Data>;
    public docs: DocumentationEntity<Data>;

    constructor(options: EntityOptions<T, Roles, Data>) {
        this.name = options.name;
        this.schema = options.schema;
        this.docs = options.docs || {};
        this.roles = options.roles || [];
    }

    public validateRoles(roles: Roles[]): boolean {
        return z.string()
            .array()
            .refine((roles) => {
                for (const role of roles) {
                    if (!this.roles.includes(role as Roles)) {
                        return false;
                    }
                }

                return true;
            })
            .safeParse(roles).success;
    }

    public validateData(data: Data): boolean {
        return z.object(this.schema).safeParse(data).success;
    }

    public createActor(roles: Roles[], data: Data): Actor<T, Roles[], Data> {
        if (!this.validateRoles(roles) || !this.validateData(data)) {
            throw Errors.invalidActor(this.name);
        }

        return {
            entity: this.name,
            roles: roles,
            ...data,
        };
    }
}

export default Entity;
