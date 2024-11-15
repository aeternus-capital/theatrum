import type { Hono } from 'hono';

/**
 * Hono's fetcher
 * @internal
 */
export type Fetch = Hono extends {
    fetch: infer F;
} ? F : never;

/**
 * Theatrum console options
 * @internal
 */
export interface ConsoleOptions {
    /**
     * Set header 'Access-Control-Allow-Origin: *'
     * @default false
     */
    enableCORS?: boolean;
    /**
     * Enable basic auth with auto-generated username and password
     * @default false
     */
    enableBasicAuth?: boolean;
    /**
     * Disable anonymous telemetry
     * We're using posthog. You can check which information we collect in source code ('web' folder)
     * @default false
     */
    disableTelemetry?: boolean;
    /**
     * Disable any logs into stdout about console work
     * @default false
     */
    disableLogging?: boolean;
}
