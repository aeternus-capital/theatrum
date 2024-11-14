import { ZodError } from 'zod';

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

export class TheatrumError extends Error {
    public readonly code: TheatrumErrorCode;
    public override readonly message: string;

    public constructor(code: TheatrumErrorCode, message: string) {
        super(message);
        this.code = code;
        this.message = message || '';
    }
}

const internalError = (): TheatrumError => {
    return new TheatrumError(TheatrumErrorCode.INTERNAL, 'Internal error');
};

const notYetImplemented = (): TheatrumError => {
    return new TheatrumError(TheatrumErrorCode.NOT_YET_IMPLEMENTED, 'Not yet implemented');
};

const unknownMethod = (): TheatrumError => {
    return new TheatrumError(TheatrumErrorCode.UNKNOWN_METHOD, 'Unknown method');
};

const invalidEntity = (): TheatrumError => {
    return new TheatrumError(TheatrumErrorCode.INVALID_ENTITY, 'Invalid entity');
};

const invalidActor = (name: string): TheatrumError => {
    return new TheatrumError(TheatrumErrorCode.INVALID_ACTOR, `Invalid actor data for "${name}" entity`);
};

const unsupportedActor = (): TheatrumError => {
    return new TheatrumError(TheatrumErrorCode.UNSUPPORTED_ACTOR, 'Unsupported actor for this method');
};

const accessDenied = (): TheatrumError => {
    return new TheatrumError(TheatrumErrorCode.ACCESS_DENIED, 'Access denied');
};

const invalidParams = (e: unknown): TheatrumError => {
    if (e instanceof ZodError) {
        const error = e.errors.filter((x) => x.path.length > 0)[0];
        if (error) {
            return new TheatrumError(TheatrumErrorCode.INVALID_PARAMS, `Invalid param '${error.path.join('.')}': ${error.message}`);
        }
    }

    return new TheatrumError(TheatrumErrorCode.INVALID_PARAMS, 'Invalid params')
};

const notFound = (thing?: string): TheatrumError => {
    return new TheatrumError(TheatrumErrorCode.NOT_FOUND, thing ? `${thing} not found` : 'Not found');
};

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
