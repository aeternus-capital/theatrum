import { Hono } from 'hono';
import { cors } from 'hono/cors';
import Wrapper from './wrapper.ts';
import { serveStatic } from 'hono/deno';
import { poweredBy } from 'hono/powered-by'
import { basicAuth } from 'hono/basic-auth';
import { TheatrumError, type Theatrum, type IEntities, type IMethods } from '@theatrum/core';

type Fetch = Hono extends {
    fetch: infer F;
} ? F : never;

interface ConsoleOptions {
    enableCORS?: boolean;
    enableBasicAuth?: boolean;
    disableTelemetry?: boolean;
    disableLogging?: boolean;
}

class TheatrumConsole {
    app: Hono;
    theatrum: Theatrum<IEntities, IMethods>;
    username: string = 'theatrum';
    password: string = '';
    options: ConsoleOptions;

    constructor(theatrum: Theatrum<IEntities, IMethods>, options?: ConsoleOptions) {
        this.app = new Hono();
        this.theatrum = theatrum;
        this.options = options || {};

        this.setup();
        this.app.use('*', serveStatic({
            root: import.meta.dirname + '/../build',
        }));
    }

    public setup() {
        this.app.use(poweredBy({ serverName: 'Theatrum Console' }));

        this.log(`Telemetry - ${!this.options.disableTelemetry ? 'ENABLED' : 'DISABLED'}`);
        if (this.options.disableTelemetry) {
            this.log(`You have opted-out of Theatrum' anonymous telemetry program. No data will be collected from your machine.`);
        }

        this.log(`CORS (same host) — ${this.options.enableCORS ? 'ENABLED' : 'DISABLED'}`);
        if (this.options.enableCORS) {
            this.app.use(cors());
        }

        this.log(`Secured access (basic auth) — ${this.options.enableBasicAuth ? 'ENABLED' : 'DISABLED'}`);
        if (this.options.enableBasicAuth) {
            this.generateCredentials();

            this.app.use(basicAuth({
                username: this.username,
                password: this.password,
            }));

            this.log(`Username: ${this.username}`);
            this.log(`Auto-generated password: ${this.password}`);
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
                                    entities: methods[x].entities.map((x) => x.name),
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

    public handle(): Fetch {
        return this.app.fetch;
    }

    protected generateCredentials(): string {
        this.password = Math.random().toString(36).slice(2);
        return this.password;
    }

    protected log(x: string): void {
        if (!this.options.disableLogging) {
            console.log(`[Theatrum Console]: ${x}`);
        }
    }
}

export default TheatrumConsole;
