import User from '👤/User.ts';
import MathSum from './sum.ts';
import Admin from '👤/Admin.ts';
import { Method, Validator, ExecutorContext } from '@theatrum/core';

interface MathMultiplyParams {
    a: number;
    b: number;
}

type MathMultiplyResult = number;

const handler = async ({ a, b }: MathMultiplyParams, ctx: ExecutorContext<[typeof User, typeof Admin]>): Promise<MathMultiplyResult> => {
    let result = 0;

    for (let i = 0; i < b; i++) {
        result = await ctx.run(MathSum, {
            a: result,
            b: a,
        });
    }

    return Promise.resolve(result);
};

export default new Method<MathMultiplyParams, MathMultiplyResult>(handler, {
    entities: [ User ],
    roles: [],
    params: {
        a: Validator.number(),
        b: Validator.number(),
    },
    docs: {
        description: 'Метод перемножает числа',
        examples: [
            {
                name: 'Базовое использование',
                params: {
                    a: 2,
                    b: 5
                },
                result: 10,
            },
        ],
    },
});
