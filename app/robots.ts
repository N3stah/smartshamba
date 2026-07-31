import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/dashboard/', '/buyer/', '/api/'],
    },
    sitemap: 'https://smartshamba.vercel.app/sitemap.xml',
  };
}
