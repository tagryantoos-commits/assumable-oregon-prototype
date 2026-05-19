#!/usr/bin/env node
/**
 * CMA Property Research Script
 * Scrapes Zillow, Redfin, El Paso County Assessor, and PPRBD
 * for property details needed for a Comparative Market Analysis.
 *
 * Usage:
 *   node cma-research.mjs          # Run all properties
 *   node cma-research.mjs --test   # Run only first property (10 Desert Inn Way)
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const OUTPUT_FILE = path.join(__dirname, 'cma_comp_details.json');

// ─── Config ──────────────────────────────────────────────────────────────────

const PROPERTIES = [
  '10 Desert Inn Way',
  '14185 Candlewood Court',
  '14430 Bermuda Dunes Way',
  '14925 Pristine Drive',
  '14595 Westchester Drive',
  '15949 Midland Valley Way',
  '240 Mission Hill Way',
  '15848 Woodmeadow Court',
  '15595 Falcon Ridge Court',
  '15935 Woodmeadow Court',
  '14810 Pristine Drive',
  '440 Picasso Court',
];

const ZIP = '80921';
const CITY_STATE = 'Colorado Springs, CO';
const DELAY_MS = 2500; // polite delay between page loads

const TEST_MODE = process.argv.includes('--test');
const MLS_ONLY = process.argv.includes('--mls-only');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function slugify(address) {
  return address.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function makeEmptyProperty(address) {
  return {
    address,
    zip: ZIP,
    sources_checked: [],
    basement: { total_sqft: null, finished_sqft: null, walkout: null, notes: '' },
    heating: { type: '', fuel: '' },
    cooling: { has_ac: null, type: '' },
    fireplace: { count: null, type: '' },
    style: '',
    exterior: '',
    roof: '',
    condition_notes: '',
    lot_features: '',
    extras: [],
    permits: [],
    listing_description: '',
    data_confidence: 'low',
    gaps: [],
  };
}

/** Merge non-empty values from `src` into `target` property object (shallow per-section). */
function mergeProperty(target, src) {
  // Merge basement
  for (const k of ['total_sqft', 'finished_sqft', 'walkout']) {
    if (src.basement?.[k] != null && target.basement[k] == null) target.basement[k] = src.basement[k];
  }
  if (src.basement?.notes && !target.basement.notes) target.basement.notes = src.basement.notes;

  // Merge heating
  if (src.heating?.type && !target.heating.type) target.heating.type = src.heating.type;
  if (src.heating?.fuel && !target.heating.fuel) target.heating.fuel = src.heating.fuel;

  // Merge cooling
  if (src.cooling?.has_ac != null && target.cooling.has_ac == null) target.cooling.has_ac = src.cooling.has_ac;
  if (src.cooling?.type && !target.cooling.type) target.cooling.type = src.cooling.type;

  // Merge fireplace
  if (src.fireplace?.count != null && target.fireplace.count == null) target.fireplace.count = src.fireplace.count;
  if (src.fireplace?.type && !target.fireplace.type) target.fireplace.type = src.fireplace.type;

  // Merge scalars
  for (const k of ['style', 'exterior', 'roof', 'condition_notes', 'lot_features', 'listing_description']) {
    if (src[k] && !target[k]) target[k] = src[k];
  }

  // Merge arrays (append unique)
  if (src.extras?.length) {
    for (const e of src.extras) {
      if (!target.extras.includes(e)) target.extras.push(e);
    }
  }
  if (src.permits?.length) {
    target.permits.push(...src.permits);
  }
}

/** Parse a number from text like "1,234 sqft" → 1234 */
function parseNum(text) {
  if (!text) return null;
  const m = text.replace(/,/g, '').match(/[\d.]+/);
  return m ? parseInt(m[0], 10) : null;
}

/** Compute data_confidence and gaps for a property */
function computeConfidence(prop) {
  const gaps = [];
  if (prop.basement.total_sqft == null) gaps.push('basement_total_sqft');
  if (prop.basement.finished_sqft == null) gaps.push('basement_finished_sqft');
  if (prop.basement.walkout == null) gaps.push('basement_walkout');
  if (!prop.heating.type) gaps.push('heating_type');
  if (prop.cooling.has_ac == null) gaps.push('cooling_has_ac');
  if (prop.fireplace.count == null) gaps.push('fireplace_count');
  if (!prop.style) gaps.push('style');
  if (!prop.exterior) gaps.push('exterior');
  if (!prop.roof) gaps.push('roof');
  if (!prop.lot_features) gaps.push('lot_features');
  if (prop.extras.length === 0) gaps.push('extras');
  if (prop.permits.length === 0) gaps.push('permits');

  prop.gaps = gaps;
  if (gaps.length <= 2) prop.data_confidence = 'high';
  else if (gaps.length <= 5) prop.data_confidence = 'medium';
  else prop.data_confidence = 'low';
}

// ─── Scrapers ────────────────────────────────────────────────────────────────

async function scrapeZillow(page, address) {
  const data = makeEmptyProperty(address);
  const query = `${address}, ${CITY_STATE} ${ZIP}`;
  const slug = slugify(address);

  try {
    console.log(`  [Zillow] Searching: ${query}`);
    await page.goto(`https://www.zillow.com/homes/${encodeURIComponent(query)}_rb/`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await sleep(DELAY_MS);

    // Check for CAPTCHA / block
    const bodyText = await page.textContent('body').catch(() => '');
    if (bodyText.includes('captcha') || bodyText.includes('Press & Hold') || bodyText.includes('verify you are a human')) {
      console.log('  [Zillow] CAPTCHA detected — skipping');
      return { data, blocked: true };
    }

    // Take screenshot
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${slug}-zillow.png`), fullPage: false });

    // Try to find and click into the property detail page if we're on search results
    const detailLink = page.locator('a[data-test="property-card-link"]').first();
    if (await detailLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await detailLink.click();
      await page.waitForLoadState('domcontentloaded');
      await sleep(DELAY_MS);
    }

    // Take detail page screenshot
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${slug}-zillow-detail.png`), fullPage: false });

    // Extract all text from the facts section
    const pageText = await page.textContent('body').catch(() => '');
    const pageTextLower = pageText.toLowerCase();

    // Listing description
    const descEl = page.locator('[data-testid="ds-overview"] .Text-c11n-8-100-2__sc-aiai24-0').first();
    if (await descEl.isVisible({ timeout: 2000 }).catch(() => false)) {
      data.listing_description = (await descEl.textContent()).trim().slice(0, 2000);
    }
    // Fallback: try another common selector
    if (!data.listing_description) {
      const descAlt = page.locator('.ds-overview-section .Text-c11n-8-100-2__sc-aiai24-0, [class*="ListingDescription"]').first();
      if (await descAlt.isVisible({ timeout: 1000 }).catch(() => false)) {
        data.listing_description = (await descAlt.textContent()).trim().slice(0, 2000);
      }
    }

    // Grab all fact items — Zillow organizes as key-value pairs in the facts section
    const factItems = await page.locator('.fact-group-container .fact-label, .fact-group-container .fact-value, [data-testid="facts-table"] span').allTextContents().catch(() => []);
    const factsText = factItems.join(' | ').toLowerCase();

    // Also get the whole page text for regex matching
    const allText = factsText + ' ' + pageTextLower;

    // Basement
    if (allText.includes('walkout')) { data.basement.walkout = true; }
    else if (allText.includes('basement') && allText.includes('no basement')) { data.basement.walkout = false; }
    const basementSqftMatch = allText.match(/basement[:\s]*(\d[,\d]*)\s*(?:sq|sqft|sf)/i);
    if (basementSqftMatch) data.basement.total_sqft = parseNum(basementSqftMatch[1]);
    const finBasementMatch = allText.match(/finished\s*basement[:\s]*(\d[,\d]*)/i);
    if (finBasementMatch) data.basement.finished_sqft = parseNum(finBasementMatch[1]);
    if (allText.includes('unfinished basement')) data.basement.notes = 'unfinished';
    if (allText.includes('partially finished')) data.basement.notes = 'partially finished';
    if (allText.includes('fully finished')) data.basement.notes = 'fully finished';

    // Heating
    if (allText.includes('forced air')) data.heating.type = 'Forced Air';
    else if (allText.includes('baseboard')) data.heating.type = 'Baseboard';
    else if (allText.includes('radiant')) data.heating.type = 'Radiant';
    if (allText.includes('natural gas')) data.heating.fuel = 'Natural Gas';
    else if (allText.includes('electric') && allText.includes('heat')) data.heating.fuel = 'Electric';
    else if (allText.includes('propane')) data.heating.fuel = 'Propane';

    // Cooling
    if (allText.includes('central air') || allText.includes('central a/c') || allText.includes('central ac')) {
      data.cooling.has_ac = true;
      data.cooling.type = 'Central AC';
    } else if (allText.includes('evaporative') || allText.includes('swamp cooler')) {
      data.cooling.has_ac = true;
      data.cooling.type = 'Evaporative';
    } else if (allText.includes('no cooling') || allText.includes('none')) {
      data.cooling.has_ac = false;
    }

    // Fireplace
    const fpMatch = allText.match(/(\d+)\s*fireplace/);
    if (fpMatch) data.fireplace.count = parseInt(fpMatch[1], 10);
    else if (allText.includes('fireplace')) data.fireplace.count = 1;
    else if (allText.includes('no fireplace')) data.fireplace.count = 0;
    if (allText.includes('gas fireplace')) data.fireplace.type = 'Gas';
    else if (allText.includes('wood burning') || allText.includes('wood-burning')) data.fireplace.type = 'Wood';
    else if (allText.includes('electric fireplace')) data.fireplace.type = 'Electric';

    // Style
    if (allText.includes('ranch') || allText.includes('1 story') || allText.includes('single story')) data.style = 'Ranch';
    else if (allText.includes('two-story') || allText.includes('2 story') || allText.includes('two story')) data.style = 'Two-Story';
    else if (allText.includes('tri-level') || allText.includes('tri level')) data.style = 'Tri-Level';
    else if (allText.includes('split level')) data.style = 'Split-Level';
    else if (allText.includes('cape cod')) data.style = 'Cape Cod';
    else if (allText.includes('bi-level')) data.style = 'Bi-Level';

    // Exterior
    if (allText.includes('stucco')) data.exterior = 'Stucco';
    else if (allText.includes('hardboard') || allText.includes('hardie')) data.exterior = 'Hardboard';
    else if (allText.includes('vinyl siding')) data.exterior = 'Vinyl';
    else if (allText.includes('brick')) data.exterior = 'Brick';
    else if (allText.includes('wood siding')) data.exterior = 'Wood';
    else if (allText.includes('stone')) data.exterior = 'Stone';

    // Roof
    if (allText.includes('composition') || allText.includes('comp shingle') || allText.includes('asphalt')) data.roof = 'Composition';
    else if (allText.includes('metal roof')) data.roof = 'Metal';
    else if (allText.includes('concrete tile')) data.roof = 'Concrete Tile';
    else if (allText.includes('tile roof')) data.roof = 'Tile';

    // Extras
    const extras = [];
    if (allText.includes('deck')) extras.push('Deck');
    if (allText.includes('covered patio')) extras.push('Covered Patio');
    else if (allText.includes('patio')) extras.push('Patio');
    if (allText.includes('sprinkler')) extras.push('Sprinklers');
    if (allText.includes('hot tub') || allText.includes('spa')) extras.push('Hot Tub');
    if (allText.includes('wet bar')) extras.push('Wet Bar');
    if (allText.includes('central vacuum')) extras.push('Central Vacuum');
    if (allText.includes('3 car garage') || allText.includes('3-car')) extras.push('3-Car Garage');
    else if (allText.includes('2 car garage') || allText.includes('2-car')) extras.push('2-Car Garage');
    data.extras = extras;

    // Lot features
    const lotFeatures = [];
    if (allText.includes('open space')) lotFeatures.push('Backs to open space');
    if (allText.includes('cul-de-sac') || allText.includes('cul de sac')) lotFeatures.push('Cul-de-sac');
    if (allText.includes('mountain view')) lotFeatures.push('Mountain views');
    if (allText.includes('corner lot')) lotFeatures.push('Corner lot');
    if (allText.includes('greenbelt')) lotFeatures.push('Greenbelt');
    if (lotFeatures.length) data.lot_features = lotFeatures.join(', ');

    // Condition notes from description
    const desc = (data.listing_description || '').toLowerCase();
    const conditions = [];
    const newKitchenMatch = desc.match(/new kitchen|updated kitchen|kitchen remodel|renovated kitchen/);
    if (newKitchenMatch) conditions.push('Updated kitchen');
    const newRoofMatch = desc.match(/new roof|roof replaced|roof \d{4}/);
    if (newRoofMatch) conditions.push('New roof');
    const remodelMatch = desc.match(/remodel(?:ed)?\s*(?:in\s*)?(\d{4})/);
    if (remodelMatch) conditions.push(`Remodeled ${remodelMatch[1]}`);
    if (desc.includes('new flooring') || desc.includes('new floors')) conditions.push('New flooring');
    if (desc.includes('new windows')) conditions.push('New windows');
    if (desc.includes('new paint') || desc.includes('fresh paint') || desc.includes('freshly painted')) conditions.push('Fresh paint');
    if (desc.includes('new appliances') || desc.includes('updated appliances')) conditions.push('Updated appliances');
    if (desc.includes('new hvac') || desc.includes('new furnace') || desc.includes('new ac ') || desc.includes('new a/c')) conditions.push('New HVAC');
    if (conditions.length) data.condition_notes = conditions.join('; ');

    return { data, blocked: false };
  } catch (err) {
    console.log(`  [Zillow] Error: ${err.message}`);
    return { data, blocked: false };
  }
}

async function scrapeRedfin(page, address) {
  const data = makeEmptyProperty(address);
  const query = `${address}, ${CITY_STATE} ${ZIP}`;
  const slug = slugify(address);

  try {
    console.log(`  [Redfin] Searching: ${query}`);
    // Go to redfin homepage and use the search bar
    await page.goto('https://www.redfin.com/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await sleep(DELAY_MS);

    // Dismiss cookie banner if present
    const cookieClose = page.locator('button:has-text("Close"), button[aria-label="Close"]').first();
    if (await cookieClose.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieClose.click().catch(() => {});
      await sleep(500);
    }

    // Type into the search bar
    const searchInput = page.locator('#search-box-input, input[type="search"], input[placeholder*="Search"], input[placeholder*="City"], input[name="searchInputBox"]').first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.click();
      await sleep(500);
      await searchInput.fill(query);
      await sleep(2000); // wait for autocomplete suggestions

      // Click the first autocomplete suggestion that looks like an address match
      const suggestion = page.locator('.SearchBoxAutocomplete .item-row, [class*="autocomplete"] [class*="item"], [data-rf-test-name="searchResult"]').first();
      if (await suggestion.isVisible({ timeout: 3000 }).catch(() => false)) {
        await suggestion.click();
        await page.waitForLoadState('domcontentloaded');
        await sleep(DELAY_MS);
      } else {
        // Fall back to pressing Enter
        await searchInput.press('Enter');
        await page.waitForLoadState('domcontentloaded');
        await sleep(DELAY_MS);
      }
    } else {
      console.log('  [Redfin] Could not find search input');
      return { data, blocked: false };
    }

    // Check for CAPTCHA or error page
    const bodyText = await page.textContent('body').catch(() => '');
    if (bodyText.includes('captcha') || bodyText.includes('not a robot')) {
      console.log('  [Redfin] CAPTCHA detected — skipping');
      return { data, blocked: true };
    }
    if (bodyText.includes('Oops') && bodyText.includes('lost that one')) {
      console.log('  [Redfin] Property not found on Redfin');
      return { data, blocked: false };
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${slug}-redfin.png`), fullPage: false });

    // If on search results page, click into first result
    const firstResult = page.locator('.HomeCardContainer a, .HomeViews a[href*="/CO/"]').first();
    if (await firstResult.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstResult.click();
      await page.waitForLoadState('domcontentloaded');
      await sleep(DELAY_MS);
    }

    // Scroll down to load property details
    await page.evaluate(() => window.scrollBy(0, 2000));
    await sleep(2000);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${slug}-redfin-detail.png`), fullPage: false });

    // Get all visible text for parsing
    const detailText = (await page.textContent('body').catch(() => '')).toLowerCase();

    // Listing description
    const descEl = page.locator('#marketing-remarks-scroll, .remarks, [data-testid="listing-description"], .ListingRemarks').first();
    if (await descEl.isVisible({ timeout: 2000 }).catch(() => false)) {
      data.listing_description = (await descEl.textContent()).trim().slice(0, 2000);
    }

    const allText = detailText;

    // Basement
    if (allText.includes('walkout basement')) { data.basement.walkout = true; data.basement.notes = 'walkout'; }
    else if (allText.includes('daylight basement')) { data.basement.walkout = false; data.basement.notes = 'daylight'; }
    const bsmtMatch = allText.match(/basement\s*(?:area|sq\s*ft|sqft)?[:\s]*(\d[,\d]*)\s*(?:sq|sf)/);
    if (bsmtMatch) data.basement.total_sqft = parseNum(bsmtMatch[1]);
    const finMatch = allText.match(/finished\s*(?:basement)?\s*(?:area|sq\s*ft)?[:\s]*(\d[,\d]*)/);
    if (finMatch) data.basement.finished_sqft = parseNum(finMatch[1]);
    if (allText.includes('unfinished basement')) data.basement.notes = data.basement.notes || 'unfinished';
    if (allText.includes('partially finished')) data.basement.notes = data.basement.notes || 'partially finished';

    // Heating
    if (allText.includes('forced air')) data.heating.type = 'Forced Air';
    else if (allText.includes('baseboard')) data.heating.type = 'Baseboard';
    else if (allText.includes('radiant')) data.heating.type = 'Radiant';
    if (allText.includes('natural gas')) data.heating.fuel = 'Natural Gas';
    else if (allText.includes('electric heat')) data.heating.fuel = 'Electric';

    // Cooling
    if (allText.includes('central air') || allText.includes('central a/c')) {
      data.cooling.has_ac = true;
      data.cooling.type = 'Central AC';
    } else if (allText.includes('evaporative')) {
      data.cooling.has_ac = true;
      data.cooling.type = 'Evaporative';
    } else if (allText.includes('no cooling')) {
      data.cooling.has_ac = false;
    }

    // Fireplace
    const fpMatch = allText.match(/(\d+)\s*fireplace/);
    if (fpMatch) data.fireplace.count = parseInt(fpMatch[1], 10);
    else if (allText.includes('fireplace') && !allText.includes('no fireplace')) data.fireplace.count = 1;
    if (allText.includes('gas fireplace')) data.fireplace.type = 'Gas';
    else if (allText.includes('wood burning')) data.fireplace.type = 'Wood';

    // Style
    if (allText.match(/\b(ranch|1[- ]story|single story)\b/)) data.style = 'Ranch';
    else if (allText.match(/\b(two[- ]story|2[- ]story)\b/)) data.style = 'Two-Story';
    else if (allText.match(/\btri[- ]level\b/)) data.style = 'Tri-Level';
    else if (allText.match(/\bsplit[- ]level\b/)) data.style = 'Split-Level';
    else if (allText.match(/\bbi[- ]level\b/)) data.style = 'Bi-Level';

    // Exterior / Roof
    if (allText.includes('stucco')) data.exterior = 'Stucco';
    else if (allText.includes('vinyl')) data.exterior = 'Vinyl';
    else if (allText.includes('brick')) data.exterior = 'Brick';
    else if (allText.includes('wood siding')) data.exterior = 'Wood';
    if (allText.includes('composition') || allText.includes('asphalt shingle')) data.roof = 'Composition';
    else if (allText.includes('metal roof')) data.roof = 'Metal';
    else if (allText.includes('tile roof')) data.roof = 'Tile';

    // Extras
    if (allText.includes('deck')) data.extras.push('Deck');
    if (allText.includes('covered patio')) data.extras.push('Covered Patio');
    else if (allText.includes('patio')) data.extras.push('Patio');
    if (allText.includes('sprinkler')) data.extras.push('Sprinklers');
    if (allText.includes('hot tub')) data.extras.push('Hot Tub');
    if (allText.includes('wet bar')) data.extras.push('Wet Bar');

    // Lot
    const lots = [];
    if (allText.includes('open space')) lots.push('Backs to open space');
    if (allText.includes('cul-de-sac')) lots.push('Cul-de-sac');
    if (allText.includes('mountain view')) lots.push('Mountain views');
    if (lots.length) data.lot_features = lots.join(', ');

    return { data, blocked: false };
  } catch (err) {
    console.log(`  [Redfin] Error: ${err.message}`);
    return { data, blocked: false };
  }
}

async function scrapeAssessor(page, address) {
  const data = makeEmptyProperty(address);
  const slug = slugify(address);

  try {
    console.log(`  [Assessor] Searching: ${address}`);
    await page.goto('https://property.spatialest.com/co/elpaso/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await sleep(4000); // JS app needs extra load time

    // The site has a search bar at the top — try various selectors
    const searchInput = page.locator('input[type="text"], input[type="search"], input[placeholder*="search" i], input[placeholder*="address" i], input[placeholder*="parcel" i]').first();
    if (await searchInput.isVisible({ timeout: 8000 }).catch(() => false)) {
      await searchInput.click();
      await sleep(500);
      await searchInput.fill(address);
      await sleep(2000);

      // Look for autocomplete/suggestion dropdown
      const suggestion = page.locator('.suggestion, .autocomplete-item, [class*="suggestion"], [class*="result"] li, [class*="dropdown"] li, [class*="search-result"]').first();
      if (await suggestion.isVisible({ timeout: 3000 }).catch(() => false)) {
        await suggestion.click();
        await sleep(3000);
      } else {
        await searchInput.press('Enter');
        await sleep(3000);
      }
    } else {
      console.log('  [Assessor] Could not find search input — trying alternate approach');
      // Some versions have a search icon/button to open search
      const searchBtn = page.locator('button[class*="search"], [class*="search-icon"], .fa-search').first();
      if (await searchBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await searchBtn.click();
        await sleep(1000);
        const input2 = page.locator('input:visible').first();
        await input2.fill(address);
        await sleep(1000);
        await input2.press('Enter');
        await sleep(3000);
      } else {
        console.log('  [Assessor] Could not find any search mechanism');
        return { data, blocked: false };
      }
    }

    // Click first search result if there's a result list
    const resultLink = page.locator('a[href*="parcel"], .search-result a, .result-item a, [class*="result"] a, table tbody tr a').first();
    if (await resultLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await resultLink.click();
      await sleep(3000);
    }

    // Take screenshot of the overview page
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${slug}-assessor-overview.png`), fullPage: false });

    // Get the current URL and try to navigate directly to the building details tab
    const currentUrl = page.url();
    console.log(`  [Assessor] Current URL: ${currentUrl}`);

    // Get all tab hrefs to find the building details URL
    const tabInfo = await page.evaluate(() => {
      const links = document.querySelectorAll('a');
      const tabs = [];
      for (const a of links) {
        const text = a.textContent.trim();
        if (text.includes('Details') || text.includes('Overview') || text.includes('History')) {
          tabs.push({ text, href: a.href, onclick: a.getAttribute('onclick') || '' });
        }
      }
      return tabs;
    }).catch(() => []);
    console.log(`  [Assessor] Found tabs:`, JSON.stringify(tabInfo));

    // Find and navigate to the building details tab
    const buildingTab = tabInfo.find(t => t.text.includes('Building'));
    if (buildingTab?.href && buildingTab.href !== '#' && buildingTab.href !== currentUrl) {
      console.log(`  [Assessor] Navigating to building details: ${buildingTab.href}`);
      await page.goto(buildingTab.href, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(4000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${slug}-assessor-building.png`), fullPage: false });
    } else {
      // Try clicking the tab with force
      const tab = page.locator('a:text-is("Buildings Details")').first();
      if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('  [Assessor] Clicking Buildings Details tab with force');
        await tab.click({ force: true });
        await sleep(4000);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${slug}-assessor-building.png`), fullPage: false });
      } else {
        console.log('  [Assessor] Buildings Details tab not found');
      }
    }

    // Parse the Building Details table — find the table that contains "Style Description"
    const tableData = await page.evaluate(() => {
      const data = {};
      const tables = document.querySelectorAll('table');
      for (const table of tables) {
        const tableText = table.textContent || '';
        // The building details table contains "Style Description" — that's unique to it
        if (tableText.includes('Style Description') || tableText.includes('Total Basement Area')) {
          const cells = table.querySelectorAll('td');
          for (let j = 0; j < cells.length - 1; j++) {
            const key = cells[j].textContent.trim();
            const val = cells[j + 1].textContent.trim();
            if (key && val && val !== '-' && key.length > 2) {
              data[key.toLowerCase()] = val;
            }
          }
          break; // found our table, stop
        }
      }
      return data;
    }).catch(() => ({}));
    console.log(`  [Assessor] Parsed ${Object.keys(tableData).length} building detail fields`);
    // Log ALL parsed fields for debugging
    for (const [k, v] of Object.entries(tableData)) {
      console.log(`    ${k}: ${v}`);
    }

    // Extract from parsed table data first
    if (tableData['style description']) {
      const sd = tableData['style description'].toLowerCase();
      if (sd.includes('ranch') || sd.includes('1 story')) data.style = 'Ranch';
      else if (sd.includes('two story') || sd.includes('2 story')) data.style = 'Two-Story';
      else if (sd.includes('tri')) data.style = 'Tri-Level';
      else if (sd.includes('bi-level') || sd.includes('bi level')) data.style = 'Bi-Level';
      else if (sd.includes('split')) data.style = 'Split-Level';
      else data.style = tableData['style description']; // use raw value
    }
    if (tableData['total basement area']) data.basement.total_sqft = parseNum(tableData['total basement area']);
    if (tableData['finished basement area']) data.basement.finished_sqft = parseNum(tableData['finished basement area']);
    if (tableData['garage description']) {
      const gd = tableData['garage description'].toLowerCase();
      const ga = tableData['garage area'] || '';
      if (gd.includes('attached')) data.extras.push(`Attached Garage (${ga} sqft)`);
      else if (gd.includes('detached')) data.extras.push(`Detached Garage (${ga} sqft)`);
      else data.extras.push(`Garage: ${tableData['garage description']} (${ga} sqft)`);
    }
    if (tableData['lower level living area'] && parseNum(tableData['lower level living area']) > 0) {
      data.basement.notes = data.basement.notes || 'has lower level living area';
    }

    // Get ALL text from the page for keyword-based fallback parsing
    const bodyText = (await page.textContent('body').catch(() => '')).toLowerCase();

    // Style — assessor often uses specific terms
    if (bodyText.match(/\b(1\s*(?:sty|story)|ranch|one story|1\.0 story)\b/)) data.style = 'Ranch';
    else if (bodyText.match(/\b(2\s*(?:sty|story)|two story|2\.0 story)\b/)) data.style = 'Two-Story';
    else if (bodyText.match(/\btri[- ]?level\b/)) data.style = 'Tri-Level';
    else if (bodyText.match(/\bbi[- ]?level\b/)) data.style = 'Bi-Level';
    else if (bodyText.match(/\bsplit[- ]?level\b/)) data.style = 'Split-Level';
    else if (bodyText.match(/\b(raised ranch)\b/)) data.style = 'Raised Ranch';

    // Basement from assessor — look for "basement" or "bsmt" with sqft
    // Assessors often report: "Basement Area: 1,234", "Finished Basement: 800"
    const basementMatch = bodyText.match(/(?:basement|bsmt)\s*(?:area|sq\s*ft|sqft|sf)?[:\s]*(\d[,\d]*)/);
    if (basementMatch) data.basement.total_sqft = parseNum(basementMatch[1]);
    const finBsmt = bodyText.match(/(?:finished|fin)\s*(?:bsmt|basement)\s*(?:area|sq\s*ft)?[:\s]*(\d[,\d]*)/);
    if (finBsmt) data.basement.finished_sqft = parseNum(finBsmt[1]);
    const unfinBsmt = bodyText.match(/(?:unfinished|unfin)\s*(?:bsmt|basement)\s*(?:area)?[:\s]*(\d[,\d]*)/);
    if (unfinBsmt) {
      const unfinSqft = parseNum(unfinBsmt[1]);
      if (data.basement.total_sqft && unfinSqft) {
        data.basement.finished_sqft = data.basement.total_sqft - unfinSqft;
      }
    }
    // Walkout
    if (bodyText.includes('walkout') || bodyText.includes('walk-out') || bodyText.includes('walk out')) {
      data.basement.walkout = true;
    }
    // Full/partial/none basement
    if (bodyText.includes('full basement') || bodyText.includes('full bsmt')) data.basement.notes = 'full';
    else if (bodyText.includes('partial basement') || bodyText.includes('partial bsmt')) data.basement.notes = 'partial';
    else if (bodyText.includes('no basement') || bodyText.includes('slab')) data.basement.notes = 'none/slab';

    // Exterior
    if (bodyText.includes('stucco')) data.exterior = 'Stucco';
    else if (bodyText.includes('hardboard') || bodyText.includes('hardiboard') || bodyText.includes('cement fiber')) data.exterior = 'Hardboard/Fiber Cement';
    else if (bodyText.includes('vinyl siding') || bodyText.includes('vinyl sid')) data.exterior = 'Vinyl';
    else if (bodyText.match(/\bbrick\b/)) data.exterior = 'Brick';
    else if (bodyText.includes('wood frame') || bodyText.includes('wood siding')) data.exterior = 'Wood';
    else if (bodyText.includes('stone')) data.exterior = 'Stone';

    // Roof
    if (bodyText.includes('composition') || bodyText.includes('comp shingle') || bodyText.includes('asphalt')) data.roof = 'Composition';
    else if (bodyText.includes('metal roof') || bodyText.match(/roof[:\s]*metal/)) data.roof = 'Metal';
    else if (bodyText.includes('concrete tile')) data.roof = 'Concrete Tile';
    else if (bodyText.includes('tile roof') || bodyText.match(/roof[:\s]*tile/)) data.roof = 'Tile';

    // Heating/Cooling from assessor
    if (bodyText.includes('forced air') || bodyText.includes('forced warm air') || bodyText.includes('fa heat')) data.heating.type = 'Forced Air';
    else if (bodyText.includes('baseboard')) data.heating.type = 'Baseboard';
    else if (bodyText.includes('radiant')) data.heating.type = 'Radiant';
    if (bodyText.includes('gas heat') || bodyText.includes('natural gas')) data.heating.fuel = 'Natural Gas';
    else if (bodyText.includes('electric heat')) data.heating.fuel = 'Electric';

    if (bodyText.includes('central air') || bodyText.includes('central a/c') || bodyText.match(/(?:ac|a\/c|air cond)[:\s]*(?:yes|central)/)) {
      data.cooling.has_ac = true;
      data.cooling.type = 'Central AC';
    } else if (bodyText.match(/(?:ac|a\/c|air cond)[:\s]*no/) || bodyText.includes('no air conditioning') || bodyText.includes('none')) {
      // Only set false if context is clearly about AC
      if (bodyText.includes('cooling') && bodyText.includes('none')) data.cooling.has_ac = false;
    }

    // Fireplace
    const fpCount = bodyText.match(/fireplace[s]?\s*[:\s]*(\d)/);
    if (fpCount) data.fireplace.count = parseInt(fpCount[1], 10);
    else if (bodyText.match(/(\d)\s*fireplace/)) data.fireplace.count = parseInt(bodyText.match(/(\d)\s*fireplace/)[1], 10);
    // Assessor usually doesn't say gas vs wood

    // Garage
    if (bodyText.match(/3\s*(?:car|stall)\s*garage/)) data.extras.push('3-Car Garage');
    else if (bodyText.match(/2\s*(?:car|stall)\s*garage/)) data.extras.push('2-Car Garage');

    return { data, blocked: false };
  } catch (err) {
    console.log(`  [Assessor] Error: ${err.message}`);
    return { data, blocked: false };
  }
}

async function scrapePPRBD(page, address) {
  const data = makeEmptyProperty(address);
  const slug = slugify(address);

  try {
    console.log(`  [PPRBD] Searching permits: ${address}`);

    // Parse street number and name from address
    const addrMatch = address.match(/^(\d+)\s+(.+)$/);
    if (!addrMatch) {
      console.log('  [PPRBD] Could not parse address');
      return { data, blocked: false };
    }
    const streetNum = addrMatch[1];
    const streetName = addrMatch[2];
    // PPRBD auto-complete expects just the street name without suffix (Way, Court, Drive, etc.)
    // Try the full name first, fall back to without suffix
    const streetNameBase = streetName.replace(/\s+(Way|Court|Ct|Drive|Dr|Street|St|Avenue|Ave|Boulevard|Blvd|Lane|Ln|Place|Pl|Circle|Cir|Road|Rd|Trail|Trl)$/i, '');

    await page.goto('https://account.pprbd.org/publicaccess/AddressSearch.aspx', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await sleep(3000);

    // Use the known ASP.NET field IDs from our first test run
    const lowField = page.locator('#ctl00_BodyPlaceHolder_textpjadlo_in');
    const highField = page.locator('#ctl00_BodyPlaceHolder_textpjadhi_in');
    const streetField = page.locator('#ctl00_BodyPlaceHolder_textpjstname_in');
    const permitsRadio = page.locator('#ctl00_BodyPlaceHolder_radioPermitSearch');
    const searchBtn = page.locator('#ctl00_BodyPlaceHolder_SearchBtn');

    const allInputs = page.locator('input[type="text"]:visible');
    const inputCount = await allInputs.count();

    if (await lowField.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log(`  [PPRBD] Found fields by ID, filling form`);
      await lowField.fill(streetNum);
      await sleep(300);
      await highField.fill(streetNum);
      await sleep(300);
      // Try base name first (without suffix) — PPRBD auto-completes street names
      await streetField.fill(streetNameBase);
      await sleep(2000);

      // Select Permits radio
      await permitsRadio.click();
      console.log(`  [PPRBD] Selected Permits radio button`);
      await sleep(500);

      // Submit the form via JavaScript — the click triggers a full ASP.NET postback.
      // page.evaluate will throw "context destroyed" because of the navigation — that's expected.
      await page.evaluate(() => {
        const btn = document.getElementById('ctl00_BodyPlaceHolder_SearchBtn');
        if (btn) btn.click();
      }).catch(() => {}); // context destroyed = navigation happened = success
      // Wait for the results page to load
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      await sleep(4000);
    } else if (inputCount >= 3) {
      console.log(`  [PPRBD] Falling back to positional fill`);
      await allInputs.nth(0).fill(streetNum);
      await sleep(300);
      await allInputs.nth(1).fill(streetNum);
      await sleep(300);
      await allInputs.nth(2).fill(streetNameBase);
      await sleep(1500);
      const submitBtn = page.locator('input[type="submit"]:visible').first();
      if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitBtn.click();
        await page.waitForLoadState('domcontentloaded');
        await sleep(4000);
      }
    } else {
      console.log('  [PPRBD] No text inputs found on page');
      return { data, blocked: false };
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${slug}-pprbd.png`), fullPage: false });

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${slug}-pprbd.png`), fullPage: false });

    // Parse permit results using page.evaluate to read the table structure cleanly
    const permitRows = await page.evaluate(() => {
      const results = [];
      // PPRBD results are in a table — find rows with permit data
      const rows = document.querySelectorAll('table tr');
      for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length < 4) continue;
        // Extract cell text values
        const cellTexts = Array.from(cells).map(c => c.textContent.trim());
        const rowText = cellTexts.join(' | ');
        // Skip header rows and empty rows
        if (rowText.includes('Address') && rowText.includes('Permit') && rowText.includes('Code')) continue;
        if (!rowText.match(/\d/)) continue;
        results.push(cellTexts);
      }
      return results;
    }).catch(() => []);

    console.log(`  [PPRBD] Found ${permitRows.length} permit rows`);

    const permits = [];
    for (const cells of permitRows) {
      const rowText = cells.join(' ').toLowerCase();
      // Skip rows that are just the address with no permit info
      if (cells.length < 5) continue;

      // Try to extract: permit number, project description, issued date
      // The table columns are typically: Address, City, Zip, Permit#, CO#, CO Date, Code, Project Description, Issued, Fee, Value, ...
      // Find the cell that looks like a project description (contains words, not just numbers)
      let description = '';
      let permitNum = '';
      let issued = '';
      for (const cell of cells) {
        // Permit number looks like N80589, I90583, B12345 etc.
        if (/^[A-Z]\d{4,}$/i.test(cell.trim())) permitNum = cell.trim();
        // Date looks like M/D/YYYY
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cell.trim()) && !issued) issued = cell.trim();
        // Description is typically the longest text cell that contains letters
        if (cell.length > 5 && /[a-z]/i.test(cell) && cell.length > description.length &&
            !cell.includes('COLORADO') && !cell.includes('DESERT')) {
          description = cell.trim();
        }
      }

      if (!description && !permitNum) continue;

      // Categorize the permit
      let type = 'Other';
      const descLower = (description || rowText).toLowerCase();
      if (descLower.includes('boiler') || descLower.includes('furnace') || descLower.includes('hvac') ||
          descLower.includes('a/c') || descLower.includes('air condition') || descLower.includes('mechanical')) {
        type = 'Mechanical/HVAC';
      } else if (descLower.includes('reroof') || descLower.includes('re-roof') || descLower.includes('roof')) {
        type = 'Roofing';
      } else if (descLower.includes('basement') || descLower.includes('bsmt')) {
        type = 'Building - Basement Finish';
      } else if (descLower.includes('addition') || descLower.includes('sunroom') || descLower.includes('remodel')) {
        type = 'Building - Addition/Remodel';
      } else if (descLower.includes('electrical') || descLower.includes('panel')) {
        type = 'Electrical';
      } else if (descLower.includes('sprinkler') || descLower.includes('lawn') || descLower.includes('fence')) {
        type = 'Landscaping/Other';
      } else if (descLower.includes('plumbing') || descLower.includes('water heater')) {
        type = 'Plumbing';
      }

      permits.push({
        type,
        permit_number: permitNum || null,
        description: description || 'See screenshot',
        issued: issued || null,
      });
    }

    // Deduplicate permits by permit number
    const seen = new Set();
    data.permits = permits.filter(p => {
      const key = p.permit_number || p.description;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`  [PPRBD] Extracted ${data.permits.length} unique permits`);
    for (const p of data.permits) {
      console.log(`    [${p.type}] ${p.permit_number || ''} — ${p.description} (${p.issued || 'no date'})`);
    }

    // AC/HVAC permit → update cooling data
    const bodyText = await page.textContent('body').catch(() => '');
    const textLower = bodyText.toLowerCase();
    if (textLower.includes('a/c') || textLower.includes('air condition')) {
      if (data.cooling.has_ac == null) {
        data.cooling.has_ac = true;
        data.cooling.type = 'Central AC (per permit)';
      }
    }

    return { data, blocked: false };
  } catch (err) {
    console.log(`  [PPRBD] Error: ${err.message}`);
    return { data, blocked: false };
  }
}

// ─── Stretch: Homes.com & Realtor.com ────────────────────────────────────────

async function scrapeHomescom(page, address) {
  const data = makeEmptyProperty(address);
  const slug = slugify(address);

  try {
    console.log(`  [Homes.com] Searching: ${address}`);
    const query = `${address}, ${CITY_STATE} ${ZIP}`;
    await page.goto(`https://www.homes.com/property/${encodeURIComponent(query)}/`, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
    await sleep(DELAY_MS);

    const bodyText = (await page.textContent('body').catch(() => '')).toLowerCase();
    if (bodyText.includes('captcha') || bodyText.length < 500) {
      console.log('  [Homes.com] Blocked or empty — skipping');
      return { data, blocked: true };
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${slug}-homescom.png`), fullPage: false });

    // Parse same fields from body text
    if (bodyText.includes('forced air')) data.heating.type = 'Forced Air';
    if (bodyText.includes('central air') || bodyText.includes('central a/c')) {
      data.cooling.has_ac = true;
      data.cooling.type = 'Central AC';
    }
    if (bodyText.includes('stucco')) data.exterior = 'Stucco';
    if (bodyText.includes('composition')) data.roof = 'Composition';
    const fpMatch = bodyText.match(/(\d+)\s*fireplace/);
    if (fpMatch) data.fireplace.count = parseInt(fpMatch[1], 10);

    return { data, blocked: false };
  } catch (err) {
    console.log(`  [Homes.com] Error: ${err.message}`);
    return { data, blocked: false };
  }
}

async function scrapeRealtorcom(page, address) {
  const data = makeEmptyProperty(address);
  const slug = slugify(address);

  try {
    console.log(`  [Realtor.com] Searching: ${address}`);
    const addrSlug = address.replace(/\s+/g, '-');
    await page.goto(`https://www.realtor.com/realestateandhomes-detail/${addrSlug}_Colorado-Springs_CO_${ZIP}`, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
    await sleep(DELAY_MS);

    const bodyText = (await page.textContent('body').catch(() => '')).toLowerCase();
    if (bodyText.includes('captcha') || bodyText.length < 500) {
      console.log('  [Realtor.com] Blocked or empty — skipping');
      return { data, blocked: true };
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${slug}-realtorcom.png`), fullPage: false });

    // Same field extraction from text
    if (bodyText.includes('forced air')) data.heating.type = 'Forced Air';
    if (bodyText.includes('central air') || bodyText.includes('central a/c')) {
      data.cooling.has_ac = true;
      data.cooling.type = 'Central AC';
    }
    if (bodyText.includes('walkout')) data.basement.walkout = true;
    if (bodyText.includes('stucco')) data.exterior = 'Stucco';
    const fpMatch = bodyText.match(/(\d+)\s*fireplace/);
    if (fpMatch) data.fireplace.count = parseInt(fpMatch[1], 10);

    return { data, blocked: false };
  } catch (err) {
    console.log(`  [Realtor.com] Error: ${err.message}`);
    return { data, blocked: false };
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

// ─── PPAR Matrix MLS ─────────────────────────────────────────────────────────

// User goes to ppar.com, logs in, then clicks "Elevate MLS"
const MLS_LOGIN_CANDIDATES = [
  'https://ppar.com/',
];

/** Prompt the user in the terminal and wait for them to press Enter */
function waitForUser(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, () => {
      rl.close();
      resolve();
    });
  });
}

/**
 * Log into PPAR Matrix MLS.
 * Opens the login page and waits for the user to authenticate manually.
 * Returns the authenticated page (or null if login failed/skipped).
 */
async function loginToMLS(browser) {
  console.log('\n' + '='.repeat(60));
  console.log('PPAR MATRIX MLS LOGIN');
  console.log('='.repeat(60));

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  let page = await context.newPage();

  // Try each candidate URL until one loads successfully
  let loaded = false;
  for (const url of MLS_LOGIN_CANDIDATES) {
    try {
      console.log(`  [MLS] Trying: ${url}`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      loaded = true;
      console.log(`  [MLS] Loaded: ${page.url()}`);
      break;
    } catch (err) {
      console.log(`  [MLS] Failed: ${err.message.split('\n')[0]}`);
    }
  }
  if (!loaded) {
    console.log('  [MLS] Could not load any MLS login URL — skipping MLS scraping');
    await context.close();
    return null;
  }

  // Bring this browser window to the front so the user can see it
  await page.bringToFront().catch(() => {});

  // Inject a giant red banner so the user knows THIS is the right window
  await page.evaluate(() => {
    const banner = document.createElement('div');
    banner.id = 'cma-banner';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#ff0000;color:white;font-size:24px;font-weight:bold;text-align:center;padding:15px;z-index:999999;font-family:sans-serif;box-shadow:0 4px 8px rgba(0,0,0,0.3);';
    banner.textContent = '👉 USE THIS WINDOW: Log in to ppar.com, then click "Elevate MLS"';
    document.body.appendChild(banner);
  }).catch(() => {});

  await sleep(2000);

  console.log('\n  ╔══════════════════════════════════════════════════════════╗');
  console.log('  ║  STEP 1: Log in to ppar.com in the browser window.      ║');
  console.log('  ║  STEP 2: Click "Elevate MLS" once you are logged in.    ║');
  console.log('  ║                                                          ║');
  console.log('  ║  The script will detect when you have left ppar.com     ║');
  console.log('  ║  and entered Elevate MLS. You have 5 minutes.           ║');
  console.log('  ╚══════════════════════════════════════════════════════════╝\n');

  // Poll all pages in the context — wait for ANY tab to navigate to a non-ppar URL.
  // "Elevate MLS" may open in a new tab, so we check every open page.
  const maxWaitMs = 5 * 60 * 1000;
  const pollIntervalMs = 3000;
  const startTime = Date.now();
  let inMLS = false;
  let mlsPage = null;

  while (Date.now() - startTime < maxWaitMs) {
    // Get all pages currently open in this context
    const allPages = context.pages();
    let bestUrl = '';
    let bestHost = '';

    // Auto-handle the "another user is logged in" warning by clicking Continue
    for (const p of allPages) {
      try {
        const continueBtn = p.locator('button:has-text("Continue"), input[value="Continue"], a:has-text("Continue")').first();
        if (await continueBtn.isVisible({ timeout: 500 }).catch(() => false)) {
          // Make sure this is actually a session warning, not some other Continue button
          const pageText = await p.textContent('body').catch(() => '');
          if (pageText.includes('another') && (pageText.includes('logged in') || pageText.includes('session'))) {
            console.log('\n  [MLS] Auto-clicking Continue on session warning');
            await continueBtn.click().catch(() => {});
            await sleep(2000);
          }
        }
      } catch {}
    }

    for (const p of allPages) {
      const url = p.url();
      let host = '';
      try {
        host = new URL(url).hostname;
      } catch {}
      const urlLower = url.toLowerCase();
      // We're in MLS only if we're on the actual Matrix host AND past any login/intermediate pages
      const onMatrixHost = host.includes('mlsmatrix.com');
      const onLoginPage = urlLower.includes('login') ||
                          urlLower.includes('logon') ||
                          urlLower.includes('loginintermediate');
      // Matrix Home page has /Matrix/Home in the path — that's the dashboard after login
      const onMatrixHome = urlLower.includes('/matrix/home') ||
                           urlLower.includes('/matrix/portal') ||
                           (onMatrixHost && urlLower.includes('matrix') && !onLoginPage);

      if (onMatrixHost && !onLoginPage && onMatrixHome) {
        inMLS = true;
        mlsPage = p;
        console.log(`\n  [MLS] Detected Matrix session! URL: ${url}`);
        break;
      }

      // Track the best URL for status display
      if (host && !bestHost) {
        bestUrl = url;
        bestHost = host;
      }
    }

    if (inMLS) break;

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const tabCount = allPages.length;
    process.stdout.write(`\r  [MLS] Waiting... (${elapsed}s) — ${tabCount} tab(s), current: ${bestHost.padEnd(40)}`);
    await sleep(pollIntervalMs);
  }

  if (!inMLS) {
    console.log('\n  [MLS] Timed out waiting for Elevate MLS — skipping MLS scraping');
    await context.close();
    return null;
  }

  // Use whichever page is now the MLS page (could be a new tab)
  if (mlsPage && mlsPage !== page) {
    console.log('  [MLS] Switching to new tab where MLS opened');
    page = mlsPage;
    await page.bringToFront();
  }

  // Give the MLS app a moment to fully load
  await sleep(3000);
  console.log('  [MLS] Login successful — ready to search properties\n');
  return { page, context };
}

/**
 * Search for a property in Matrix MLS and extract detail fields.
 * Matrix uses a search form — we'll use the Quick Search / Address Search.
 */
async function scrapeMLS(page, address) {
  const data = makeEmptyProperty(address);
  const slug = slugify(address);
  const fullAddress = `${address}, ${CITY_STATE} ${ZIP}`;

  try {
    console.log(`  [MLS] Searching: ${fullAddress}`);

    // Replicate Ryan's manual flow:
    // Search → Cross Property → Default Search → Select None → check Sold →
    // fill Street # and Street Name → click Results
    const currentUrl = page.url();
    const baseUrl = new URL(currentUrl).origin;
    console.log(`  [MLS] Starting from: ${currentUrl}`);

    // Parse street number and street name (without suffix) from address
    const addrMatch = address.match(/^(\d+)\s+(.+)$/);
    if (!addrMatch) {
      console.log('  [MLS] Could not parse address');
      return { data, blocked: false };
    }
    const streetNum = addrMatch[1];
    const streetNameRaw = addrMatch[2];
    // Strip suffix (Way, Court, Drive, etc.) — Matrix street name field expects just the name
    const streetName = streetNameRaw.replace(/\s+(Way|Court|Ct|Drive|Dr|Street|St|Avenue|Ave|Boulevard|Blvd|Lane|Ln|Place|Pl|Circle|Cir|Road|Rd|Trail|Trl)$/i, '');
    console.log(`  [MLS] Searching for: # ${streetNum}, name "${streetName}"`);

    // Step 1: Navigate to Cross Property Default Search
    // The URL pattern for Matrix Cross Property search is typically:
    // /Matrix/Search/CrossProperty/Default/{searchID} or just /Matrix/Search/CrossProperty/Default
    const searchUrl = `${baseUrl}/Matrix/Search/CrossProperty/Default`;
    console.log(`  [MLS] Navigating to: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch((e) => {
      console.log(`  [MLS] Goto warning: ${e.message.split('\n')[0]}`);
    });
    await sleep(4000);

    // Take screenshot of search form
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${slug}-mls-searchform.png`), fullPage: false });

    const searchPageUrl = page.url();
    console.log(`  [MLS] Search page URL: ${searchPageUrl}`);
    if (searchPageUrl.includes('Login') || searchPageUrl.includes('Error')) {
      console.log('  [MLS] Got login or error page — Matrix session may have expired');
      return { data, blocked: false };
    }

    // Step 2: Click "Select None" link near the Current Status section
    // The link is literally "Select None" at the top of the Current Status checkbox group
    const selectNoneClicked = await page.evaluate(() => {
      const links = document.querySelectorAll('a');
      for (const a of links) {
        if (a.textContent.trim() === 'Select None') {
          a.click();
          return true;
        }
      }
      return false;
    }).catch(() => false);
    console.log(`  [MLS] Select None: ${selectNoneClicked ? 'clicked' : 'NOT FOUND'}`);
    await sleep(1000);

    // Step 3: Check the "Sold" status checkbox specifically
    // Find a checkbox where its associated label text is exactly "Sold"
    const soldChecked = await page.evaluate(() => {
      // Try clicking the label whose text is exactly "Sold"
      const labels = document.querySelectorAll('label');
      for (const label of labels) {
        if (label.textContent.trim() === 'Sold') {
          label.click();
          return { method: 'label click', success: true };
        }
      }
      // Try finding the checkbox whose label sibling is "Sold"
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      for (const cb of checkboxes) {
        // Check next sibling text or wrapping label
        const nextText = cb.nextSibling?.textContent?.trim() || '';
        const labelEl = cb.closest('label') || (cb.id ? document.querySelector(`label[for="${cb.id}"]`) : null);
        const labelText = labelEl?.textContent?.trim() || nextText;
        if (labelText === 'Sold') {
          cb.checked = true;
          cb.dispatchEvent(new Event('click', { bubbles: true }));
          cb.dispatchEvent(new Event('change', { bubbles: true }));
          return { method: 'checkbox click', success: true };
        }
      }
      return { method: 'none', success: false };
    }).catch(() => ({ success: false }));
    console.log(`  [MLS] Sold checkbox: ${soldChecked.success ? `checked (${soldChecked.method})` : 'NOT FOUND'}`);
    await sleep(500);

    // Step 4: Fill Street # and Street Name fields
    // Each input in the address repeater has a unique `title` attribute:
    //   title="Street Number", title="Street Name", title="Zip Code"
    // This is the cleanest way to find them — no DOM walking needed.
    const filled = await page.evaluate(({ num, name, zip }) => {
      const result = { num: false, name: false, zip: false, debug: {} };

      const setVal = (input, value) => {
        input.focus();
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.blur();
      };

      // Find inputs by their title attribute
      const targets = [
        { titleMatch: 'Street Number', value: num, key: 'num' },
        { titleMatch: 'Street Name', value: name, key: 'name' },
        { titleMatch: 'Zip Code', value: zip, key: 'zip' },
      ];

      for (const target of targets) {
        const input = document.querySelector(`input[type="text"][title="${target.titleMatch}"]`);
        if (input) {
          setVal(input, target.value);
          result[target.key] = true;
          result.debug[target.key] = `${input.id || input.name} = "${target.value}"`;
        } else {
          result.debug[target.key] = `no input with title="${target.titleMatch}"`;
        }
      }

      return result;
    }, { num: streetNum, name: streetName, zip: ZIP }).catch((e) => ({ num: false, name: false, zip: false, debug: { error: e.message } }));

    console.log(`  [MLS] Filled: St#=${filled.num}, Street Name=${filled.name}, Zip=${filled.zip}`);
    console.log(`  [MLS] Debug: ${JSON.stringify(filled.debug)}`);

    // Always save the form HTML so we can inspect the structure
    const formHtml = await page.content().catch(() => '');
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, `${slug}-mls-form.html`), formHtml);

    if (!filled.num || !filled.name) {
      console.log('  [MLS] WARNING: Could not fill all required fields');
    }

    await sleep(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${slug}-mls-searchform-filled.png`), fullPage: false });

    // SAFETY CHECK: refuse to click Results if we haven't filled both required fields.
    // The previous failure mode was clicking Results with empty fields, getting 5000+
    // results, and then trying to parse the wrong page.
    if (!filled.num || !filled.name) {
      console.log('  [MLS] ABORTING search — required fields not filled. Will not click Results.');
      console.log('  [MLS] Saving HTML snapshot for debugging...');
      const html = await page.content().catch(() => '');
      fs.writeFileSync(path.join(SCREENSHOTS_DIR, `${slug}-mls-form-html.html`), html);
      return { data, blocked: false };
    }

    // Step 5: Click "Results" button — but make sure we're clicking the bottom Results button, not the top tab
    // From the screenshot, there are two "Results" buttons: one at top-right of the form (tab) and one at bottom
    const resultsBtn = page.locator(
      'a:has-text("Results"):not(:has-text("Map")), button:has-text("Results"), ' +
      'input[type="submit"][value*="Results" i], input[type="button"][value*="Results" i]'
    ).last(); // use .last() to get the bottom Results button
    if (await resultsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('  [MLS] Clicking Results button');
      await resultsBtn.click();
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      await sleep(5000);
    } else {
      console.log('  [MLS] Results button not found');
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${slug}-mls-results.png`), fullPage: false });

    // Step 6: Click into the FIRST sold listing detail (most recent sale)
    // Matrix uses ASP.NET postback links: <a href="javascript:__doPostBack('m_DisplayCore','Redisplay|485,,0')">MLS#</a>
    // The "0" at the end is the row index. Click the first one (index 0 = most recent sold).
    const clickedDetail = await page.evaluate(() => {
      // Find all postback links that match the Redisplay pattern
      const links = document.querySelectorAll('a[href*="__doPostBack"][href*="Redisplay"]');
      if (links.length === 0) return { clicked: false, reason: 'no postback links found' };
      // Click the first one — this is the first row (most recently sold)
      links[0].click();
      return { clicked: true, href: links[0].getAttribute('href'), totalLinks: links.length };
    }).catch((e) => ({ clicked: false, reason: e.message }));

    if (clickedDetail.clicked) {
      console.log(`  [MLS] Clicked detail link (1 of ${clickedDetail.totalLinks}): ${clickedDetail.href}`);
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      await sleep(5000);
    } else {
      console.log(`  [MLS] No detail link found: ${clickedDetail.reason}`);
    }

    // Take screenshot of search results / detail page
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${slug}-mls-search.png`), fullPage: false });

    // Now on the property detail page — take screenshot
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${slug}-mls-detail.png`), fullPage: false });

    // Scroll down to load all sections
    await page.evaluate(() => window.scrollBy(0, 2000));
    await sleep(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${slug}-mls-detail2.png`), fullPage: false });
    await page.evaluate(() => window.scrollBy(0, 2000));
    await sleep(1500);

    // Extract ALL text from the detail page
    const bodyText = (await page.textContent('body').catch(() => '')).toLowerCase();

    // Also try to extract structured data from Matrix detail page
    // Matrix often uses label/value pairs in spans or tables
    const detailPairs = await page.evaluate(() => {
      const pairs = {};
      // Matrix uses various patterns for detail fields:
      // 1. <span class="d-fontSize--small">Label</span> <span>Value</span>
      // 2. <td class="d-label">Label</td><td>Value</td>
      // 3. Label: Value in text content

      // Try table cells
      const tables = document.querySelectorAll('table');
      for (const table of tables) {
        const cells = table.querySelectorAll('td');
        for (let i = 0; i < cells.length - 1; i++) {
          const key = cells[i].textContent.trim();
          const val = cells[i + 1].textContent.trim();
          if (key && val && key.length < 50 && key.length > 2) {
            pairs[key.toLowerCase()] = val;
          }
        }
      }

      // Try spans and divs with label patterns
      const labels = document.querySelectorAll('[class*="label"], [class*="Label"], .d-textSoft');
      for (const label of labels) {
        const key = label.textContent.trim();
        const nextEl = label.nextElementSibling;
        if (nextEl && key && key.length < 50) {
          pairs[key.toLowerCase()] = nextEl.textContent.trim();
        }
      }

      // Try definition list pattern
      const dts = document.querySelectorAll('dt');
      for (const dt of dts) {
        const dd = dt.nextElementSibling;
        if (dd && dd.tagName === 'DD') {
          pairs[dt.textContent.trim().toLowerCase()] = dd.textContent.trim();
        }
      }

      return pairs;
    }).catch(() => ({}));

    console.log(`  [MLS] Parsed ${Object.keys(detailPairs).length} detail fields`);

    // Save detail pairs and full body text for inspection
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, `${slug}-mls-fields.json`), JSON.stringify(detailPairs, null, 2));
    const fullText = await page.textContent('body').catch(() => '');
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, `${slug}-mls-text.txt`), fullText);

    // ─── Parse Matrix detail page using known label patterns ─────────────────
    // Matrix renders fields as "Label:\n\nvalue\n\n..." in the body text.
    // Extract a value by finding the label and grabbing the next non-empty line.
    const getField = (label) => {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Match "Label:" optionally followed by whitespace/newlines, then capture value
      // until the next blank line or next "Label:" pattern
      const re = new RegExp(`${escaped}:?\\s*\\n+\\s*([^\\n]+)`, 'i');
      const m = fullText.match(re);
      return m ? m[1].trim() : '';
    };
    // Some fields are inline like "Label: value" on one line
    const getInlineField = (label) => {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`${escaped}:\\s*([^\\n]+)`);
      const m = fullText.match(re);
      return m ? m[1].trim() : '';
    };

    // Basement fields
    const basementSqftStr = getField('Basement Sqft');
    if (basementSqftStr) data.basement.total_sqft = parseNum(basementSqftStr);

    const pctFinishedStr = getField('% Basement Finished');
    if (pctFinishedStr && data.basement.total_sqft) {
      const pct = parseInt(pctFinishedStr, 10);
      if (!isNaN(pct)) {
        data.basement.finished_sqft = Math.round(data.basement.total_sqft * pct / 100);
      }
    }

    const basementType = getInlineField('Basement/Foundation');
    if (basementType) {
      data.basement.notes = basementType;
      // Walkout detection: in Matrix, walkout is mentioned in Living Room features
      // ("Fireplace, Formal, Walk-out") not in basement type. So check the full text.
      if (/walk[\s-]?out\s*basement/i.test(fullText)) {
        data.basement.walkout = true;
      } else {
        // The "Walk-out" in living room features means main level walks out, not basement
        data.basement.walkout = false;
      }
    }

    // Heating
    const heatingVal = getField('Heating');
    if (heatingVal) {
      if (/forced air/i.test(heatingVal)) data.heating.type = 'Forced Air';
      else if (/baseboard/i.test(heatingVal)) data.heating.type = 'Baseboard';
      else if (/radiant/i.test(heatingVal)) data.heating.type = 'Radiant';
      else if (/heat pump/i.test(heatingVal)) data.heating.type = 'Heat Pump';
      else data.heating.type = heatingVal;

      if (/natural gas|gas/i.test(heatingVal)) data.heating.fuel = 'Natural Gas';
      else if (/electric/i.test(heatingVal)) data.heating.fuel = 'Electric';
      else if (/propane/i.test(heatingVal)) data.heating.fuel = 'Propane';
      else if (/hot water/i.test(heatingVal)) data.heating.fuel = data.heating.fuel || 'Hot Water (boiler)';
    }

    // Cooling
    const coolingVal = getField('Cooling');
    if (coolingVal) {
      if (/central air|central a\/c/i.test(coolingVal)) {
        data.cooling.has_ac = true;
        data.cooling.type = 'Central AC';
      } else if (/evaporative/i.test(coolingVal)) {
        data.cooling.has_ac = true;
        data.cooling.type = 'Evaporative';
      } else if (/ceiling fan|none|^\s*$/i.test(coolingVal)) {
        data.cooling.has_ac = false;
        data.cooling.type = coolingVal;
      } else {
        data.cooling.type = coolingVal;
      }
    }

    // Fireplace
    const fpVal = getField('Fireplaces');
    if (fpVal) {
      // Format: "Gas, Main Level, One" or "Wood, Two" etc.
      if (/none|no fireplace/i.test(fpVal)) data.fireplace.count = 0;
      else if (/\bone\b|^1\b/i.test(fpVal)) data.fireplace.count = 1;
      else if (/\btwo\b|^2\b/i.test(fpVal)) data.fireplace.count = 2;
      else if (/\bthree\b|^3\b/i.test(fpVal)) data.fireplace.count = 3;
      else data.fireplace.count = 1; // assume 1 if mentioned without count

      if (/\bgas\b/i.test(fpVal)) data.fireplace.type = 'Gas';
      else if (/wood/i.test(fpVal)) data.fireplace.type = 'Wood';
      else if (/electric/i.test(fpVal)) data.fireplace.type = 'Electric';
    }

    // Roof (Roofing field)
    const roofVal = getField('Roofing');
    if (roofVal) {
      if (/composit|comp shingle|asphalt/i.test(roofVal)) data.roof = 'Composition';
      else if (/metal/i.test(roofVal)) data.roof = 'Metal';
      else if (/concrete tile/i.test(roofVal)) data.roof = 'Concrete Tile';
      else if (/tile/i.test(roofVal)) data.roof = 'Tile';
      else data.roof = roofVal;
    }

    // Exterior (Siding field)
    const sidingVal = getField('Siding');
    if (sidingVal) {
      if (/stucco/i.test(sidingVal)) data.exterior = 'Stucco';
      else if (/hardboard|hardie|fiber cement/i.test(sidingVal)) data.exterior = 'Hardboard/Fiber Cement';
      else if (/vinyl/i.test(sidingVal)) data.exterior = 'Vinyl';
      else if (/brick/i.test(sidingVal)) data.exterior = 'Brick';
      else if (/wood/i.test(sidingVal)) data.exterior = 'Wood';
      else if (/stone/i.test(sidingVal)) data.exterior = 'Stone';
      else data.exterior = sidingVal;
    }

    // Style — look for ranch, two-story, etc. in the description or property type
    const propType = getInlineField('Property Sub-Type') || getInlineField('Style') || '';
    const descriptionForStyle = fullText.toLowerCase();
    if (/\branch\b/i.test(descriptionForStyle)) data.style = 'Ranch';
    else if (/two[\s-]?story|2[\s-]?story/i.test(descriptionForStyle)) data.style = 'Two-Story';
    else if (/tri[\s-]?level/i.test(descriptionForStyle)) data.style = 'Tri-Level';
    else if (/bi[\s-]?level/i.test(descriptionForStyle)) data.style = 'Bi-Level';
    else if (/split[\s-]?level/i.test(descriptionForStyle)) data.style = 'Split-Level';
    else if (propType) data.style = propType;

    // Lot features — Matrix often has "Lot Description" or similar
    const lotDesc = getField('Lot Description') || getField('Lot Features') || '';
    const lotFeats = [];
    const checkText = (lotDesc + ' ' + fullText).toLowerCase();
    if (/open space|backs to open/i.test(checkText)) lotFeats.push('Backs to open space');
    if (/cul[\s-]?de[\s-]?sac/i.test(checkText)) lotFeats.push('Cul-de-sac');
    if (/mountain view|pikes peak view/i.test(checkText)) lotFeats.push('Mountain views');
    if (/corner lot/i.test(checkText)) lotFeats.push('Corner lot');
    if (/greenbelt/i.test(checkText)) lotFeats.push('Greenbelt');
    if (/golf course/i.test(checkText)) lotFeats.push('Golf course');
    if (/level lot/i.test(checkText)) lotFeats.push('Level');
    if (lotFeats.length) data.lot_features = lotFeats.join(', ');

    // Extras — combine Misc. Items, Patio/Deck, Garage, Misc. Interior Feat
    const miscItems = getField('Misc. Items') || '';
    const patioDesc = getInlineField('Patio/Deck Desc') || '';
    const interior = getField('Misc. Interior Feat') || '';
    const garageType = getInlineField('Gar (Parking) Type') || '';
    const garageNum = getInlineField('Gar (Parking) #') || '';

    if (patioDesc || /patio/i.test(fullText)) data.extras.push('Patio');
    if (/deck/i.test(patioDesc)) data.extras.push('Deck');
    if (/hot tub|spa/i.test(miscItems)) data.extras.push('Hot Tub');
    if (/wet bar/i.test(miscItems + interior)) data.extras.push('Wet Bar');
    if (/central vacuum/i.test(miscItems + interior)) data.extras.push('Central Vacuum');
    if (/sprinkler/i.test(fullText)) data.extras.push('Sprinklers');
    if (/vaulted|cathedral/i.test(interior)) data.extras.push('Vaulted Ceilings');
    if (/9.?ft.?\+? ceilings/i.test(interior)) data.extras.push('9ft+ Ceilings');
    if (/great room/i.test(interior)) data.extras.push('Great Room');
    if (garageNum && garageType) data.extras.push(`${garageNum}-Car ${garageType} Garage`);
    if (/sunroom/i.test(fullText)) data.extras.push('Sunroom');
    if (/kitchen pantry/i.test(miscItems)) data.extras.push('Kitchen Pantry');

    // Listing description
    const remarks = getField('Property Description Remarks');
    if (remarks) {
      // Get a fuller chunk — match from "Property Description Remarks:" to next major section
      const remarksMatch = fullText.match(/Property Description Remarks:?\s*\n+([\s\S]*?)(?:\n\n[A-Z][A-Z\s]{3,}:|\n\nDirections|$)/);
      if (remarksMatch) {
        data.listing_description = remarksMatch[1].trim().replace(/\s+/g, ' ').slice(0, 2000);
      } else {
        data.listing_description = remarks;
      }
    }

    // Condition notes from description
    const condText = (data.listing_description || '').toLowerCase();
    const conditions = [];
    if (/new kitchen|updated kitchen|kitchen remodel/.test(condText)) conditions.push('Updated kitchen');
    if (/new roof|roof replaced/.test(condText)) conditions.push('New roof');
    const remodelMatch = condText.match(/remodel(?:ed)?\s*(?:in\s*)?(\d{4})/);
    if (remodelMatch) conditions.push(`Remodeled ${remodelMatch[1]}`);
    if (/new flooring|new floors/.test(condText)) conditions.push('New flooring');
    if (/new windows/.test(condText)) conditions.push('New windows');
    if (/fresh paint|new paint|freshly painted/.test(condText)) conditions.push('Fresh paint');
    if (/new appliances|updated appliances/.test(condText)) conditions.push('Updated appliances');
    if (/new hvac|new furnace|new a\/c/.test(condText)) conditions.push('New HVAC');
    if (/fully finished|finished basement/.test(condText)) conditions.push('Finished basement');
    if (conditions.length) data.condition_notes = conditions.join('; ');

    console.log(`  [MLS] Extracted: heating=${data.heating.type}, cooling=${data.cooling.type}, fireplace=${data.fireplace.count}, roof=${data.roof}, exterior=${data.exterior}, walkout=${data.basement.walkout}`);
    console.log(`  [MLS] Extras: ${data.extras.join(', ')}`);
    console.log(`  [MLS] Lot features: ${data.lot_features}`);

    return { data, blocked: false };
  } catch (err) {
    console.log(`  [MLS] Error: ${err.message}`);
    return { data, blocked: false };
  }
}

// ─── Main Research Function ──────────────────────────────────────────────────

async function researchProperty(browser, address, mlsPage) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Researching: ${address}, ${CITY_STATE} ${ZIP}`);
  console.log('='.repeat(60));

  const result = makeEmptyProperty(address);
  // Use a separate context for Assessor/PPRBD so they don't disturb the MLS session.
  // The MLS context stays in the foreground; this one runs in the background.
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 800, height: 600 },
  });
  const page = await context.newPage();

  // 1. PPAR Matrix MLS (PRIMARY source — has the richest data)
  // If we don't have an MLS session, do NOT fall through to other sources —
  // MLS is the only source with the missing field data, so without it we can't
  // make progress. Stop and let the user re-run after fixing the login.
  if (!mlsPage) {
    console.log('  [MLS] No MLS session — skipping this property entirely');
    result.sources_checked.push('ppar-mls (no session)');
    computeConfidence(result);
    await context.close();
    return result;
  }

  try {
    const { data, blocked } = await scrapeMLS(mlsPage, address);
    mergeProperty(result, data);
    result.sources_checked.push(blocked ? 'ppar-mls (blocked)' : 'ppar-mls');
  } catch (err) {
    console.log(`  [MLS] Fatal: ${err.message}`);
    result.sources_checked.push('ppar-mls (error)');
  }
  await sleep(DELAY_MS);

  // If --mls-only flag, stop here and don't touch other sources
  if (MLS_ONLY) {
    console.log('  [MLS-ONLY mode] Skipping Assessor and PPRBD');
    await context.close();
    computeConfidence(result);
    return result;
  }

  // 2. El Paso County Assessor — for basement sqft, year built, structural facts
  try {
    const { data, blocked } = await scrapeAssessor(page, address);
    mergeProperty(result, data);
    result.sources_checked.push(blocked ? 'assessor (blocked)' : 'assessor');
  } catch (err) {
    console.log(`  [Assessor] Fatal: ${err.message}`);
    result.sources_checked.push('assessor (error)');
  }
  await sleep(DELAY_MS);

  // 3. PPRBD — for permit history (HVAC, basement finish, etc.)
  try {
    const { data, blocked } = await scrapePPRBD(page, address);
    mergeProperty(result, data);
    result.sources_checked.push(blocked ? 'pprbd (blocked)' : 'pprbd');
  } catch (err) {
    console.log(`  [PPRBD] Fatal: ${err.message}`);
    result.sources_checked.push('pprbd (error)');
  }

  await context.close();

  computeConfidence(result);
  return result;
}

async function main() {
  const properties = TEST_MODE ? [PROPERTIES[0]] : PROPERTIES;

  console.log(`\nCMA Property Research Script`);
  console.log(`Mode: ${TEST_MODE ? 'TEST (1 property)' : `FULL (${properties.length} properties)`}`);
  console.log(`Output: ${OUTPUT_FILE}`);
  console.log(`Screenshots: ${SCREENSHOTS_DIR}\n`);

  // Ensure screenshots dir exists
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
    channel: 'chrome', // use locally installed Chrome
  });

  // ─── MLS Login ─────────────────────────────────────────────────────────────
  // Log into PPAR Matrix MLS first. The MLS page stays open and is reused
  // across all property searches to avoid re-authentication.
  let mlsSession = null;
  const skipMLS = process.argv.includes('--no-mls');
  if (!skipMLS) {
    mlsSession = await loginToMLS(browser);
  } else {
    console.log('\n  Skipping MLS login (--no-mls flag)\n');
  }

  const mlsPage = mlsSession?.page || null;
  const results = [];

  for (const address of properties) {
    const result = await researchProperty(browser, address, mlsPage);
    results.push(result);

    // Write incrementally so we don't lose data if something crashes
    const output = {
      research_date: new Date().toISOString().split('T')[0],
      properties: results,
    };
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`\n  -> Saved ${results.length}/${properties.length} properties to ${OUTPUT_FILE}`);
  }

  // Close MLS session
  if (mlsSession?.context) {
    await mlsSession.context.close();
  }
  await browser.close();

  console.log(`\n${'='.repeat(60)}`);
  console.log('RESEARCH COMPLETE');
  console.log(`${'='.repeat(60)}`);
  console.log(`Total properties: ${results.length}`);
  console.log(`Output file: ${OUTPUT_FILE}`);

  // Summary of data gaps
  console.log('\nData gap summary:');
  for (const p of results) {
    const gapCount = p.gaps.length;
    const icon = gapCount <= 2 ? 'HIGH' : gapCount <= 5 ? 'MED ' : 'LOW ';
    console.log(`  [${icon}] ${p.address} — ${gapCount} gaps${gapCount > 0 ? ': ' + p.gaps.join(', ') : ''}`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
