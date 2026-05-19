import { Metadata } from 'next'
import Link from 'next/link'
import { getAllPostsMeta } from '@/lib/blog'
import { allListings } from '@/lib/listings'

export const metadata: Metadata = {
  title: 'Site Map | The Assumable Guy',
  description: 'Browse all pages on assumableguy.com, assumable mortgage listings, blog articles, city guides, and more.',
  robots: { index: true, follow: true },
}

// City pages (same list as sitemap.ts)
const cities = [
  { slug: 'colorado-springs', name: 'Colorado Springs' },
  { slug: 'denver', name: 'Denver' },
  { slug: 'aurora', name: 'Aurora' },
  { slug: 'fort-collins', name: 'Fort Collins' },
  { slug: 'boulder', name: 'Boulder' },
  { slug: 'pueblo', name: 'Pueblo' },
  { slug: 'greeley', name: 'Greeley' },
  { slug: 'lakewood', name: 'Lakewood' },
  { slug: 'thornton', name: 'Thornton' },
  { slug: 'arvada', name: 'Arvada' },
  { slug: 'westminster', name: 'Westminster' },
  { slug: 'castle-rock', name: 'Castle Rock' },
  { slug: 'parker', name: 'Parker' },
  { slug: 'loveland', name: 'Loveland' },
  { slug: 'broomfield', name: 'Broomfield' },
  { slug: 'highlands-ranch', name: 'Highlands Ranch' },
]

export default function SitemapPage() {
  const posts = getAllPostsMeta()
  const listings = allListings

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Site Map</h1>
      <p className="text-gray-600 mb-8">
        Browse all {listings.length.toLocaleString()} assumable mortgage listings, {posts.length} blog articles, 
        and every page on assumableguy.com.
      </p>

      {/* Main Pages */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3 border-b pb-2">Main Pages</h2>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <li><Link href="/" className="text-blue-700 hover:underline">Home</Link></li>
          <li><Link href="/homes" className="text-blue-700 hover:underline">Browse Listings</Link></li>
          <li><Link href="/blog" className="text-blue-700 hover:underline">Blog</Link></li>
          <li><Link href="/about" className="text-blue-700 hover:underline">About</Link></li>
          <li><Link href="/buy" className="text-blue-700 hover:underline">Buy</Link></li>
          <li><Link href="/sell" className="text-blue-700 hover:underline">Sell</Link></li>
          <li><Link href="/team" className="text-blue-700 hover:underline">Team</Link></li>
          <li><Link href="/calculator" className="text-blue-700 hover:underline">Mortgage Calculator</Link></li>
          <li><Link href="/contact" className="text-blue-700 hover:underline">Contact</Link></li>
          <li><Link href="/join-our-team" className="text-blue-700 hover:underline">Join Our Team</Link></li>
          <li><Link href="/deals" className="text-blue-700 hover:underline">Deals</Link></li>
          <li><Link href="/va-loans" className="text-blue-700 hover:underline">VA Loans</Link></li>
          <li><Link href="/guide/assumable-mortgages" className="text-blue-700 hover:underline">Assumable Mortgage Guide</Link></li>
          <li><Link href="/course" className="text-blue-700 hover:underline">Course</Link></li>
          <li><Link href="/ai-for-agents" className="text-blue-700 hover:underline">AI for Agents</Link></li>
        </ul>
      </section>

      {/* City Pages */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3 border-b pb-2">City Pages ({cities.length})</h2>
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {cities.map(city => (
            <li key={city.slug}>
              <Link href={`/${city.slug}`} className="text-blue-700 hover:underline">
                {city.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Blog Posts */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3 border-b pb-2">Blog Articles ({posts.length})</h2>
        <ul className="space-y-1">
          {posts.map(post => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="text-blue-700 hover:underline">
                {post.title}
              </Link>
              {post.date && (
                <span className="text-gray-400 text-sm ml-2">
                  {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Listings */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3 border-b pb-2">
          Assumable Mortgage Listings ({listings.length.toLocaleString()})
        </h2>
        <p className="text-gray-500 text-sm mb-4">
          All active assumable mortgage listings in Colorado, sorted by city.
        </p>
        {(() => {
          // Group listings by city
          const byCity: Record<string, typeof listings> = {}
          for (const l of listings) {
            const city = l.city || 'Other'
            if (!byCity[city]) byCity[city] = []
            byCity[city].push(l)
          }
          const sortedCities = Object.keys(byCity).sort()

          return sortedCities.map(city => (
            <div key={city} className="mb-6">
              <h3 className="text-lg font-medium mb-2">{city} ({byCity[city].length})</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
                {byCity[city].map(listing => (
                  <li key={listing.id}>
                    <Link href={`/homes/${listing.id}`} className="text-blue-700 hover:underline">
                      {listing.address}, {listing.city}, {listing.assumableRate}% @ ${listing.price.toLocaleString()}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))
        })()}
      </section>
    </main>
  )
}
