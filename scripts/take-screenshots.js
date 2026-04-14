/**
 * App Store screenshot generator for Patria
 * Renders the Kalyx web app at iPhone 6.9" dimensions.
 * Run: node scripts/take-screenshots.js
 * Requires: python3 -m http.server 8888  (run in /Users/dkgaddy/Projects/Kalyx)
 */

const puppeteer = require('/Users/dkgaddy/Projects/Kalyx/node_modules/puppeteer');
const path = require('path');
const fs   = require('fs');

const KALYX_URL = 'http://localhost:8888';
const OUT_DIR   = path.join(__dirname, '..', 'screenshots');

// iPhone 16 Pro Max: 440×956 logical @ 3x = 1320×2868 actual
const IPHONE = { width: 440, height: 956, deviceScaleFactor: 3 };
// iPad 13": 1024×1366 logical @ 2x = 2048×2732 actual
const IPAD   = { width: 1024, height: 1366, deviceScaleFactor: 2 };

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

const wait = ms => new Promise(r => setTimeout(r, ms));

async function loadApp(page, viewport) {
  await page.setViewport(viewport);
  await page.goto(KALYX_URL, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForSelector('svg', { timeout: 15000 });
  await wait(3000);
}

// Click a button by its visible text
async function clickButton(page, label) {
  await page.evaluate((lbl) => {
    const els = Array.from(document.querySelectorAll('button, [role=button], input[type=button]'));
    const btn = els.find(e => e.textContent?.trim() === lbl || e.value === lbl);
    if (btn) btn.click();
  }, label);
}

// Search for a person and click the first result
async function searchAndSelect(page, query) {
  const input = await page.$('input[type="text"], input[placeholder*="earch"]');
  if (!input) return false;
  await input.click({ clickCount: 3 });
  await input.type(query, { delay: 60 });
  await wait(1200);
  // Click first result
  await page.evaluate(() => {
    const items = document.querySelectorAll('[class*="result"], [class*="item"], li');
    if (items.length > 0) items[0].click();
  });
  await wait(2000);
  return true;
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });

  // ─────────────────────────────────────────────────────────────────────────
  // IPHONE SCREENSHOTS
  // ─────────────────────────────────────────────────────────────────────────
  const page = await browser.newPage();

  // ── 01: Tree view — expanded to show Adam, Eve, Cain, Abel ───────────────
  console.log('01: Tree view...');
  await loadApp(page, IPHONE);
  // Expand YHVH node (click toggle button near center top)
  await page.mouse.click(IPHONE.width / 2, 310);
  await wait(1200);
  // Hit Fit View to frame the tree nicely
  await clickButton(page, 'Fit View');
  await wait(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '01-tree.png') });

  // ── 02: Abraham bio panel ─────────────────────────────────────────────────
  console.log('02: Abraham bio...');
  await loadApp(page, IPHONE);
  await searchAndSelect(page, 'Abram');
  await wait(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '02-abraham-bio.png') });

  // ── 03: Noah bio panel ───────────────────────────────────────────────────
  console.log('03: Noah bio...');
  await loadApp(page, IPHONE);
  await searchAndSelect(page, 'Noah');
  await wait(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '03-noah-bio.png') });

  // ── 04: Search results ───────────────────────────────────────────────────
  console.log('04: Search results...');
  await loadApp(page, IPHONE);
  const input = await page.$('input[type="text"], input[placeholder*="earch"]');
  if (input) {
    await input.click();
    await input.type('Jacob', { delay: 60 });
    await wait(1500);
  }
  await page.screenshot({ path: path.join(OUT_DIR, '04-search.png') });

  // ── 05: Expanded tree — deeper lineage ───────────────────────────────────
  console.log('05: Expanded lineage...');
  await loadApp(page, IPHONE);
  // Navigate to Abraham, then fit view to show full ancestor chain
  await searchAndSelect(page, 'Abram');
  await wait(500);
  await clickButton(page, 'Fit View');
  await wait(1200);
  await page.screenshot({ path: path.join(OUT_DIR, '05-lineage.png') });

  // ─────────────────────────────────────────────────────────────────────────
  // LANDSCAPE — iPad style
  // ─────────────────────────────────────────────────────────────────────────
  console.log('06: Landscape / iPad...');
  await loadApp(page, IPAD);
  await searchAndSelect(page, 'Abram');
  await wait(500);
  await page.screenshot({ path: path.join(OUT_DIR, '06-ipad-landscape.png') });

  await browser.close();

  console.log(`\nDone! Screenshots saved to: ${OUT_DIR}`);
  fs.readdirSync(OUT_DIR).forEach(f => console.log(`  ${f}`));
})();
