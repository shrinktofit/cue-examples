import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function preparePreviewVerification(sceneId: string, projectDirectory: string) {
  const args = process.argv.slice(2);
  const [previewUrl, playwrightPath, screenshotDirectory] = args;
  if (!previewUrl || !playwrightPath || args.length > 3) {
    throw new Error(`Usage: node scripts/${basename(process.argv[1])} <preview-url> <playwright-installation-path> [screenshot-directory]`);
  }
  const targetUrl = new URL(previewUrl);
  targetUrl.searchParams.set('scene', sceneId);
  const outputDirectory = resolve(screenshotDirectory ?? fileURLToPath(
    new URL(`../${projectDirectory}/temp/input-preview/`, import.meta.url),
  ));
  const { chromium } = createRequire(import.meta.url)(playwrightPath);
  await mkdir(outputDirectory, { recursive: true });
  return { chromium, outputDirectory, targetUrl: targetUrl.href };
}
