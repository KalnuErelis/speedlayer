import { createReadStream } from 'node:fs';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { createServer as createNetServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const extensionDir = path.join(repoRoot, 'dist-chromium');
const fixtureRoot = path.join(repoRoot, 'docs', 'speedlayer');
const host = '127.0.0.1';
const fixturePort = process.env.SPEEDLAYER_SMOKE_PORT
  ? Number.parseInt(process.env.SPEEDLAYER_SMOKE_PORT, 10)
  : await getAvailablePort();
const debugPort = process.env.SPEEDLAYER_CHROME_DEBUG_PORT
  ? Number.parseInt(process.env.SPEEDLAYER_CHROME_DEBUG_PORT, 10)
  : await getAvailablePort();
const smokeSettings = {
  enabled: true,
  applyTo: 'videoOnly',
  omitMutedElements: false,
  dontAttachToCrossOriginMedia: false,
  experimentalControllerType: 1,
  useSeparateMarginSettingsForDifferentAlgorithms: false,
  algorithmSpecificSettings: {
    1: { volumeThreshold: 0.004, marginBefore: 0, marginAfter: 0.08 },
    2: { volumeThreshold: 0.01, marginBefore: 0.05, marginAfter: 0.03 },
  },
  volumeThreshold: 0.004,
  silenceSpeedSpecificationMethod: 'relativeToSoundedSpeed',
  silenceSpeedRaw: 2.4,
  soundedSpeed: 1,
  marginBefore: 0,
  marginAfter: 0.08,
  enableDesyncCorrection: true,
  enableHotkeys: false,
  hotkeys: [],
  popupSpecificHotkeys: [],
  onPlaybackRateChangeFromOtherScripts: 'updateSoundedSpeed',
  badgeWhatSettingToDisplayByDefault: 'none',
  oppositeDayMode: 'off',
  lifetimeTimeSavedComparedToSoundedSpeed: 0,
  lifetimeTimeSavedComparedToIntrinsicSpeed: 0,
  lifetimeWouldHaveLastedIfSpeedWasSounded: 0,
  lifetimeWouldHaveLastedIfSpeedWasIntrinsic: 0,
  weeklyTimeSavedComparedToSoundedSpeed: {
    weekId: '',
    dayTotals: [0, 0, 0, 0, 0, 0, 0],
  },
  videoTimeSavedLeaderboard: [],
};

await assertBuiltExtension();

const server = await startFixtureServer();
const userDataDir = await mkdtemp(path.join(tmpdir(), 'speedlayer-chrome-smoke-'));
const chrome = spawn(await findChromeExecutable(), [
  `--user-data-dir=${userDataDir}`,
  `--remote-debugging-port=${debugPort}`,
  `--disable-extensions-except=${extensionDir}`,
  `--load-extension=${extensionDir}`,
  '--autoplay-policy=no-user-gesture-required',
  '--disable-background-networking',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--no-sandbox',
  ...(process.env.SPEEDLAYER_HEADFUL === '1' ? [] : ['--headless=new']),
], {
  stdio: ['ignore', 'pipe', 'pipe'],
});

let chromeOutput = '';
chrome.stdout.on('data', chunk => chromeOutput += chunk);
chrome.stderr.on('data', chunk => chromeOutput += chunk);
const chromeExit = new Promise(resolve => chrome.once('exit', resolve));

try {
  await waitForChrome();
  const extensionStorage = await ensureExtensionStorage();
  const page = await openPage(`http://${host}:${fixturePort}/docs/speedlayer/manual-test.html`);
  const cdp = createCdpClient(page.webSocketDebuggerUrl);
  await cdp.call('Page.enable');
  await cdp.call('Runtime.enable');
  await waitForPageReady(cdp);
  const result = await playAndWatch(cdp);
  await cdp.close();

  if (!result.sawFastPlayback || !result.sawNormalAfterFastPlayback) {
    const targets = await listTargets();
    throw new Error(
      `SpeedLayer did not switch between fast and normal playback. Result: ${JSON.stringify(result)}\n`
      + `Extension storage keys: ${JSON.stringify(Object.keys(extensionStorage))}\n`
      + `Targets: ${JSON.stringify(targets.map(target => ({
        type: target.type,
        url: target.url,
        title: target.title,
      })))}\n`
      + `Chrome output: ${chromeOutput.slice(-2000)}`
    );
  }

  console.log(JSON.stringify({
    ok: true,
    maxPlaybackRate: result.maxPlaybackRate,
    minPlaybackRateAfterFast: result.minPlaybackRateAfterFast,
    finalCurrentTime: result.lastState.currentTime,
    finalPaused: result.lastState.paused,
  }, null, 2));
} finally {
  await stopChrome();
  server.close();
  await rm(userDataDir, { recursive: true, force: true });
}

async function assertBuiltExtension() {
  try {
    await stat(path.join(extensionDir, 'manifest.json'));
    await stat(path.join(extensionDir, 'content', 'main.js'));
    await stat(path.join(extensionDir, 'popup', 'popup.html'));
  } catch {
    throw new Error('Missing dist-chromium build. Run `corepack yarn build:chromium -- --env noreport` first.');
  }
}

async function findChromeExecutable() {
  if (process.env.CHROME_BIN) {
    return process.env.CHROME_BIN;
  }

  const candidates = process.platform === 'darwin'
    ? [
        '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      ]
    : process.platform === 'win32'
      ? [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        ]
      : [
          'google-chrome',
          'google-chrome-stable',
          'chromium',
          'chromium-browser',
        ];

  if (process.platform !== 'darwin') {
    return candidates[0];
  }

  for (const candidate of candidates) {
    try {
      await stat(candidate);
      return candidate;
    } catch {
      // Try the next browser.
    }
  }

  return candidates[0];
}

async function startFixtureServer() {
  const contentTypes = new Map([
    ['.html', 'text/html; charset=utf-8'],
    ['.mp4', 'video/mp4'],
  ]);

  const server = createHttpServer(async (request, response) => {
    const pathname = new URL(request.url ?? '/', `http://${host}:${fixturePort}`).pathname;
    const fixturePrefix = '/docs/speedlayer/';
    const requestedPath = pathname === '/'
      ? '/manual-test.html'
      : pathname.startsWith(fixturePrefix)
        ? pathname.slice(fixturePrefix.length - 1)
        : pathname;
    const absolutePath = path.resolve(fixtureRoot, `.${decodeURIComponent(requestedPath)}`);

    if (!absolutePath.startsWith(`${fixtureRoot}${path.sep}`)) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    try {
      const fileStat = await stat(absolutePath);
      if (!fileStat.isFile()) {
        throw new Error('Not a file');
      }
      response.writeHead(200, {
        'Content-Length': fileStat.size,
        'Content-Type': contentTypes.get(path.extname(absolutePath)) ?? 'application/octet-stream',
      });
      createReadStream(absolutePath).pipe(response);
    } catch {
      response.writeHead(404);
      response.end('Not found');
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(fixturePort, host, resolve);
  });

  return server;
}

async function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = createNetServer();
    server.once('error', reject);
    server.listen(0, host, () => {
      const address = server.address();
      if (typeof address !== 'object' || address == null) {
        server.close(() => reject(new Error('Could not allocate a local port.')));
        return;
      }
      const { port } = address;
      server.close(() => resolve(port));
    });
  });
}

async function waitForChrome() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 10_000) {
    try {
      const response = await fetch(`http://${host}:${debugPort}/json/version`);
      if (response.ok) {
        return;
      }
    } catch {
      // Keep polling.
    }
    await delay(100);
  }

  throw new Error(`Chrome did not expose DevTools. Output:\n${chromeOutput}`);
}

async function openPage(url) {
  const response = await fetch(`http://${host}:${debugPort}/json/new?${encodeURIComponent(url)}`, {
    method: 'PUT',
  });
  if (!response.ok) {
    throw new Error(`Failed to open smoke page: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function listTargets() {
  const response = await fetch(`http://${host}:${debugPort}/json/list`);
  if (!response.ok) {
    return [];
  }
  return response.json();
}

async function ensureExtensionStorage() {
  const startedAt = Date.now();
  let latestTargets = [];
  while (Date.now() - startedAt < 10_000) {
    const targets = await listTargets();
    latestTargets = targets;
    const serviceWorker = targets.find(target =>
      target.type === 'service_worker'
      && target.url.startsWith('chrome-extension://')
      && target.url.endsWith('/background/main.js')
    );
    const extensionId = serviceWorker?.url.match(/^chrome-extension:\/\/([^/]+)\//)?.[1];
    if (extensionId) {
      const extensionPage = await openPage(`chrome-extension://${extensionId}/popup/popup.html`);
      const cdp = createCdpClient(extensionPage.webSocketDebuggerUrl);
      await cdp.call('Page.enable');
      await cdp.call('Runtime.enable');
      try {
        await waitForDocumentComplete(cdp);
        await waitForExtensionPageStorage(cdp);
        let storage = await evaluate(cdp, 'chrome.storage.local.get(null)', true);
        if (!storage.enabled || !storage.applyTo) {
          await evaluate(cdp, `chrome.storage.local.set(${JSON.stringify(smokeSettings)})`, true);
          storage = await evaluate(cdp, 'chrome.storage.local.get(null)', true);
        }
        await cdp.call('Page.close').catch(() => {});
        await cdp.close();
        return storage;
      } catch (error) {
        await cdp.call('Page.close').catch(() => {});
        await cdp.close();
        throw error;
      }
    }
    await delay(100);
  }

  throw new Error(
    'SpeedLayer extension service worker did not load. '
    + `Targets: ${JSON.stringify(latestTargets.map(target => ({
      type: target.type,
      url: target.url,
      title: target.title,
    })))}\n`
    + `Chrome output: ${chromeOutput.slice(-2000)}`
  );
}

async function waitForDocumentComplete(cdp) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 5_000) {
    if (await evaluate(cdp, 'document.readyState') === 'complete') {
      return;
    }
    await delay(100);
  }
}

async function waitForExtensionPageStorage(cdp) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 5_000) {
    const hasStorage = await evaluate(cdp, 'globalThis.chrome?.storage?.local != null');
    if (hasStorage) {
      return;
    }
    await delay(100);
  }
  const state = await evaluate(cdp, `({
    href: location.href,
    readyState: document.readyState,
    chromeType: typeof globalThis.chrome,
    storageType: typeof globalThis.chrome?.storage,
    bodyText: document.body?.innerText?.slice(0, 200) ?? '',
  })`, true);
  throw new Error(`Extension page did not expose chrome.storage.local: ${JSON.stringify(state)}`);
}

function createCdpClient(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let nextId = 1;
  const pending = new Map();
  const open = new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    const callbacks = pending.get(message.id);
    if (!callbacks) {
      return;
    }
    pending.delete(message.id);
    if (message.error) {
      callbacks.reject(new Error(`${message.error.message}: ${message.error.data ?? ''}`));
    } else {
      callbacks.resolve(message.result);
    }
  });

  return {
    async call(method, params = {}) {
      await open;
      const id = nextId++;
      ws.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
      });
    },
    async close() {
      await open;
      ws.close();
    },
  };
}

async function waitForPageReady(cdp) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 10_000) {
    const readyState = await evaluate(cdp, 'document.readyState');
    const videoReadyState = await evaluate(cdp, 'document.querySelector("video")?.readyState ?? 0');
    if (readyState === 'complete' && videoReadyState >= 1) {
      return;
    }
    await delay(100);
  }
  throw new Error('Fixture page did not finish loading a video element.');
}

async function playAndWatch(cdp) {
  await evaluate(cdp, `
    (async () => {
      const video = document.querySelector("video");
      video.volume = 0.2;
      video.currentTime = 0;
      await video.play();
      return true;
    })()
  `, true);

  let maxPlaybackRate = 0;
  let minPlaybackRateAfterFast = Number.POSITIVE_INFINITY;
  let sawFastPlayback = false;
  let sawNormalAfterFastPlayback = false;
  let lastState;

  for (let i = 0; i < 80; i += 1) {
    lastState = await evaluate(cdp, `(() => {
      const video = document.querySelector("video");
      return {
        currentTime: video.currentTime,
        duration: video.duration,
        paused: video.paused,
        playbackRate: video.playbackRate,
        readyState: video.readyState,
      };
    })()`, true);
    maxPlaybackRate = Math.max(maxPlaybackRate, lastState.playbackRate);
    if (lastState.playbackRate > 1.1) {
      sawFastPlayback = true;
    }
    if (sawFastPlayback) {
      minPlaybackRateAfterFast = Math.min(minPlaybackRateAfterFast, lastState.playbackRate);
      sawNormalAfterFastPlayback ||= lastState.playbackRate < 1.01;
    }
    if (sawFastPlayback && sawNormalAfterFastPlayback && lastState.currentTime > 2) {
      return {
        sawFastPlayback,
        sawNormalAfterFastPlayback,
        maxPlaybackRate,
        minPlaybackRateAfterFast,
        lastState,
      };
    }
    await delay(200);
  }

  return {
    sawFastPlayback,
    sawNormalAfterFastPlayback,
    maxPlaybackRate,
    minPlaybackRateAfterFast,
    lastState,
  };
}

async function evaluate(cdp, expression, awaitPromise = false) {
  const result = await cdp.call('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text);
  }
  return result.result.value;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function stopChrome() {
  if (chrome.exitCode != null) {
    return;
  }

  chrome.kill('SIGTERM');
  const timeout = delay(2_000).then(() => 'timeout');
  if (await Promise.race([chromeExit, timeout]) === 'timeout' && chrome.exitCode == null) {
    chrome.kill('SIGKILL');
    await chromeExit;
  }
}
