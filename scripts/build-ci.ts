import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import {
  compileCue,
  cueFileExtension,
  type CanonicalizeCueImageSourceResult,
} from '@bsgames/cue-compiler';
import { rollup } from 'rollup';
import {
  DiagnosticCategory,
  flattenDiagnosticMessageText,
  ModuleKind,
  ScriptTarget,
  transpileModule,
} from 'typescript';

for (const name of ['basic', 'game-ui-showcase']) {
  const project = resolve(name);
  const sourceDirectory = join(project, 'src');
  const files = await readdir(sourceDirectory, { recursive: true });
  const components = files.filter((file) => file.endsWith(cueFileExtension));
  assert.ok(components.length > 0, `No Cue components found in ${sourceDirectory}.`);
  const modules = new Map<string, string>();
  for (const file of components) {
    const filename = join(sourceDirectory, file);
    const result = compileCue(await readFile(filename, 'utf8'), {
      filename,
      canonicalizeImageSource: (source) => canonicalizeAsset(source, filename, 'sprite-frame'),
      canonicalizeBackgroundImageSource: (source) => canonicalizeAsset(source, filename, 'texture'),
    });
    if (!result.ok) {
      throw new SyntaxError(`${filename}:\n${result.errors.map(String).join('\n')}`);
    }
    for (const output of result.files) {
      modules.set(join(dirname(filename), output.fileName), output.code);
    }
    modules.set(filename, modules.get(join(dirname(filename), result.entryFileName))!);
  }

  const require = createRequire(join(project, 'package.json'));
  const bundle = await rollup({
    input: join(sourceDirectory, 'index.ts'),
    external: (source) =>
      !source.startsWith('.') && !source.startsWith('#') && !isAbsolute(source),
    plugins: [
      {
        name: 'cue-ci',
        resolveId(source, importer) {
          if (source.startsWith('#')) {
            return require.resolve(source);
          }
          if (importer && source.startsWith('.')) {
            const filename = resolve(dirname(importer), source);
            if (modules.has(filename)) {
              return filename;
            }
          }
          return null;
        },
        load(filename) {
          return modules.get(filename) ?? null;
        },
        transform(source, filename) {
          if (!filename.endsWith('.ts')) {
            return null;
          }
          const result = transpileModule(source, {
            fileName: filename,
            reportDiagnostics: true,
            compilerOptions: {
              module: ModuleKind.ESNext,
              target: ScriptTarget.ESNext,
              sourceMap: true,
            },
          });
          const errors = result.diagnostics?.filter(({ category }) =>
            category === DiagnosticCategory.Error,
          ) ?? [];
          if (errors.length > 0) {
            throw new SyntaxError(errors.map(({ messageText }) =>
              flattenDiagnosticMessageText(messageText, '\n'),
            ).join('\n'));
          }
          return { code: result.outputText, map: result.sourceMapText ?? null };
        },
      },
    ],
  });
  try {
    await bundle.write({
      dir: join(project, 'build/ci'),
      entryFileNames: 'bundle-main.js',
      format: 'es',
      sourcemap: true,
    });
  } finally {
    await bundle.close();
  }
  console.log(`${name}: compiled ${components.length} Cue components and bundled src/index.ts`);
}

function canonicalizeAsset(
  source: string,
  filename: string,
  importer: 'sprite-frame' | 'texture',
): CanonicalizeCueImageSourceResult {
  const metaPath = resolve(dirname(filename), `${source}.meta`);
  const meta = JSON.parse(readFileSync(metaPath, 'utf8')) as {
    subMetas?: Record<string, { importer?: string; uuid?: string }>;
  };
  const assets = Object.values(meta.subMetas ?? {}).filter((asset) =>
    asset.importer === importer,
  );
  const [asset] = assets;
  if (assets.length !== 1 || !asset?.uuid) {
    return {
      ok: false,
      error: new SyntaxError(`Expected exactly one ${importer} subasset in ${metaPath}.`),
    };
  }
  return { ok: true, source: `uuid:${asset.uuid}` };
}
