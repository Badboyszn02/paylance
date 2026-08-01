/**
 * Visual capture without full Playwright deps if libs are missing.
 * Usage: node e2e/capture-home.mjs
 * Optional: LD_LIBRARY_PATH=... if chrome needs user-extracted libs
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'screenshots');
fs.mkdirSync(outDir, { recursive: true });

const chrome =
  process.env.CHROME_PATH ||
  [
    `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`,
    `${process.env.HOME}/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`,
  ].find((p) => fs.existsSync(p));

if (!chrome) {
  console.error('No chrome binary found');
  process.exit(1);
}

const base = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001';
const shots = [
  { name: 'home-desktop.png', size: '1280,800' },
  { name: 'home-mobile.png', size: '390,844' },
];

for (const s of shots) {
  const out = path.join(outDir, s.name);
  const r = spawnSync(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      `--window-size=${s.size}`,
      `--screenshot=${out}`,
      `${base}/`,
    ],
    { encoding: 'utf8' },
  );
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    process.exit(r.status || 1);
  }
  console.log('wrote', out, fs.statSync(out).size, 'bytes');
}
