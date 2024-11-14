import User from '👤/User.ts';
import { Theatrum } from '@theatrum/core';
import { TheatrumConsole } from '@theatrum/console';

const entities = {
    'user': User,
};

const methods = {
    'math.sum': (await import('./methods/math/sum.ts')).default,
    'math.multiply': (await import('./methods/math/multiply.ts')).default,
};

const theatrum = new Theatrum<typeof entities, typeof methods>({
    methods,
    entities,
});

Deno.serve({
    hostname: '127.0.0.1',
    port: 8000,
    handler: (
        new TheatrumConsole(theatrum, { disableTelemetry: true }).handle()
    ),
});
