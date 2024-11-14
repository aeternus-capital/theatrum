import { Entity, Validator } from '@theatrum/core';

interface User {
    userId: number;
}

export default new Entity<'user', 'user.test', User>({
    name: 'user',
    roles: ['user.test'],
    schema: {
        userId: Validator.number(),
    },
    docs: {
        displayName: 'Пользователь',
        description: 'Сущность пользователя',
    },
});
