import { build, emptyDir } from 'jsr:@deno/dnt@0.41.3';
import denoJson from '../deno.json' with { type: 'json' };

const root = import.meta.dirname + '/';
await emptyDir(root + '../npm');

const packageJson = {
    name: denoJson.name,
    version: denoJson.version,
};

await build({
    shims: {
        deno: true,
    },
    outDir: root + '../npm',
    package: packageJson,
    importMap: root + '../deno.json',
    entryPoints: [ root + '../src/_.ts' ],
});
