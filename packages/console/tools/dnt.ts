import { build, emptyDir } from 'jsr:@deno/dnt@0.41.3';
import denoJson from '../deno.json' with { type: 'json' };

const root = import.meta.dirname + '/../';
await emptyDir(root + 'dnt');

const packageJson = {
    name: denoJson.name,
    version: denoJson.version,
    description: 'Console for @theatrum/core',
    license: denoJson.license,
    repository: {
        type: 'git',
        url: 'git+https://github.com/aeternus-capital/theatrum.git',
    },
    bugs: {
        url: 'https://github.com/aeternus-capital/theatrum/issues',
    },
};

await build({
    shims: {
        deno: true,
    },
    packageManager: 'yarn',
    outDir: root + 'dnt',
    package: packageJson,
    importMap: root + 'dnt.json',
    entryPoints: [ root + 'src/_.ts' ],
    mappings: {

    },
    postBuild(): void {
        Deno.copyFileSync(root + 'README.md', root + 'dnt/README.md');
        Deno.copyFileSync(root + 'LICENSE', root + 'dnt/LICENSE.md');
    },
});
