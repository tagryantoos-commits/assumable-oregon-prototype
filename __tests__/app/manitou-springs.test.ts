/**
 * Static-content tests for the Manitou Springs city page.
 *
 * Locks in the 2026-04-22 buildout: the page was converted from a
 * redirect stub to a full city page matching the Fountain pattern so
 * that /manitou-springs has SEO metadata and surfaces Manitou listings.
 *
 * Why read the file as text instead of importing: the page module pulls
 * in React/Next runtime imports (next/link, client components) that
 * don't load cleanly in the node test environment. The file-level
 * assertions are enough to catch the regressions we care about (missing
 * metadata, wrong city name, brand-rule violations in copy).
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const PAGE_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  'app',
  'manitou-springs',
  'page.tsx'
);

let source = '';

beforeAll(() => {
  expect(existsSync(PAGE_PATH), `page missing at ${PAGE_PATH}`).toBe(true);
  source = readFileSync(PAGE_PATH, 'utf-8');
});

describe('manitou-springs/page.tsx — metadata exports', () => {
  it('exports generateMetadata', () => {
    expect(source).toMatch(/export\s+function\s+generateMetadata\s*\(\s*\)\s*:\s*Metadata/);
  });

  it('exports a default React component', () => {
    expect(source).toMatch(/export\s+default\s+function\s+ManitouSpringsPage/);
  });

  it('imports Metadata type from next', () => {
    expect(source).toMatch(/import\s*\{\s*Metadata\s*\}\s*from\s*['"]next['"]/);
  });
});

describe('manitou-springs/page.tsx — content correctness', () => {
  it('queries listings with the exact "Manitou Springs" city name', () => {
    expect(source).toMatch(/getListingsByCity\(['"]Manitou Springs['"]\)/);
  });

  it('sets canonical URL to /manitou-springs', () => {
    expect(source).toContain("canonical: `https://assumableguy.com/${slug}`");
    expect(source).toMatch(/slug\s*=\s*['"]manitou-springs['"]/);
  });

  it('links back-to-homes with city=Manitou+Springs query', () => {
    expect(source).toContain('/homes?city=Manitou+Springs');
  });

  it('schema.org ItemList names the city correctly', () => {
    expect(source).toContain('Assumable Mortgage Listings in Manitou Springs, CO');
  });
});

describe('manitou-springs/page.tsx — brand rule compliance', () => {
  /*
   * These checks mirror the non-negotiables in
   * /Users/ryanthomson/.openclaw/workspace/new-site/CLAUDE.md.
   * We scan only string/JSX literals (not arbitrary technical text)
   * by looking for occurrences inside quoted content or JSX runs.
   */

  it('does not contain an em dash (—)', () => {
    expect(source).not.toContain('—');
  });

  it('uses assumableguy.com (not theassumableguy.com)', () => {
    expect(source).not.toMatch(/theassumableguy\.com/);
    expect(source).toContain('https://assumableguy.com/');
  });

  const bannedWords = [
    'stunning',
    'gorgeous',
    'leverage',
    'synergy',
    'game-changer',
    'navigate',
    'seamless',
    'transformative',
  ];

  it.each(bannedWords)('does not use banned word "%s"', word => {
    const re = new RegExp(`\\b${word}\\b`, 'i');
    expect(source).not.toMatch(re);
  });

  it('does not mention USDA loans (only FHA and VA are assumable)', () => {
    expect(source).not.toMatch(/\bUSDA\b/);
  });

  it('has at most one exclamation point', () => {
    const count = (source.match(/!/g) || []).length;
    expect(count).toBeLessThanOrEqual(1);
  });
});
