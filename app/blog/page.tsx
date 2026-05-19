import { Metadata } from 'next';
import Link from 'next/link';
import { getAllPostsMeta } from '../../lib/blog';

export const metadata: Metadata = {
  title: 'Assumable Mortgage Blog | The Assumable Guy',
  description: 'Learn everything about assumable mortgages: how they work, where to find them, and how to save hundreds per month on your next home purchase in Colorado.',
  alternates: {
    canonical: 'https://assumableguy.com/blog',
  },
  openGraph: {
    title: 'Assumable Mortgage Blog | The Assumable Guy',
    description: 'Expert guides on assumable mortgages: FHA, VA, and USDA loan assumptions explained. Colorado-focused, updated regularly.',
    type: 'website',
    url: 'https://assumableguy.com/blog',
    images: [{ url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=400&fit=crop&q=80', width: 1200, height: 400, alt: 'Assumable Mortgage Blog' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Assumable Mortgage Blog | The Assumable Guy',
    description: 'Expert guides on assumable mortgages: FHA, VA, and USDA loan assumptions explained.',
    images: ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=400&fit=crop&q=80'],
  },
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return dateStr;
  }
}

const GRADIENT_STYLES = [
  { gradient: 'from-[#12395d] to-[#1d5c96]', accent: 'bg-[#7db0de]/30' },
  { gradient: 'from-[#1d5c96] to-[#7db0de]', accent: 'bg-white/20' },
  { gradient: 'from-gray-800 to-[#12395d]', accent: 'bg-[#7db0de]/25' },
  { gradient: 'from-[#12395d] via-[#1d5c96] to-[#7db0de]', accent: 'bg-white/15' },
  { gradient: 'from-gray-900 to-[#1d5c96]', accent: 'bg-[#7db0de]/20' },
  { gradient: 'from-[#1d5c96] via-[#12395d] to-gray-900', accent: 'bg-white/10' },
];

// Placeholder images for posts without images
const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=80',
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
  'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=600&q=80',
  'https://images.unsplash.com/photo-1448630360428-65456885c650?w=600&q=80',
  'https://images.unsplash.com/photo-1494526585095-c41746248156?w=600&q=80',
];

const CATEGORY_COLORS: Record<string, string> = {
  'Guide': 'bg-[#1d5c96] text-white',
  'Strategy': 'bg-[#12395d] text-white',
  'FAQ': 'bg-[#7db0de] text-white',
  'Colorado Springs': 'bg-emerald-600 text-white',
  'Denver': 'bg-purple-600 text-white',
  'Investing': 'bg-amber-600 text-white',
  'Default': 'bg-[#1d5c96] text-white',
};

export default function BlogPage() {
  const posts = getAllPostsMeta();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#12395d] via-gray-800 to-[#1d5c96] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-[#7db0de]/20 border border-[#7db0de]/30 text-[#7db0de] text-sm font-medium px-4 py-2 rounded-full mb-6">
            <span>📚 Education &amp; Guides</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Assumable Mortgage <span className="text-[#7db0de]">Blog</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Everything you need to know about assuming a mortgage: city guides, strategy, FAQs, and expert analysis from Colorado&apos;s #1 assumable mortgage specialist.
          </p>
          <div className="flex items-center justify-center gap-6 mt-6">
            <p className="text-[#7db0de] font-semibold">{posts.length} Articles &amp; Counting</p>
            <span className="text-gray-500">|</span>
            <p className="text-gray-400 text-sm">Updated regularly</p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-[#1d5c96] text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[#7db0de] font-black text-xl">💡</span>
              <span>FHA &amp; VA loan assumption guides</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#7db0de] font-black text-xl">📍</span>
              <span>Colorado city guides</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#7db0de] font-black text-xl">🧮</span>
              <span>Step-by-step calculators</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#7db0de] font-black text-xl">🏠</span>
              <span>Investor strategies</span>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-500 text-lg">Articles coming soon. Check back shortly!</p>
            <Link href="/homes" className="mt-6 inline-block bg-[#1d5c96] text-white font-bold px-6 py-3 rounded-xl">
              Browse Listings Instead
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, index) => {
              const style = GRADIENT_STYLES[index % GRADIENT_STYLES.length];
              const catColor = CATEGORY_COLORS[post.category] || CATEGORY_COLORS['Default'];
              const placeholderImg = PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];
              const heroImage = post.image || placeholderImg;

              return (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                  <article className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#1d5c96]/30 hover:-translate-y-1 transition-all duration-200 flex flex-col overflow-hidden h-full">
                    {/* Image or Gradient header */}
                    <div className={`relative bg-gradient-to-br ${style.gradient} overflow-hidden`} style={{ minHeight: '180px' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={heroImage}
                        alt={post.title}
                        className="w-full h-44 object-cover opacity-80 group-hover:opacity-90 transition-opacity"
                      />
                      <div className="absolute inset-0 flex flex-col justify-end p-5">
                        {post.category && (
                          <span className={`inline-block text-xs font-bold ${catColor} px-2.5 py-1 rounded-md mb-2 w-fit`}>
                            {post.category}
                          </span>
                        )}
                        <h2 className="text-white font-bold text-base leading-snug line-clamp-2 group-hover:underline decoration-white/50 underline-offset-2 drop-shadow">
                          {post.title}
                        </h2>
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      {post.description && (
                        <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
                          {post.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                        {post.date ? (
                          <span className="text-xs text-gray-400">{formatDate(post.date)}</span>
                        ) : (
                          <span className="text-xs text-gray-400">The Assumable Guy</span>
                        )}
                        <span className="text-sm font-semibold text-[#1d5c96] group-hover:text-[#12395d] transition-colors">
                          Read More &rarr;
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-br from-[#12395d] to-[#1d5c96] rounded-3xl p-8 md:p-12 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#7db0de] rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#7db0de] rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3" />
          </div>
          <div className="relative">
            <div className="text-5xl mb-4">🏠</div>
            <h2 className="text-2xl md:text-3xl font-black mb-3">Ready to Find Your Assumable Mortgage?</h2>
            <p className="text-gray-300 mb-6 max-w-xl mx-auto text-lg">
              Browse 800+ Colorado homes with low-rate assumable mortgages. Save $500&ndash;$1,500/month vs. today&apos;s rates.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/homes"
                className="bg-white text-[#1d5c96] font-bold px-8 py-4 rounded-xl hover:bg-[#7db0de] hover:text-white transition-colors shadow-lg"
              >
                Browse Listings &rarr;
              </Link>
              <Link
                href="/calculator"
                className="bg-[#7db0de]/20 hover:bg-[#7db0de]/40 border border-[#7db0de]/40 text-white font-bold px-8 py-4 rounded-xl transition-colors"
              >
                Savings Calculator
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
