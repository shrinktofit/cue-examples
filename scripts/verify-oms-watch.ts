import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { startOmsWorker, timed, type OmsProfileResults } from './oms-worker.ts';

const basic = resolve(import.meta.dirname, '../basic');
const require = createRequire(join(basic, 'package.json'));
await mkdir(join(basic, 'temp'), { recursive: true });
const project = await mkdtemp(join(basic, 'temp/oms-watch-'));
const source
  = ('<script>export default { marker: "source-before" '
    + '};</script><style>.icon { background-image: '
    + 'url("../assets/icon.png"); }</style>');
await mkdir(join(project, 'src'));
await mkdir(join(project, 'assets'));
await writeFile(
  join(project, 'package.json'),
  JSON.stringify({ name: 'cue-oms-watch-fixture', type: 'module' }),
);
await writeFile(
  join(project, 'oms.config.js'),
  `import { cue } from ${JSON.stringify(pathToFileURL(require.resolve('@bsgames/oms-plugin-cue')).href)}; export default { plugins: [cue()] };`,
);
await writeFile(
  join(project, 'src/index.ts'),
  'import component from "./app.cc.vue"; console.log(component);',
);
await writeFile(join(project, 'src/app.cc.vue'), source);
await writeFile(join(project, 'assets/icon.png'), '');
const metaPath = join(project, 'assets/icon.png.meta');
const metadata = (uuid: string) =>
  JSON.stringify({ uuid: 'image-root', subMetas: { texture: { importer: 'texture', uuid } } });
await writeFile(metaPath, metadata('image-before'));
let pending: ReturnType<typeof Promise.withResolvers<OmsProfileResults>> | undefined;
const worker = await startOmsWorker(
  project,
  join(basic, 'extensions/oh-my-script'),
  [],
  (result) => {
    pending?.resolve(result.profileResults);
  },
);
const output = () => readFile(join(project, 'temp/oms/out/bundle-main.js'), 'utf8');
const changed = async (edit: () => Promise<unknown>) => {
  // OMS registers new Chokidar subscriptions after build completion, asynchronously.
  await delay(150);
  pending = Promise.withResolvers<OmsProfileResults>();
  await edit();
  return await timed(pending.promise);
};
try {
  /// @case A .cc.vue module is imported directly with an image metadata dependency.
  /// @expect Source and metadata updates rebuild; metadata deletion fails and recreation recovers.
  const initial = await timed(worker.ipc.invoke('rebuild', { profiles: ['default'] }));
  assert.equal(initial.default.ok, true, initial.default.error?.message);
  assert.match(await output(), /source-before/u);
  assert.match(await output(), /image-before/u);
  const metaChanged = await changed(() => writeFile(metaPath, metadata('image-after')));
  assert.equal(metaChanged.default.ok, true, metaChanged.default.error?.message);
  assert.match(await output(), /image-after/u);
  assert.equal(await readFile(join(project, 'src/app.cc.vue'), 'utf8'), source);
  const sourceChanged = await changed(() =>
    writeFile(
      join(project, 'src/app.cc.vue'),
      source.replace('source-before', 'source-after'),
    ),
  );
  assert.equal(sourceChanged.default.ok, true, sourceChanged.default.error?.message);
  assert.match(await output(), /source-after/u);
  const deleted = await changed(() => rm(metaPath));
  assert.equal(deleted.default.ok, false);
  const restored = await changed(() => writeFile(metaPath, metadata('image-restored')));
  assert.equal(restored.default.ok, true, restored.default.error?.message);
  assert.match(await output(), /image-restored/u);
  assert.equal(existsSync(join(project, 'src/generated')), false);
  console.log(
    '[cue-oms-watch] passed: source + metadata update/delete/recreate; no generated inputs',
  );
} finally {
  await worker.close();
  await rm(project, { recursive: true });
}
