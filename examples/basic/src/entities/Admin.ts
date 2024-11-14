import { Entity, Validator } from '@theatrum/core';

interface Admin {
    adminId: number;
}

export default new Entity<'admin', never, Admin>({
    name: 'admin',
    roles: [],
    schema: {
        adminId: Validator.number(),
    },
    docs: {
        displayName: 'Пользователь',
        description: 'Сущность пользователя',
    },
});
