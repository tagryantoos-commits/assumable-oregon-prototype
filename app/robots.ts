import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', '/property/'],
      },
    ],
    sitemap: [
      'https://assumableguy.com/sitemap.xml',
    ],
    host: 'https://assumableguy.com',
  }
}
