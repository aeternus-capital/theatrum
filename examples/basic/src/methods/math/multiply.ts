import User from '👤/User.ts';
import MathSum from './sum.ts';
import { Method, ExecutorContext, Validator } from '@theatrum/core';

interface MathMultiplyParams {
    a: number;
    b: number;
}

type MathMultiplyResult = number;

const handler = async ({ a, b }: MathMultiplyParams, context: ExecutorContext<typeof User>): Promise<MathMultiplyResult> => {
    let result: number = 0;

    for (let i = 0; i < a; i++) {
        result = await context.run(MathSum, {
            a: result,
            b,
        });
    }

    return result;
};

export default new Method<MathMultiplyParams, MathMultiplyResult>(handler, {
    entities: [ User ],
    roles: [],
    params: {
        a: Validator.number(),
        b: Validator.number(),
    },
});
