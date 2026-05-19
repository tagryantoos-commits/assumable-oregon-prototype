import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { remark } from 'remark';
import remarkHtml from 'remark-html';
import { getPostBySlug, getAllSlugs, getAllPostsMeta, getRelevantCitiesForPost, CITY_MAP } from '../../../lib/blog';
import { ReadingProgressBar, TableOfContents, ShareButtons } from './BlogPostClient';

interface Props {
  params: Promise<{ slug: string }>;
}

const CATEGORY_IMAGES: Record<string, string> = {
  'VA Loans': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=400&fit=crop&q=80',
  'Investor Guide': 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&h=400&fit=crop&q=80',
  'Market Analysis': 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&h=400&fit=crop&q=80',
};
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=400&fit=crop&q=80';

const CATEGORY_COLORS: Record<string, string> = {
  'Buyer Education': 'bg-blue-500/20 text-blue-300 border-blue-400/30',
  'Investor Guide': 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
  'Market Analysis': 'bg-purple-500/20 text-purple-300 border-purple-400/30',
  'VA Loans': 'bg-amber-500/20 text-amber-300 border-amber-400/30',
  'FHA Loans': 'bg-rose-500/20 text-rose-300 border-rose-400/30',
  'Seller Guide': 'bg-teal-500/20 text-teal-300 border-teal-400/30',
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || 'bg-brand/20 text-brand-light border-brand/30';
}

function getFeaturedImage(post: { image?: string; category?: string; slug?: string }): string {
  if (post.image) return post.image;
  if (post.category && CATEGORY_IMAGES[post.category]) return CATEGORY_IMAGES[post.category];
  return DEFAULT_IMAGE;
}

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Post Not Found' };

  const image = getFeaturedImage(post);
  const canonicalUrl = `https://assumableguy.com/blog/${slug}`;

  // Keep title concise: keyword at front, max 60 chars
  const seoTitle = `${post.title} | The Assumable Guy`;

  return {
    title: seoTitle,
    description: post.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      url: canonicalUrl,
      publishedTime: post.date,
      modifiedTime: post.date,
      authors: ['Ryan Thomson'],
      tags: post.tags,
      images: [{ url: image, width: 1200, height: 400, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [image],
    },
  };
}

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

function estimateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function extractHeadings(html: string): { id: string; text: string }[] {
  const headings: { id: string; text: string }[] = [];
  const regex = /<h2[^>]*>(.*?)<\/h2>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    headings.push({ id, text });
  }
  return headings;
}

function addHeadingIds(html: string): string {
  return html.replace(/<h2([^>]*)>(.*?)<\/h2>/gi, (_match, attrs, content) => {
    const text = content.replace(/<[^>]+>/g, '').trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return `<h2${attrs} id="${id}">${content}</h2>`;
  });
}

function styleBlockquotes(html: string): string {
  return html.replace(
    /<blockquote>([\s\S]*?)<\/blockquote>/gi,
    '<div class="callout-box my-6 flex gap-3 rounded-xl border-l-4 border-brand bg-brand-50 p-5 not-prose"><span class="text-2xl flex-shrink-0">💡</span><div class="text-gray-700 text-base leading-relaxed [&>p]:m-0">$1</div></div>'
  );
}

function hasFaqSection(html: string): boolean {
  return /frequently asked questions|<h2[^>]*>faq/i.test(html);
}

function extractFaqSchema(html: string): Array<{ question: string; answer: string }> {
  const faqs: Array<{ question: string; answer: string }> = [];
  // Look for h3 inside FAQ sections
  const faqSectionMatch = html.match(/(?:frequently asked questions|faq)([\s\S]*?)(?:<h2|$)/i);
  if (!faqSectionMatch) return faqs;

  const faqSection = faqSectionMatch[1];
  const h3Regex = /<h3[^>]*>(.*?)<\/h3>\s*<p>(.*?)<\/p>/gi;
  let match;
  while ((match = h3Regex.exec(faqSection)) !== null) {
    const question = match[1].replace(/<[^>]+>/g, '').trim();
    const answer = match[2].replace(/<[^>]+>/g, '').trim();
    if (question && answer) {
      faqs.push({ question, answer });
    }
  }
  return faqs.slice(0, 10);
}

async function markdownToHtml(markdown: string): Promise<string> {
  const result = await remark().use(remarkHtml, { sanitize: false }).process(markdown);
  let html = result.toString();
  html = addHeadingIds(html);
  html = styleBlockquotes(html);
  return html;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const contentHtml = await markdownToHtml(post.content);
  const readTime = estimateReadTime(post.content);
  const headings = extractHeadings(contentHtml);
  const featuredImage = getFeaturedImage(post);
  const canonicalUrl = `https://assumableguy.com/blog/${slug}`;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description || '',
    datePublished: post.date || '',
    dateModified: post.date || '',
    image: featuredImage,
    url: canonicalUrl,
    author: {
      '@type': 'Person',
      name: 'Ryan Thomson',
      jobTitle: 'Licensed Colorado Real Estate Agent',
      url: 'https://assumableguy.com',
      sameAs: [
        'https://www.instagram.com/assumableguy',
        'https://www.youtube.com/@assumableguy',
        'https://www.facebook.com/assumableguy',
      ],
    },
    publisher: {
      '@type': 'Organization',
      name: 'The Assumable Guy',
      url: 'https://assumableguy.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://assumableguy.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://assumableguy.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: 'https://assumableguy.com/blog',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: canonicalUrl,
      },
    ],
  };

  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Ryan Thomson',
    jobTitle: 'Licensed Colorado Real Estate Agent',
    description: 'Ryan Thomson is Colorado\'s leading assumable mortgage specialist, helping buyers access low-rate FHA and VA loans across the state.',
    url: 'https://assumableguy.com',
    telephone: '(719) 624-3472',
    email: 'ryan@TheAssumableGuy.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Colorado Springs',
      addressRegion: 'CO',
      addressCountry: 'US',
    },
    sameAs: [
      'https://www.instagram.com/assumableguy',
      'https://www.youtube.com/@assumableguy',
      'https://www.facebook.com/assumableguy',
    ],
  };

  // Extract FAQ schema if post has FAQ section
  const faqItems = extractFaqSchema(contentHtml);
  const faqSchema = faqItems.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  } : null;

  return (
    <div className="min-h-screen bg-white">
      <ReadingProgressBar />

      {/* Schema markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* Hero with Featured Image */}
      <div className="relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${featuredImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/85 to-gray-900/60" />
        <div className="relative py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-4">
              <ol className="flex items-center gap-2 text-sm text-gray-400">
                <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><span className="text-gray-600">/</span></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><span className="text-gray-600">/</span></li>
                <li className="text-gray-300 truncate max-w-xs">{post.title}</li>
              </ol>
            </nav>

            {post.category && (
              <span className={`inline-block text-xs font-semibold border px-3 py-1 rounded-full mb-4 ${getCategoryColor(post.category)}`}>
                {post.category}
              </span>
            )}

            <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4 text-white">
              {post.title}
            </h1>

            {post.description && (
              <p className="text-gray-300 text-lg md:text-xl leading-relaxed mb-6 max-w-3xl">{post.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-2">
                <span className="w-8 h-8 bg-brand rounded-full flex items-center justify-center text-white text-sm font-bold">R</span>
                <span className="font-medium text-gray-300">Ryan Thomson, Licensed Colorado Real Estate Agent</span>
              </span>
              {post.date && (
                <>
                  <span className="text-gray-600">·</span>
                  <span>{formatDate(post.date)}</span>
                </>
              )}
              <span className="text-gray-600">·</span>
              <span>{readTime} min read</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content with TOC sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-12">
          {/* Main content */}
          <div className="max-w-4xl flex-1 min-w-0">
            <article
              className="prose prose-gray prose-lg max-w-none
                prose-headings:font-bold prose-headings:text-gray-900
                prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:scroll-mt-20
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-gray-700 prose-p:leading-relaxed
                prose-strong:text-gray-900
                prose-a:text-brand prose-a:no-underline hover:prose-a:underline
                prose-ul:text-gray-700 prose-ol:text-gray-700
                prose-li:my-1
                prose-blockquote:border-brand-light prose-blockquote:text-gray-600
                prose-img:rounded-xl prose-img:shadow-lg
                prose-hr:border-gray-200"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />

            {/* Share Buttons */}
            <div className="mt-10 pt-6 border-t border-gray-200">
              <ShareButtons title={post.title} slug={slug} />
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Author Box */}
            <div className="mt-10 bg-brand-50 border border-brand-100 rounded-2xl p-6 flex items-start gap-4">
              <div className="w-14 h-14 bg-brand rounded-full flex items-center justify-center text-white font-black text-xl flex-shrink-0">
                R
              </div>
              <div>
                <div className="font-bold text-gray-900">Ryan Thomson</div>
                <div className="text-sm text-brand font-medium mb-2">Licensed Colorado Real Estate Agent | The Assumable Guy</div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Ryan Thomson specializes in assumable mortgages across Colorado, helping buyers lock in sub-3% rates in a 7%+ market. He has helped hundreds of families save hundreds per month on their home purchases. Questions? Call (719) 624-3472 or email ryan@TheAssumableGuy.com.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-12 bg-gradient-to-br from-gray-900 to-brand-dark rounded-3xl p-8 text-white text-center">
              <div className="text-4xl mb-3">🏠</div>
              <h2 className="text-2xl font-bold mb-2">Ready to Find an Assumable Mortgage in Colorado?</h2>
              <p className="text-gray-300 mb-6 max-w-xl mx-auto">
                Browse available listings or schedule a free call with Ryan Thomson. Save $500&ndash;$1,500/month vs. today&apos;s rates.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/homes"
                  className="bg-brand hover:bg-brand-light text-white font-bold px-8 py-4 rounded-xl transition-colors"
                >
                  Browse Homes →
                </Link>
                <a
                  href="https://calendly.com/your-real-estate-agent-ryan/15min"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-8 py-4 rounded-xl transition-colors"
                >
                  Schedule a Free Call
                </a>
              </div>
              <p className="mt-4 text-gray-400 text-sm">(719) 624-3472 | ryan@TheAssumableGuy.com</p>
            </div>

            {/* Browse City Listings */}
            <BrowseCityListings slug={slug} title={post.title} content={post.content} />

            {/* Related Posts */}
            <RelatedPosts currentSlug={slug} currentTags={post.tags} currentCategory={post.category} />

            {/* Back to blog */}
            <div className="mt-8 text-center">
              <Link href="/blog" className="text-brand hover:text-brand-dark font-semibold transition-colors">
                ← Back to All Articles
              </Link>
            </div>
          </div>

          {/* TOC sidebar */}
          <TableOfContents headings={headings} />
        </div>
      </div>
    </div>
  );
}

function RelatedPosts({ currentSlug, currentTags, currentCategory }: { currentSlug: string; currentTags: string[]; currentCategory: string }) {
  const allPosts = getAllPostsMeta().filter((p) => p.slug !== currentSlug);

  const scored = allPosts.map((p) => {
    let score = 0;
    if (currentCategory && p.category === currentCategory) score += 2;
    if (currentTags && p.tags) {
      for (const tag of p.tags) {
        if (currentTags.includes(tag)) score += 1;
      }
    }
    return { ...p, score };
  });

  const related = scored
    .sort((a, b) => b.score - a.score || (b.date > a.date ? 1 : -1))
    .slice(0, 3)
    .filter((p) => p.score > 0);

  if (related.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Related Articles</h3>
      <div className="grid sm:grid-cols-3 gap-4">
        {related.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group bg-gray-50 hover:bg-brand-50 border border-gray-100 hover:border-brand/30 rounded-xl overflow-hidden transition-all"
          >
            {post.image && (
              <div
                className="h-28 bg-cover bg-center"
                style={{ backgroundImage: `url(${post.image})` }}
              />
            )}
            <div className="p-4">
              {post.category && (
                <span className="inline-block text-xs font-semibold text-brand bg-brand-50 px-2 py-0.5 rounded mb-2">
                  {post.category}
                </span>
              )}
              <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand transition-colors leading-snug line-clamp-2 mb-2">
                {post.title}
              </h4>
              <span className="text-xs font-semibold text-brand">Read More →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function BrowseCityListings({ slug, title, content }: { slug: string; title: string; content: string }) {
  const relevantCities = getRelevantCitiesForPost(slug, title, content);
  const citiesToShow = relevantCities.length > 0 ? relevantCities.slice(0, 3) : CITY_MAP.slice(0, 2);

  return (
    <section className="mt-12 p-6 bg-gray-50 rounded-xl">
      <h3 className="text-lg font-bold text-gray-900 mb-3">Browse Assumable Mortgage Listings</h3>
      <div className="flex flex-wrap gap-3">
        {citiesToShow.map(city => (
          <Link key={city.slug} href={`/${city.slug}`}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-brand text-sm font-medium text-gray-700 hover:text-brand transition-colors">
            {city.name} Listings →
          </Link>
        ))}
        <Link href="/homes"
          className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors">
          All Colorado Listings →
        </Link>
      </div>
    </section>
  );
}
