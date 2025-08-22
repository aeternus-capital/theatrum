import { Theatrum } from '@theatrum/core';
import { TheatrumConsole } from '@theatrum/console';

const entities = {
    'user': (await import('👤/User.ts')).default,
};

const methods = {
    'math.sum': (await import('./methods/math/sum.ts')).default,
    'math.multiply': (await import('./methods/math/multiply.ts')).default,
};

const theatrum = new Theatrum<typeof entities, typeof methods>({
    methods,
    entities,
});

const console = new TheatrumConsole(theatrum);

Deno.serve({
    port: 8000,
    handler: console.handle(),
});
