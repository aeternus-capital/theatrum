import {
    Errors,
    TheatrumError,
    type Executor,
    type IMethods,
    type InferMethodParams,
    type InferMethodResult,
} from '@theatrum/core';

type WrapperResult<M> = Promise<{
    result?: InferMethodResult<M>;
    error?: unknown;
}>;

const Wrapper = async <T extends keyof IMethods>(execute: Executor<IMethods>, method: T, params: InferMethodParams<IMethods[T]>, debug: boolean): WrapperResult<IMethods[T]> => {
    try {
        return {
            result: await execute.run(method, params),
        };
    } catch (e: any) {
        if (debug) {
            if (e instanceof TheatrumError) {
                return {
                    error: e,
                };
            }

            return {
                error: {
                    message: e?.message || '',
                },
            };
        }

        if (e instanceof TheatrumError) {
            throw e;
        }

        throw Errors.internalError();
    }
};

export default Wrapper;
