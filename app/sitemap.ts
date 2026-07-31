import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://smartshamba.vercel.app';
  
  // Static routes
  const staticRoutes = ['', '/about', '/buyers', '/market-prices', '/group-selling'].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic Buyer Routes (Public Directory)
  const buyers = await prisma.buyer.findMany({ where: { active: true }, select: { id: true, createdAt: true } });
  const buyerRoutes = buyers.map(b => ({
    url: `${baseUrl}/buyers#${b.id}`,
    lastModified: b.createdAt ?? new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...buyerRoutes];
}
