import { ZodError } from 'zod';

/**
 * # Theatrum Error Codes
 *
 * This enum has all error codes which theatrum can use in own errors.
 * Use this for detect which error has returned by theatrum.
 *
 * **Guaranteed that all error codes are positive numbers.**
 *
 * @module
 */
export enum TheatrumErrorCode {
    UNKNOWN,  // for codes shift (all error codes is positive numbers)
    INTERNAL,
    NOT_YET_IMPLEMENTED,
    UNKNOWN_METHOD,
    INVALID_ENTITY,
    INVALID_ACTOR,
    UNSUPPORTED_ACTOR,
    ACCESS_DENIED,
    INVALID_PARAMS,
    NOT_FOUND,
}

/**
 * # Theatrum Error
 *
 * This is base error which used in theatrum for throwing errors.
 * It hasn't sensitive any data or stacktrace and can be safety broadcast to client without escaping.
 *
 * @module
 */
export class TheatrumError extends Error {
    /** Error code */
    public readonly code: TheatrumErrorCode;
    /** Error human-readable description */
    public override readonly message: string;

    /**
     * TheatrumError constructor
     *
     * @param {TheatrumErrorCode} code Code of theatrum error
     * @param {string} message Human-readable error description
     *
     * @constructor
     */
    constructor(code: TheatrumErrorCode, message: string) {
        super(message);
        this.code = code;
        this.message = message || '';
    }
}

/**
 * ##### Internal error (Theatrum Error)
 */
const internalError = (): TheatrumError => {
    return new TheatrumError(TheatrumErrorCode.INTERNAL, 'Internal error');
};

/**
 * ##### Not yet implemented (Theatrum Error)
 */
const notYetImplemented = (): TheatrumError => {
    return new TheatrumError(TheatrumErrorCode.NOT_YET_IMPLEMENTED, 'Not yet implemented');
};

/**
 * ##### Unknown method (Theatrum Error)
 */
const unknownMethod = (): TheatrumError => {
    return new TheatrumError(TheatrumErrorCode.UNKNOWN_METHOD, 'Unknown method');
};

/**
 * ##### Invalid entity (Theatrum Error)
 */
const invalidEntity = (): TheatrumError => {
    return new TheatrumError(TheatrumErrorCode.INVALID_ENTITY, 'Invalid entity');
};

/**
 * ##### Invalid actor (Theatrum Error)
 */
const invalidActor = (name: string): TheatrumError => {
    return new TheatrumError(TheatrumErrorCode.INVALID_ACTOR, `Invalid actor data for "${name}" entity`);
};

/**
 * ##### Unsupported actor (Theatrum Error)
 */
const unsupportedActor = (): TheatrumError => {
    return new TheatrumError(TheatrumErrorCode.UNSUPPORTED_ACTOR, 'Unsupported actor for this method');
};

/**
 * ##### Access denied (Theatrum Error)
 */
const accessDenied = (): TheatrumError => {
    return new TheatrumError(TheatrumErrorCode.ACCESS_DENIED, 'Access denied');
};

/**
 * ##### Invalid params (Theatrum Error)
 *
 * @param e Zod error
 */
const invalidParams = (e: unknown): TheatrumError => {
    if (e instanceof ZodError) {
        const error = e.errors.filter((x) => x.path.length > 0)[0];
        if (error) {
            return new TheatrumError(TheatrumErrorCode.INVALID_PARAMS, `Invalid param '${error.path.join('.')}': ${error.message}`);
        }
    }

    return new TheatrumError(TheatrumErrorCode.INVALID_PARAMS, 'Invalid params')
};

/**
 * ##### Not found (Theatrum Error)
 *
 * @param {string} thing What is not found?
 */
const notFound = (thing?: string): TheatrumError => {
    return new TheatrumError(TheatrumErrorCode.NOT_FOUND, thing ? `${thing} not found` : 'Not found');
};

/**
 * # Theatrum Errors
 *
 * @example How to throw theatrum errors
 * ```ts
 * import { Errors } from '@theatrum/core';
 *
 * throw Errors.internalError();  // static error
 * throw Errors.notFound('User');  // generic error (not every error is generic!)
 * ```
 * @module
 */
export default {
    internalError,
    unknownMethod,
    notYetImplemented,
    invalidEntity,
    invalidActor,
    unsupportedActor,
    accessDenied,
    invalidParams,
    notFound,
};
