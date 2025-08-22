import { Hono } from 'hono';
import assets from './assets.ts';
import { cors } from 'hono/cors';
import Wrapper from './wrapper.ts';
import { poweredBy } from 'hono/powered-by';
import type { ConsoleOptions, Fetch } from './types.ts';
import { TheatrumError, type Theatrum, type IEntities, type IMethods, type Entity } from '@theatrum/core';

const prepareAsset = (path: string): string => {
    return decodeURIComponent(assets[path as keyof typeof assets].content);
};

/**
 * # Theatrum Console
 * WebUI for easier local development using Theatrum framework
 *
 * @example Basic usage
 * ```typescript
 * import { Theatrum } from '@theatrum/core';
 * import { TheatrumConsole } from '@theatrum/console';
 *
 * const entities = {};
 * const methods = {};
 *
 * // your existing theatrum object
 * const theatrum = new Theatrum<typeof entities, typeof methods>({
 *     methods,
 *     entities,
 * });
 *
 * const console = new TheatrumConsole(theatrum);  // just wrap your exising theatrum object
 *
 * Deno.serve(console.handle());  // serve it (for example like in Deno)
 * ```
 * @module
 */
class TheatrumConsole {
    /** @internal */
    public app: Hono;
    private options: ConsoleOptions;
    private theatrum: Theatrum<IEntities, IMethods>;

    /**
     * Constructor
     *
     * @param {Theatrum} theatrum Use your existing theatrum object, created using @theatrum/core (See basic usage example)
     * @param {ConsoleOptions} options Console options
     */
    constructor(theatrum: Theatrum<IEntities, IMethods>, options?: ConsoleOptions) {
        this.app = new Hono();
        this.theatrum = theatrum;
        this.options = options || {};

        this.setup();
    }

    /** Method setup middlewares and set handlers for routes */
    protected setup(): void {
        this.app.use(poweredBy({ serverName: 'Theatrum Console' }));

        this.app.use((c, next) => {
            let path = c.req.path.slice(1);

            if (path === '') {
                path = 'index.html';
            }

            if (assets[path as keyof typeof assets]) {
                c.header('Content-Type', assets[path as keyof typeof assets].mime);
                return Promise.resolve(c.body(prepareAsset(path)));
            }

            return next();
        });

        this.log(`Telemetry - ${!this.options.disableTelemetry ? 'ENABLED' : 'DISABLED'}`);
        if (this.options.disableTelemetry) {
            this.log(`You have opted-out of Theatrum' anonymous telemetry program. No data will be collected from your machine.`);
        }

        this.log(`CORS (same host) — ${this.options.enableCORS ? 'ENABLED' : 'DISABLED'}`);
        if (this.options.enableCORS) {
            this.app.use(cors());
        }

        this.app.get('/api/flags', (c) => {
            return c.json({
                result: {
                    telemetry: !this.options.disableTelemetry,
                },
            });
        });

        this.app.get('/api/entities', (c) => {
            const entities: IEntities = this.theatrum.getEntities();

            return c.json({
                result: (
                    Object.keys(entities)
                        .reduce((a: unknown[], x: string) => {
                            return [
                                ...a,
                                {
                                    ...entities[x],
                                    schema: (
                                        Object.keys(entities[x].schema)
                                            .reduce((a, x) => {
                                                return {
                                                    ...a,
                                                    [x]: {},
                                                };
                                            }, {})
                                    ),
                                },
                            ];
                        }, [])
                ),
            });
        });

        this.app.get('/api/methods', (c) => {
            const methods: IMethods = this.theatrum.getMethods();

            return c.json({
                result: (
                    Object.keys(methods)
                        .reduce((a: unknown[], x: string) => {
                            return [
                                ...a,
                                {
                                    ...methods[x],
                                    name: x,
                                    entities: methods[x].entities.map((x: Entity<string, string>) => x.name),
                                    params: (
                                        Object.keys(methods[x].paramsSchema)
                                            .reduce((a, x) => {
                                                return {
                                                    ...a,
                                                    [x]: {},
                                                };
                                            }, {})
                                    ),
                                },
                            ];
                        }, [])
                ),
            });
        });

        this.app.post('/api/actor', async (c) => {
            const data = await c.req.json().catch(() => null);
            if (data === null) {
                return c.json({
                    error: {
                        message: 'Invalid body',
                    },
                });
            }

            try {
                const { entity, roles, data: actorData } = data;
                const result = this.theatrum.createActor(entity, roles, actorData);

                return c.json({
                    result: result,
                });
            } catch (e) {
                return c.json({
                    error: e instanceof TheatrumError ? {
                        code: e.code,
                        message: e.message,
                    } : {
                        code: 0,
                        message: 'Internal error',
                    },
                });
            }
        });

        this.app.post('/api/execute', async (c) => {
            const data = await c.req.json().catch(() => null);
            if (data === null || !data.actor || !data.method || !data.params) {
                return c.json({
                    error: {
                        code: 0,
                        message: 'Invalid body',
                    },
                });
            }

            try {
                const { entity, roles, data: actorData } = data.actor;
                const traces: { timestamp: number, event: string, data?: object }[] = [];

                const startTime = Date.now();
                const actor = this.theatrum.createActor(entity, roles, actorData);
                const executor = this.theatrum.createExecutor(actor, {
                    ...(data.debug ? {
                        tracer: (timestamp: number, event: string, data?: object) => traces.push({
                            timestamp,
                            event,
                            data,
                        }),
                    } : {}),
                });

                const executeTime = Date.now();
                const { result, error } = await Wrapper(executor, data.method, data.params, !!data.debug);
                const endTime = Date.now();

                if (error && !data.debug) {
                    throw error;
                }

                return c.json({
                    result: {
                        result: error ? { '(error)': error } : result,
                        metrics: {
                            ...executor.exportMetrics(),
                            commonTime: endTime - startTime,
                            executeTime: endTime - executeTime,
                        },
                        ...(data.debug ? {
                            error,
                            tracer: traces,
                        } : {}),
                    },
                });
            } catch (e: any) {
                return c.json({
                    error: e instanceof TheatrumError ? {
                        code: e.code,
                        message: e.message,
                    } : {
                        code: 0,
                        message: `Internal error in console backend: ${e?.message}`,
                    },
                });
            }
        });
    }

    /** Method return Hono's fetch property */
    public handle(): Fetch {
        return this.app.fetch;
    }

    /**
     * Method write data into stdout using `console.log`
     * @param {string} data Information, which need to be logged
     */
    protected log(data: string): void {
        if (!this.options.disableLogging) {
            console.log(`[Theatrum Console]: ${data}`);
        }
    }
}

export default TheatrumConsole;
