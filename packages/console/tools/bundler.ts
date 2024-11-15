type Assets = {
    [key: string]: {
        mime: string;
        content: string;
    };
};

const Exts = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript',
};

const getExt = (name: string): string => {
    const split = name.split('.');
    if (Exts[split[split.length - 1] as keyof typeof Exts]) {
        return Exts[split[split.length - 1] as keyof typeof Exts];
    }

    return 'text/plain';
};

const bundler = async (path: string, prefix: string = ''): Promise<Assets> => {
    let assets: Assets = {};

    for await (const file of Deno.readDir(path)) {
        const fileName: string = prefix + file.name;

        if (file.isFile) {
            const content = Deno.readFileSync(path + '/' + file.name);
            assets[fileName] = {
                mime: getExt(fileName),
                content: encodeURIComponent(new TextDecoder().decode(content)),
            };
        }

        if (file.isDirectory) {
            assets = {
                ...assets,
                ...(await bundler(path + '/' + file.name, fileName + '/')),
            };
        }
    }

    return assets;
};

const assets = await bundler(import.meta.dirname + '/../web/dist');
const code =
`// !!! DON'T EDIT THIS FILE MANUALLY !!!
// Run 'deno task bundle' for update this file

export default ${JSON.stringify(assets, undefined, 2)};
`;

await Deno.writeTextFile(import.meta.dirname + '/../src/assets.ts', code);
