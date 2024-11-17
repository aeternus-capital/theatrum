import { Entity, Validator } from '@theatrum/core';

interface User {
    userId: number;
}

export default new Entity<'user', never, User>({
    name: 'user',
    roles: [],
    schema: {
        userId: Validator.number(),
    },
});
