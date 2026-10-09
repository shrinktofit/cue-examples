import assert from 'node:assert/strict';
import { fork, type Serializable } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export interface OmsProfileResult {
  ok: boolean;
  error?: { message: string };
}

export type OmsProfileResults = Record<string, OmsProfileResult>;

export interface OmsPassiveBuildResult {
  profileResults: OmsProfileResults;
}

interface OmsIpc {
  invoke(method: 'rebuild', options: { profiles: string[] }): Promise<OmsProfileResults>;
  invoke(method: string, options: unknown): Promise<unknown>;
  listen(method: string, callback: (result: OmsPassiveBuildResult) => void): void;
  dispatch(message: Serializable): void;
  close(reason: string): void;
}

interface OmsProtocol {
  Ipc: new (transport: { send(message: Serializable): boolean }) => OmsIpc;
}

export function timed<T>(operation: Promise<T>): Promise<T> {
  return Promise.race([
    operation,
    new Promise<never>((_, reject) => {
      const timer = setTimeout(
        () => reject(new Error('OMS operation timed out after 120 seconds.')),
        120_000,
      );
      timer.unref();
      operation.then(
        () => clearTimeout(timer),
        () => clearTimeout(timer),
      );
    }),
  ]);
}

/** Test/build harness using only the OMS worker and protocol package exports. */
export async function startOmsWorker(
  project: string,
  extension: string,
  extensionBuildOptions: Array<{ name: string; path: string }>,
  onPassiveBuildEnd?: (result: OmsPassiveBuildResult) => void,
) {
  const omsRequire = createRequire(join(extension, 'package.json'));
  const { Ipc } = (await import(
    pathToFileURL(omsRequire.resolve('@oms/build-core/protocol')).href,
  )) as OmsProtocol;
  const child = fork(omsRequire.resolve('@oms/build-core/main'), [], {
    execArgv: [],
    stdio: [
      'ignore',
      'inherit',
      'inherit',
      'ipc',
    ],
  });
  const exited = new Promise<{ code: number | null; signal: string | null }>((done) => {
    child.once('exit', (code, signal) => done({ code, signal }));
  });
  const boot = Promise.withResolvers<void>();
  const ipc = new Ipc({ send: (message) => child.send(message) });
  child.on('message', (message) => ipc.dispatch(message));
  child.on('error', (error) => {
    boot.reject(error);
    ipc.close(error.message);
  });
  child.on('exit', () => {
    boot.reject(new Error('OMS worker exited'));
    ipc.close('OMS worker exited');
  });
  ipc.listen('bootstrapped', () => boot.resolve());
  for (const method of [
    'pong',
    'build-start',
    'build-end',
    'passive-profile-build-end',
  ]) {
    ipc.listen(method, () => undefined);
  }
  ipc.listen('passive-build-end', (result) => onPassiveBuildEnd?.(result));
  const close = async () => {
    ipc.close('Cue validation finished');
    if (child.connected) {
      child.disconnect();
    }
    const exit = await timed(exited);
    assert.equal(exit.code, 0, `OMS worker exit: ${exit.code}/${exit.signal}`);
  };
  try {
    await timed(boot.promise);
    await timed(ipc.invoke('setup', { project }));
    await timed(ipc.invoke('update-build-options', { extensionBuildOptions }));
    return { ipc, close };
  } catch (error) {
    await close();
    throw error;
  }
}
