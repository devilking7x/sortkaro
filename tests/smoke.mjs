// Playwright smoke test for SortKaro.
// Run from ~/workspace/video-build so playwright-core resolves:
//   cd ~/workspace/video-build && node ~/workspace/hackathons-wave4/arbiter-hacks/tests/smoke.mjs
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire('/home/hatch/workspace/video-build/package.json');
const { firefox } = require('playwright-core');

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

const server = http.createServer(async (req, res) => {
  try {
    const file = path.join(DIR, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('not found');
  }
});

let failures = 0;
function check(name, ok, extra = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);
  if (!ok) failures++;
}

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const browser = await firefox.launch({
  executablePath: process.env.HOME + '/.cache/ms-playwright/firefox-1543/firefox/firefox',
});
const page = await browser.newPage();
const consoleErrors = [];
const pageErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => pageErrors.push(String(e)));

await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load' });
check('page title mentions SortKaro', (await page.title()).includes('SortKaro'), await page.title());
check('zero console errors', consoleErrors.length === 0, consoleErrors.join(' | '));
check('zero page errors', pageErrors.length === 0, pageErrors.join(' | '));

// Ask: banana peel -> wet (green bin)
await page.fill('#q', 'banana peel');
await page.click('#askBtn');
await page.waitForTimeout(300);
const r1 = await page.textContent('#result');
check('banana peel -> green/wet bin', /Green bin/i.test(r1), r1.slice(0, 120));

// Ask: old mobile phone -> e-waste
await page.fill('#q', 'old mobile phone');
await page.click('#askBtn');
await page.waitForTimeout(300);
const r2 = await page.textContent('#result');
check('old mobile phone -> e-waste', /E-waste/i.test(r2), r2.slice(0, 120));

// Ask: unknown item -> honest "not sure"
await page.fill('#q', 'quantum flux capacitor');
await page.click('#askBtn');
await page.waitForTimeout(300);
const r3 = await page.textContent('#result');
check('unknown item says not sure', /Not sure/i.test(r3), r3.slice(0, 120));

// Held-out line computed live
const held = await page.textContent('#heldOutLine');
check('held-out line shows 20/20', /20\/20/.test(held), held);

// Category browse shows items
await page.click('.chip >> nth=0');
await page.waitForTimeout(300);
const browse = await page.textContent('#browse');
check('browse list shows items', browse.length > 100, browse.slice(0, 80));

// Quiz starts and grades
await page.click('#startQuiz');
await page.waitForTimeout(300);
const quizItems = await page.$$('#quiz ol li');
check('quiz shows 10 items', quizItems.length === 10, String(quizItems.length));
for (let i = 0; i < 10; i++) {
  await page.locator(`input[name="q${i}"]`).first().check();
}
await page.click('#gradeBtn');
await page.waitForTimeout(300);
const qr = await page.textContent('#quizResult');
check('quiz grades with a score', /Score: \d+\/10/.test(qr), qr.slice(0, 80));

await browser.close();
server.close();
process.exit(failures ? 1 : 0);
