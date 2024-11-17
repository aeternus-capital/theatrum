import User from '👤/User.ts';
import { Method, Validator } from '@theatrum/core';

interface MathSumParams {
    a: number;
    b: number;
}

type MathSumResult = number;

const handler = ({ a, b }: MathSumParams): Promise<MathSumResult> => {
    return Promise.resolve(a + b);
};

export default new Method<MathSumParams, MathSumResult>(handler, {
    entities: [ User ],
    roles: [],
    params: {
        a: Validator.number(),
        b: Validator.number(),
    },
});
