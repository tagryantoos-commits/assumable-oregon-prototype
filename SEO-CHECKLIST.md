# SEO Checklist, assumableguy.com

## When Adding a New Page

Every new page on assumableguy.com MUST follow these steps:

### 1. Add to Sitemap
Edit `app/sitemap.ts` and add your new page URL to the appropriate section:
- **Static pages**, core site pages (about, buy, sell, etc.)
- **City pages**, new market/city pages
- **Blog posts**, auto-discovered (just add the .mdx file)
- **Listing pages**, auto-discovered (just update listings.json)

If it's a new static page, add it to the `staticPages` array:
```ts
{ url: `${baseUrl}/your-new-page`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
```

### 2. Add Metadata (REQUIRED, use PAGE-TEMPLATE.tsx)

Copy `PAGE-TEMPLATE.tsx` as your starting point. Every new `page.tsx` MUST have:

**Minimum required fields:**
```ts
export const metadata: Metadata = {
  title: 'Page Title | The Assumable Guy',          // Include primary keyword
  description: 'Unique 150-160 char description.',  // Must be page-specific
  alternates: {
    canonical: 'https://assumableguy.com/[slug]',   // Must match actual URL (hyphens, not underscores)
  },
  openGraph: {
    title: '...',
    description: '...',
    type: 'website',
    url: 'https://assumableguy.com/[slug]',
    images: [{ url: 'https://assumableguy.com/images/ryan-headshot.png', width: 1200, height: 630, alt: '...' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '...',
    description: '...',
    images: ['https://assumableguy.com/images/ryan-headshot.png'],
  },
};
```

**Rules:**
- Canonical URL must use hyphens (never underscores)
- Title: 50-60 chars max, include keyword + brand
- Description: 150-160 chars, unique per page, include keyword
- OG image: use ryan-headshot.png as default, or a page-specific image
- DO NOT add `robots: 'noindex'` unless it's a /ppc/* page
- Dynamic pages (city pages, listings): use `generateMetadata()` pulling from real data

### 3. Do NOT add noindex
Only PPC landing pages (`/ppc/*`) should have `robots: 'noindex, nofollow'`.
All other pages should be indexable. If you're unsure, leave robots out (default = index).

### 4. Internal Links
Every new page should:
- Link to at least 2-3 other pages on the site
- Be linked FROM at least 1-2 existing pages
- Include a CTA linking to /homes, /calculator, or /contact

### 5. Open Graph
Include Open Graph tags for social sharing:
```ts
openGraph: {
  title: 'Page Title',
  description: 'Description for social cards.',
  type: 'website',
},
```

## Pages That Are EXCLUDED From Sitemap (intentionally)
- `/ppc/*`, PPC landing pages (noindex, nofollow)
- `/ppc/thank-you`, post-form redirect
- `/api/*`, API routes
- `/feedback`, internal feedback page

## Google Search Console
- Property: assumableguy.com
- Sitemap submitted: https://assumableguy.com/sitemap.xml
- robots.txt points to sitemap automatically
- Google re-crawls the sitemap periodically (typically every few days)
- To request faster indexing: use Google Search Console → URL Inspection → Request Indexing

## Monitoring
- Google Search Console shows indexed page count and any crawl errors
- If a page isn't indexed after 2 weeks, check for: noindex tag, canonical issues, thin content, or crawl errors
