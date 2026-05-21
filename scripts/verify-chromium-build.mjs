import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist-chromium');
const manifestPath = path.join(dist, 'manifest.json');

const requiredFiles = [
  'manifest.json',
  'content/main.js',
  'background/main.js',
  'popup/popup.html',
  'popup/main.js',
  'options/index.html',
  'options/main.js',
  'content/SilenceDetectorProcessor.js',
  'content/VolumeFilterProcessor.js',
];

for (const file of requiredFiles) {
  const fullPath = path.join(dist, file);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing Chromium build artifact: ${file}`);
  }
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

if (manifest.manifest_version !== 3) {
  throw new Error(`Expected MV3 manifest, got ${manifest.manifest_version}`);
}

if (manifest.name !== 'SpeedLayer') {
  throw new Error(`Expected extension name SpeedLayer, got ${manifest.name}`);
}

if (manifest.version !== '0.1.0') {
  throw new Error(`Expected extension version 0.1.0, got ${manifest.version}`);
}

if (!manifest.background?.service_worker) {
  throw new Error('Chromium manifest is missing a background service worker');
}

if (!manifest.content_scripts?.length) {
  throw new Error('Chromium manifest is missing content scripts');
}

console.log(`Chromium build verified: ${dist}`);
