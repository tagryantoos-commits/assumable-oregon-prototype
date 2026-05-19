import { MetadataRoute } from 'next'
import { getAllPostsMeta } from '@/lib/blog'
import { allListings } from '@/lib/listings'
import { createClient } from '@supabase/supabase-js'

/**
 * Flat sitemap for assumableguy.com, served at /sitemap.xml
 *
 * Single export (no generateSitemaps) ensures Next.js serves
 * the index at /sitemap.xml which Google can actually fetch.
 * ~1,400 URLs, well within the 50K limit.
 */

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://assumableguy.com'
  const now = new Date()

  // ─────────────────────────────────────────────
  // STATIC PAGES
  // ─────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/homes`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/buy`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/sell`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/team`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/calculator`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/join-our-team`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/deals`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/va-loans`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/guide/assumable-mortgages`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/guide/military-assumable-mortgages`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/guide/investor-assumable-mortgages`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/course`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/ai-for-agents`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/sitemap-page`, lastModified: now, changeFrequency: 'weekly', priority: 0.3 },
    { url: `${baseUrl}/fountain`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/manitou-springs`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/colorado-springs-listings`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/greeley-colorado-assumable-mortgages`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/pueblo-colorado-assumable-mortgages`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
  ]

  // ─────────────────────────────────────────────
  // CITY PAGES
  // ─────────────────────────────────────────────
  const cities = [
    'colorado-springs', 'denver', 'aurora', 'fort-collins', 'boulder',
    'pueblo', 'greeley', 'lakewood', 'thornton', 'arvada',
    'westminster', 'castle-rock', 'parker', 'loveland', 'broomfield',
    'highlands-ranch',
  ]

  const cityPages: MetadataRoute.Sitemap = cities.map(city => ({
    url: `${baseUrl}/${city}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // ─────────────────────────────────────────────
  // BLOG POSTS
  // ─────────────────────────────────────────────
  let blogPages: MetadataRoute.Sitemap = []
  try {
    const posts = getAllPostsMeta()
    blogPages = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.date ? new Date(post.date) : now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
  } catch (e) {
    console.error('Sitemap: error loading blog posts', e)
  }

  // ─────────────────────────────────────────────
  // LISTING DETAIL PAGES (with Supabase lastModified)
  // ─────────────────────────────────────────────
  let lastSeenMap: Map<string, Date> = new Map()
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data } = await supabase
        .from('listings')
        .select('id, last_seen_date')
      if (data) {
        for (const row of data) {
          if (row.last_seen_date) {
            lastSeenMap.set(String(row.id), new Date(row.last_seen_date))
          }
        }
      }
    }
  } catch (e) {
    console.error('Sitemap: error fetching last_seen_date from Supabase', e)
  }

  const listingPages: MetadataRoute.Sitemap = allListings.map((listing) => ({
    url: `${baseUrl}/homes/${listing.id}`,
    lastModified: lastSeenMap.get(listing.id) ?? now,
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }))

  return [
    ...staticPages,
    ...cityPages,
    ...blogPages,
    ...listingPages,
  ]
}
