const BACKEND_URL = process.env.NODE_ENV === 'production' ? './api' : 'http://localhost:8000/api';

const handler = ({ result, error }) => new Promise((resolve) => {
    if (error) {
        throw error;
    }

    return resolve(result);
});

export const getFlags = () => fetch(`${BACKEND_URL}/flags`)
    .then((res) => res.json())
    .then(handler);

export const getEntities = () => fetch(`${BACKEND_URL}/entities`)
    .then((res) => res.json())
    .then(handler);

export const getMethods = () => fetch(`${BACKEND_URL}/methods`)
    .then((res) => res.json())
    .then(handler);

export const postActor = (data) => fetch(`${BACKEND_URL}/actor`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
})
    .then((res) => res.json())
    .then(handler);

export const execute = (actor, method, params, debug) => fetch(`${BACKEND_URL}/execute`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        actor,
        method,
        params,
        debug,
    }),
})
    .then((res) => res.json())
    .then(handler);
