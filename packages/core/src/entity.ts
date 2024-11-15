import { z } from 'zod';
import Errors from './errors.ts';
import type { Actor, EntityParams, EntityOptions, DocumentationEntity } from './types.ts';

/**
 * # Entity
 *
 * @example Create simple entity
 * ```ts
 * import { Entity, Validator } from '@theatrum/core';
 *
 * interface User {
 *     userId: number;
 * }
 *
 * const userEntity = new Entity<'user', never, User>({
 *     name: 'user',
 *     roles: [],
 *     schema: {
 *         userId: Validator.number();
 *     },
 * });
 * ```
 *
 * @example Create entity with roles
 * ```ts
 * import { Entity, Validator } from '@theatrum/core';
 *
 * interface User {
 *     userId: number;
 * }
 *
 * type UserRoles = 'user.admin' | 'user.manager';
 *
 * const userEntity = new Entity<'user', UserRoles, User>({
 *     name: 'user',
 *     roles: [
 *         'user.admin',
 *         'user.manager',
 *     ],
 *     schema: {
 *         userId: Validator.number(),
 *     },
 * });
 * ```
 *
 * @example Create entity with documentation
 * ```ts
 * import { Entity, Validator } from '@theatrum/core';
 *
 * interface User {
 *     userId: number;
 * }
 *
 * const userEntity = new Entity<'user', never, User>({
 *     name: 'user',
 *     roles: [],
 *     schema: {
 *         userId: Validator.number();
 *     },
 *     docs: {
 *         displayName: 'External User',
 *         description: 'This entity used for external users',
 *         examples: [
 *             {
 *                 name: 'Basic user',
 *                 data: {
 *                     userId: 1,
 *                 },
 *             },
 *             {
 *                 name: 'Service user',
 *                 description: 'These users always have negative id',
 *                 data: {
 *                     userId: -100,
 *                 },
 *             },
 *         ],
 *     },
 * });
 * ```
 *
 * @module
 */
class Entity<T extends string, Roles extends string = string, Data = any> {
    /** Entity name */
    public name: T;
    /** All available entity roles */
    public roles: Roles[];
    /** Schema of actor data for validator */
    public schema: EntityParams<Data>;
    /** Documentation about entity, used in @theatrum/console */
    public docs: DocumentationEntity<Data>;

    /**
     * Entity constructor
     *
     * @param {EntityOptions} options Entity options
     *
     * @constructor
     */
    constructor(options: EntityOptions<T, Roles, Data>) {
        this.name = options.name;
        this.schema = options.schema;
        this.docs = options.docs || {};
        this.roles = options.roles || [];
    }

    /**
     * Method validates roles by entity specification
     *
     * @param roles Roles which needs to pass validation
     */
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

    /**
     * Method validate actor data by entity schema
     *
     * @param data Data which needs to pass validation
     */
    public validateData(data: Data): boolean {
        return z.object(this.schema).safeParse(data).success;
    }

    /**
     * Method create actor of entity
     *
     * @param roles Actor roles
     * @param data Actor data
     */
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
