import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const BLOG_DIR = path.join(process.cwd(), 'content/blog');

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  image: string;
  content: string;
  author?: string;
  authorTitle?: string;
  primaryKeyword?: string;
  readingTime?: string;
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  image: string;
  author?: string;
  authorTitle?: string;
  primaryKeyword?: string;
  readingTime?: string;
}

function getSlugFromFilename(filename: string): string {
  return filename.replace(/\.mdx?$/, '');
}

export function getAllPostsMeta(): BlogPostMeta[] {
  let files: string[] = [];
  try {
    files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));
  } catch {
    return [];
  }

  const posts: BlogPostMeta[] = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
      const { data } = matter(raw);

      if (!data.title) continue; // skip broken frontmatter

      posts.push({
        slug: data.slug || getSlugFromFilename(file),
        title: data.title || '',
        description: data.description || '',
        date: data.date || '',
        category: data.category || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        image: data.image || '',
        author: data.author || 'Ryan Thomson',
        authorTitle: data.authorTitle || 'Licensed Colorado Real Estate Agent | The Assumable Guy',
        primaryKeyword: data.primaryKeyword || '',
        readingTime: data.readingTime || '',
      });
    } catch {
      // skip broken files
      continue;
    }
  }

  // Sort by date descending
  return posts.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

export function getPostBySlug(slug: string): BlogPost | null {
  // Try to find by slug in frontmatter or filename
  let files: string[] = [];
  try {
    files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));
  } catch {
    return null;
  }

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
      const { data, content } = matter(raw);

      const fileSlug = data.slug || getSlugFromFilename(file);
      if (fileSlug !== slug) continue;

      return {
        slug: fileSlug,
        title: data.title || '',
        description: data.description || '',
        date: data.date || '',
        category: data.category || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        image: data.image || '',
        content,
        author: data.author || 'Ryan Thomson',
        authorTitle: data.authorTitle || 'Licensed Colorado Real Estate Agent | The Assumable Guy',
        primaryKeyword: data.primaryKeyword || '',
        readingTime: data.readingTime || '',
      };
    } catch {
      continue;
    }
  }

  return null;
}

export function getRelatedPostsForCity(cityName: string, limit = 5): BlogPostMeta[] {
  const posts = getAllPostsMeta();
  const cityLower = cityName.toLowerCase();
  const citySlug = cityName.toLowerCase().replace(/\s+/g, '-');

  const scored = posts.map(post => {
    let score = 0;
    const combined = `${post.slug} ${post.title} ${post.description}`.toLowerCase();

    if (combined.includes(cityLower) || combined.includes(citySlug)) score += 10;
    if (combined.includes('colorado')) score += 2;
    if (combined.includes('fha') || combined.includes('va loan')) score += 1;
    if (combined.includes('equity gap') || combined.includes('process') || combined.includes('step')) score += 1;

    return { post, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.post);
}

export const CITY_MAP = [
  { name: 'Colorado Springs', slug: 'colorado-springs', keywords: ['colorado springs', 'co springs', 'cos', 'fort carson'] },
  { name: 'Denver', slug: 'denver', keywords: ['denver'] },
  { name: 'Aurora', slug: 'aurora', keywords: ['aurora'] },
  { name: 'Fort Collins', slug: 'fort-collins', keywords: ['fort collins'] },
  { name: 'Boulder', slug: 'boulder', keywords: ['boulder'] },
  { name: 'Pueblo', slug: 'pueblo', keywords: ['pueblo'] },
  { name: 'Greeley', slug: 'greeley', keywords: ['greeley'] },
  { name: 'Lakewood', slug: 'lakewood', keywords: ['lakewood'] },
  { name: 'Thornton', slug: 'thornton', keywords: ['thornton'] },
  { name: 'Arvada', slug: 'arvada', keywords: ['arvada'] },
  { name: 'Westminster', slug: 'westminster', keywords: ['westminster'] },
  { name: 'Castle Rock', slug: 'castle-rock', keywords: ['castle rock'] },
  { name: 'Parker', slug: 'parker', keywords: ['parker'] },
  { name: 'Loveland', slug: 'loveland', keywords: ['loveland'] },
  { name: 'Broomfield', slug: 'broomfield', keywords: ['broomfield'] },
  { name: 'Highlands Ranch', slug: 'highlands-ranch', keywords: ['highlands ranch'] },
  { name: 'Fountain', slug: 'fountain', keywords: ['fountain'] },
  { name: 'Manitou Springs', slug: 'manitou-springs', keywords: ['manitou springs', 'manitou'] },
];

export function getRelevantCitiesForPost(slug: string, title: string, content: string): typeof CITY_MAP {
  const combined = `${slug} ${title} ${content}`.toLowerCase();
  return CITY_MAP.filter(city =>
    city.keywords.some(kw => combined.includes(kw))
  );
}

export function getAllSlugs(): string[] {
  let files: string[] = [];
  try {
    files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));
  } catch {
    return [];
  }

  const slugs: string[] = [];
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
      const { data } = matter(raw);
      if (!data.title) continue;
      slugs.push(data.slug || getSlugFromFilename(file));
    } catch {
      continue;
    }
  }
  return slugs;
}
