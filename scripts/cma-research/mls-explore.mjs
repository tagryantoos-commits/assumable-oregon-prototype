#!/usr/bin/env node
/**
 * MLS Manual Exploration Script
 *
 * This script opens a Chrome browser and lets YOU drive — no auto-actions, no
 * time limits. It polls the page state and saves snapshots so we can figure out
 * exactly how to scrape the MLS data.
 *
 * Workflow:
 * 1. Run this script: `node mls-explore.mjs`
 * 2. A Chrome window opens to ppar.com
 * 3. YOU log in, click Elevate MLS, click through to Matrix
 * 4. YOU manually do the Search → Cross Property → Default Search → fill the form → click Results
 * 5. YOU click into the property detail page for 10 Desert Inn Way
 * 6. While you do all that, this script saves HTML snapshots and screenshots
 *    every 5 seconds to ./mls-snapshots/
 * 7. When you're done, press Ctrl+C in the terminal to stop the script
 *
 * After you stop, I can read the snapshots and write proper scraper code
 * based on the actual DOM structure.
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_DIR = path.join(__dirname, 'mls-snapshots');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  // Clear old snapshots so we get a fresh set
  for (const f of fs.readdirSync(SNAPSHOT_DIR)) {
    fs.unlinkSync(path.join(SNAPSHOT_DIR, f));
  }

  console.log('\n' + '='.repeat(60));
  console.log('MLS MANUAL EXPLORATION');
  console.log('='.repeat(60));
  console.log('\nThis script will open a Chrome window and let YOU drive.');
  console.log('No auto-actions. No time limits. No nagging.\n');
  console.log('Steps to take in the browser:');
  console.log('  1. Log in to ppar.com');
  console.log('  2. Click "Elevate MLS"');
  console.log('  3. In Matrix: Search → Cross Property → Default Search');
  console.log('  4. Click "Select None", then check "Sold"');
  console.log('  5. Fill in St # and Street Name');
  console.log('  6. Click "Results"');
  console.log('  7. Click into the listing for 10 Desert Inn Way');
  console.log('  8. Look at all the property data');
  console.log('\nWhile you do this, snapshots will be saved every 5 seconds.');
  console.log(`Snapshots: ${SNAPSHOT_DIR}`);
  console.log('\nWhen you are done, press Ctrl+C in this terminal.\n');

  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // Inject a banner to make this window obvious
  await page.goto('https://ppar.com/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    const banner = document.createElement('div');
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#00aa00;color:white;font-size:20px;font-weight:bold;text-align:center;padding:12px;z-index:999999;font-family:sans-serif;';
    banner.textContent = '🔍 MLS EXPLORATION MODE — Drive freely. Snapshots every 5s.';
    document.body.appendChild(banner);
  }).catch(() => {});

  await page.bringToFront();

  // Poll loop: every 5 seconds, save the current page's HTML, URL, and a screenshot
  let snapshotCount = 0;
  let lastUrl = '';
  const startTime = Date.now();

  // Handle Ctrl+C cleanly
  process.on('SIGINT', async () => {
    console.log('\n\nStopping exploration...');
    console.log(`Saved ${snapshotCount} snapshots to ${SNAPSHOT_DIR}`);
    await browser.close();
    process.exit(0);
  });

  console.log('Started polling. Drive the browser. Press Ctrl+C when done.\n');

  while (true) {
    try {
      // Check ALL pages in the context (in case Elevate MLS opened a new tab)
      const allPages = context.pages();
      for (let i = 0; i < allPages.length; i++) {
        const p = allPages[i];
        const url = p.url();
        if (!url || url === 'about:blank') continue;

        // Save snapshot if URL changed OR every 30 seconds for the same URL
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        if (url !== lastUrl || snapshotCount % 6 === 0) {
          snapshotCount++;
          const num = String(snapshotCount).padStart(3, '0');
          const tabSuffix = allPages.length > 1 ? `-tab${i}` : '';

          // Save URL
          fs.appendFileSync(
            path.join(SNAPSHOT_DIR, 'urls.txt'),
            `[${num}] [${elapsed}s]${tabSuffix} ${url}\n`
          );

          // Save HTML
          try {
            const html = await p.content();
            fs.writeFileSync(path.join(SNAPSHOT_DIR, `${num}${tabSuffix}.html`), html);
          } catch {}

          // Save screenshot
          try {
            await p.screenshot({
              path: path.join(SNAPSHOT_DIR, `${num}${tabSuffix}.png`),
              fullPage: false,
            });
          } catch {}

          // Save body text (easier to grep)
          try {
            const text = await p.textContent('body');
            fs.writeFileSync(path.join(SNAPSHOT_DIR, `${num}${tabSuffix}.txt`), text || '');
          } catch {}

          if (url !== lastUrl) {
            console.log(`  [${elapsed}s] Snapshot ${num}: ${url.slice(0, 100)}`);
            lastUrl = url;
          }
        }
      }
    } catch (err) {
      // Page might be navigating; just keep going
    }

    await sleep(5000);
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
