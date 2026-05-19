/**
 * Link-audit regression guards.
 *
 * These tests codify the fixes made in the 2026-04-21 link audit. They are
 * static file checks — they read source files and assert that known-broken
 * patterns never reappear. Running the suite is the cheapest way to catch
 * an accidental re-introduction of a /listings, /#get-the-list, or
 * /how-it-works direct-URL link.
 *
 * See: Google Doc "Website saved" for the full audit narrative.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = join(__dirname, '..', '..');

// ───────────────────────────────────────────────────────────────────────────
// File walkers
// ───────────────────────────────────────────────────────────────────────────

function walk(dir: string, exts: string[], out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next' || name === '.git' || name === '__tests__') continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, exts, out);
    } else if (exts.some(e => name.endsWith(e))) {
      out.push(full);
    }
  }
  return out;
}

const tsxFiles = walk(join(ROOT, 'app'), ['.tsx', '.ts'])
  .concat(walk(join(ROOT, 'components'), ['.tsx', '.ts']));
const mdxFiles = walk(join(ROOT, 'content'), ['.mdx']);

function violationsOf(files: string[], pattern: RegExp): { file: string; line: number; text: string }[] {
  const hits: { file: string; line: number; text: string }[] = [];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        hits.push({ file: relative(ROOT, file), line: i + 1, text: lines[i].trim().slice(0, 160) });
      }
    }
  }
  return hits;
}

// ───────────────────────────────────────────────────────────────────────────
// Dead /#get-the-list anchor — 408 refs removed across footer, header, about,
// blog index. Regression would re-introduce a button that scrolls nowhere.
// ───────────────────────────────────────────────────────────────────────────
describe('No #get-the-list dead anchor references', () => {
  it('no href pointing to #get-the-list in any tsx/ts source file', () => {
    const hits = violationsOf(tsxFiles, /href="[^"]*#get-the-list/);
    expect(hits, `Found dead #get-the-list hrefs:\n${JSON.stringify(hits, null, 2)}`).toEqual([]);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// /listings → /homes — 73 refs rewritten across 71 blog posts + 2 city pages.
// Any future link must go to /homes, not the long-dead /listings route.
// ───────────────────────────────────────────────────────────────────────────
describe('No /listings href targets', () => {
  it('no href="/listings" or href="/listings?..." in tsx sources', () => {
    const hits = violationsOf(tsxFiles, /href="\/listings(?:\?|")/);
    expect(hits, `Found /listings hrefs:\n${JSON.stringify(hits, null, 2)}`).toEqual([]);
  });

  it('no (/listings) or (/listings?...) markdown links in MDX content', () => {
    const hits = violationsOf(mdxFiles, /\(\/listings(?:\?[^)]*)?\)/);
    expect(hits, `Found (/listings) markdown links:\n${JSON.stringify(hits, null, 2)}`).toEqual([]);
  });

  it('no [/listings] display text in MDX content', () => {
    const hits = violationsOf(mdxFiles, /\[\/listings\]/);
    expect(hits, `Found [/listings] display text:\n${JSON.stringify(hits, null, 2)}`).toEqual([]);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// /contact page exists and is the canonical contact destination.
// 53 blog-post references to /contact used to 404; now they resolve here.
// ───────────────────────────────────────────────────────────────────────────
describe('/contact page and form exist', () => {
  it('app/contact/page.tsx exists', () => {
    expect(existsSync(join(ROOT, 'app/contact/page.tsx'))).toBe(true);
  });

  it('components/ContactForm.tsx exists', () => {
    expect(existsSync(join(ROOT, 'components/ContactForm.tsx'))).toBe(true);
  });

  it('ContactForm submits formType "Form: Contact" so FUB routes it to Website - Buyer', () => {
    const src = readFileSync(join(ROOT, 'components/ContactForm.tsx'), 'utf8');
    expect(src).toContain("formType: 'Form: Contact'");
  });

  it('ContactForm posts to /api/leads (the existing FUB-wired endpoint)', () => {
    const src = readFileSync(join(ROOT, 'components/ContactForm.tsx'), 'utf8');
    expect(src).toContain("fetch('/api/leads'");
  });

  it('ContactForm declares all required fields (first/last/email/phone)', () => {
    const src = readFileSync(join(ROOT, 'components/ContactForm.tsx'), 'utf8');
    // Each field input must have `required` — the "message" field is optional.
    for (const id of ['contact-first-name', 'contact-last-name', 'contact-email', 'contact-phone']) {
      const pattern = new RegExp(`id="${id}"[\\s\\S]*?required`);
      expect(pattern.test(src), `Expected "${id}" input to be marked required`).toBe(true);
    }
  });

  it('/contact is registered in sitemap.ts for SEO indexing', () => {
    const sitemap = readFileSync(join(ROOT, 'app/sitemap.ts'), 'utf8');
    expect(sitemap).toContain('/contact');
  });
});

// ───────────────────────────────────────────────────────────────────────────
// /how-it-works was a direct URL (404); correct target is the homepage
// anchor /#how-it-works. One-char fix on /colorado-springs-listings.
// ───────────────────────────────────────────────────────────────────────────
describe('No /how-it-works direct URL links', () => {
  it('no href="/how-it-works" without the # anchor prefix', () => {
    // Allow /#how-it-works (anchor) but flag bare /how-it-works
    const hits = violationsOf(tsxFiles, /href="\/how-it-works"/);
    expect(hits, `Found bare /how-it-works hrefs (must be /#how-it-works):\n${JSON.stringify(hits, null, 2)}`).toEqual([]);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Broken blog-to-blog cross-links — 5 nonexistent slugs repointed to real
// equivalents. Guard against re-introduction of any of these dead targets.
// ───────────────────────────────────────────────────────────────────────────
describe('No references to nonexistent blog post slugs', () => {
  const deadSlugs = [
    'assumable-mortgage-fort-carson-military-buyers',
    'assumable-mortgage-process',
    'assume-va-loan-without-being-veteran',  // careful: -colorado variant IS valid
    'fha-loan-assumption-requirements',       // careful: -colorado variant IS valid
    'how-to-become-assumable-mortgage-specialist',
  ];

  for (const slug of deadSlugs) {
    it(`/blog/${slug} must not appear as a link target`, () => {
      // Match the dead slug only when it closes the URL (with a quote or close paren),
      // so we don't false-positive on the valid -colorado variants.
      const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`/blog/${escaped}(?=["')])`);
      const allSrc = [...tsxFiles, ...mdxFiles];
      const hits = violationsOf(allSrc, pattern);
      expect(hits, `Found dead slug /blog/${slug}:\n${JSON.stringify(hits, null, 2)}`).toEqual([]);
    });
  }
});

// ───────────────────────────────────────────────────────────────────────────
// Email domain — canonical is ryan@TheAssumableGuy.com. The bare
// ryan@assumableguy.com (missing "the") was on 204 pages and was wrong.
// ───────────────────────────────────────────────────────────────────────────
describe('Email domain canonicalization', () => {
  it('no references to ryan@assumableguy.com (missing "the")', () => {
    // \b boundary so we don't falsely match ryan@TheAssumableGuy.com
    const hits = violationsOf([...tsxFiles, ...mdxFiles], /(?<![tT][hH][eE])ryan@assumableguy\.com/);
    expect(hits, `Found wrong-domain mailto/email:\n${JSON.stringify(hits, null, 2)}`).toEqual([]);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// /team mailto subject must be URL-encoded (no raw space/comma in ?subject=).
// Strict mail clients drop the subject if unencoded.
// ───────────────────────────────────────────────────────────────────────────
describe('mailto subjects are URL-encoded', () => {
  it('no raw space in a mailto subject parameter', () => {
    // Match mailto:...?subject=...<space>... inside any href value
    const hits = violationsOf(tsxFiles, /mailto:[^"]*\?subject=[^"]* [^"]*/);
    expect(hits, `Found mailto with unencoded space in subject:\n${JSON.stringify(hits, null, 2)}`).toEqual([]);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Outbound automation kill switches — Vapi calls and Twilio SMS are
// intentionally disabled until downstream pipelines are live.
// ───────────────────────────────────────────────────────────────────────────
describe('Outbound automation kill switches are set to false', () => {
  const files = [
    { path: 'app/api/leads/route.ts', flags: ['VAPI_OUTBOUND_ENABLED', 'SMS_LEAD_AGENT_ENABLED'] },
    { path: 'app/api/ppc-lead/route.ts', flags: ['VAPI_OUTBOUND_ENABLED'] },
    { path: 'app/api/fub-webhook/route.ts', flags: ['VAPI_OUTBOUND_ENABLED'] },
  ];

  for (const { path, flags } of files) {
    for (const flag of flags) {
      it(`${path} has ${flag} = false`, () => {
        const src = readFileSync(join(ROOT, path), 'utf8');
        const decl = new RegExp(`const\\s+${flag}\\s*=\\s*false`);
        expect(decl.test(src), `Expected ${flag} = false in ${path}`).toBe(true);
      });

      it(`${path} gates the outbound fetch on ${flag}`, () => {
        const src = readFileSync(join(ROOT, path), 'utf8');
        // Every conditional branch that POSTs to the webhook/SMS endpoint must
        // include the flag in its if-condition. We look for `if (${flag}` which
        // is how the gate is written throughout.
        const gate = new RegExp(`if\\s*\\(\\s*${flag}`);
        expect(gate.test(src), `Expected 'if (${flag} ...)' gate in ${path}`).toBe(true);
      });
    }
  }
});
