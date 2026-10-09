import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { startOmsWorker, timed } from './oms-worker.ts';

const command = process.argv[2];
assert.ok(
  command === 'build' || command === 'test',
  'Usage: node ../scripts/build-oms.ts build|test (from a project)',
);
const project = process.cwd();

async function assertDirectCueInputs(): Promise<void> {
  assert.equal(
    existsSync(join(project, 'src/generated')),
    false,
    'Remove the obsolete src/generated directory: OMS must compile .cc.vue directly.',
  );
  const files = await readdir(join(project, 'src'), { recursive: true });
  assert.ok(files.some((file) => file.endsWith('.cc.vue')));
  for (const file of files.filter((file) => /\.(?:ts|vue|js)$/u.test(file))) {
    assert.ok(
      !/\.cc\.vue\.(?:script\.|template\.|style\.)?js$/u.test(file),
      `Unexpected intermediate source ${file}`,
    );
    assert.doesNotMatch(
      await readFile(join(project, 'src', file), 'utf8'),
      /generated\/cue|\.cc\.vue\.js/u,
      file,
    );
  }
  const packageJson = JSON.parse(await readFile(join(project, 'package.json'), 'utf8'));
  assert.equal(packageJson.devDependencies?.['@bsgames/cue-cli'], undefined);
  assert.ok(
    !Object.values(packageJson.scripts).some((script) =>
      String(script).includes('cue compile'),
    ),
  );
}

await assertDirectCueInputs();
const extensionBuildOptions = [];
for (const entry of await readdir(join(project, 'extensions'))) {
  const path = join(project, 'extensions', entry);
  const manifest = JSON.parse(await readFile(join(path, 'package.json'), 'utf8'));
  extensionBuildOptions.push({ name: manifest.name, path });
}
const worker = await startOmsWorker(
  project,
  join(project, 'extensions/oh-my-script'),
  extensionBuildOptions,
);
const { ipc } = worker;
try {
  const profile = command === 'test' ? 'headless' : 'default';
  const result = await timed(ipc.invoke('rebuild', { profiles: [profile] }));
  assert.equal(
    result[profile]?.ok,
    true,
    result[profile]?.error?.message ?? 'Missing profile build result',
  );
  if (command === 'test') {
    await import(
      pathToFileURL(join(project, 'temp/oms/out-headless/bundle-main.headless.js')).href,
    );
  } else {
    const buildDir = resolve(project, 'build/oms-validation');
    await timed(
      ipc.invoke('build-prod', {
        buildDir,
        debug: true,
        sourceMaps: true,
        platform: 'web',
        headless: false,
      }),
    );
    for (const output of [
      'temp/oms/out/bundle-main.js',
      'build/oms-validation/oms/bundle-main.js',
    ]) {
      const code = await readFile(join(project, output), 'utf8');
      assert.ok(
        code.includes('__cueStyleSheets'),
        `Missing compiled Cue component in ${output}`,
      );
      assert.doesNotMatch(code, /generated\/cue/u);
    }
  }
  await assertDirectCueInputs();
  console.log(`[cue-oms-${command}] passed: ${project}; no pre-generated Cue JS`);
} finally {
  await worker.close();
}
