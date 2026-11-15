import { mkdir, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';

const url = process.env.CAPTURE_URL;
const output = process.env.CAPTURE_DIR;
if (!url || !output) throw new Error('Set CAPTURE_URL and CAPTURE_DIR.');
let parsedUrl;
try {
  parsedUrl = new URL(url);
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Unsupported protocol');
} catch {
  throw new Error(`Invalid CAPTURE_URL: ${url}`);
}
const outputDir = resolve(output);
const projectDir = resolve(process.cwd());
if (outputDir === projectDir || outputDir.startsWith(`${projectDir}/`)) {
  throw new Error('CAPTURE_DIR must be outside the project source directory.');
}

const timed = async (label, action) => {
  const start = performance.now();
  try { return await action(); }
  finally { console.log(`${label}: ${(performance.now() - start).toFixed(0)}ms`); }
};
const temporary = (error) => Object.assign(error instanceof Error ? error : new Error(String(error)), { exitCode: 75 });
const runtime = join(process.env.HOME || '', '.local/share/omgithub-playwright');
let chromium;
let launchOptions;
try {
  const require = createRequire(join(runtime, 'package.json'));
  ({ chromium } = require('playwright'));
  const configPath = join(runtime, process.platform === 'darwin' ? 'metal.json' : 'linux.json');
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  launchOptions = config.browser.launchOptions;
  if (process.platform === 'linux') {
    process.env.DISPLAY ||= `:${(await readFile(join(runtime, 'display'), 'utf8')).trim()}`;
  }
} catch (error) {
  throw temporary(new Error(`Unable to load the capture browser configuration: ${error.message}`));
}

await timed('Create capture directory', () => mkdir(outputDir, { recursive: true }));
let browser;
let exitCode = 1;
try {
  browser = await timed('Launch browser', () => chromium.launch({ ...launchOptions, timeout: 30000 }).catch(temporary));
  for (const [name, width, height, mobile] of [
    ['desktop', 1440, 900, false],
    ['mobile', 390, 844, true],
  ]) {
    const page = await timed(`Create ${name} page`, () => browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: mobile ? 1 : 1,
      isMobile: mobile,
      hasTouch: mobile,
    }).catch(temporary));
    page.setDefaultTimeout(20000);
    const pageErrors = [];
    const httpErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('response', (response) => {
      if (response.status() >= 400 && new URL(response.url()).origin === parsedUrl.origin) {
        httpErrors.push(`HTTP ${response.status()} ${response.url()}`);
      }
    });

    let response;
    try {
      response = await timed(`Navigate ${name}`, () => page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }));
    } catch (error) {
      await page.close().catch(() => {});
      throw temporary(new Error(`Temporary navigation failure (${name}): ${error.message}`));
    }
    if (!response?.ok()) {
      await page.close().catch(() => {});
      const status = response?.status();
      const transientStatus = !status || [408, 425, 429, 500, 502, 503, 504].includes(status);
      const error = new Error(`Preview returned HTTP ${status ?? 'no response'} (${name}).`);
      error.exitCode = transientStatus ? 75 : 1;
      throw error;
    }

    try {
      await page.locator('body').waitFor({ state: 'visible' });
      await page.waitForFunction(() => {
        const canvas = document.querySelector('#world');
        const start = document.querySelector('#start-button');
        if (!canvas || !start || canvas.width < 1 || canvas.height < 1) return false;
        try { return Boolean(canvas.getContext('webgl2')); } catch { return false; }
      }, { timeout: 20000 });
      await page.waitForTimeout(1800);
    } catch (error) {
      await page.close().catch(() => {});
      throw new Error(`The FRONTIER scene did not render (${name}): ${error.message}`);
    }

    if (pageErrors.length || httpErrors.length) {
      await page.close().catch(() => {});
      throw new Error(`Application rendering errors (${name}): ${[...pageErrors, ...httpErrors].join('; ')}`);
    }

    const imagePath = join(outputDir, `final-${name}.png`);
    await timed(`Capture ${name}`, () => page.screenshot({ path: imagePath, timeout: 30000 }).catch((error) => {
      if (error.name === 'TimeoutError' || !browser.isConnected()) throw temporary(error);
      throw error;
    }));
    const image = await stat(imagePath);
    if (image.size < 1000) throw new Error(`Screenshot is unexpectedly small: ${imagePath} (${image.size} bytes).`);
    await timed(`Close ${name} page`, () => page.close());
    console.log(`Saved ${imagePath} (${image.size} bytes)`);
  }
  exitCode = 0;
} catch (error) {
  exitCode = error.exitCode || 1;
  console.error(error);
} finally {
  if (browser) {
    try { await timed('Close capture browser', () => browser.close()); }
    catch (error) {
      console.error(`Unable to close capture browser: ${error.message}`);
      if (exitCode === 0) exitCode = 75;
    }
  }
}
process.exitCode = exitCode;
