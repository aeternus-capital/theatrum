import { build, emptyDir } from 'jsr:@deno/dnt@0.41.3';
import denoJson from '../deno.json' with { type: 'json' };

const root = import.meta.dirname + '/../';
await emptyDir(root + 'npm');

const packageJson = {
    name: denoJson.name,
    version: denoJson.version,
    description: 'Framework for developing a multi-entity API backend',
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
    outDir: root + 'npm',
    package: packageJson,
    importMap: root + 'deno.json',
    entryPoints: [ root + 'src/_.ts' ],
    postBuild(): void {
        Deno.copyFileSync(root + 'README.md', root + 'npm/README.md');
        Deno.copyFileSync(root + 'LICENSE', root + 'npm/LICENSE.md');
    },
});
