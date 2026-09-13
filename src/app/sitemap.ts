import type { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';

const PRODUCTS_FILE = path.join(process.cwd(), 'src', 'data', 'products.json');
const BASE_URL = 'https://panconnect.by';

interface ProductData {
  slug: string;
  enabled?: boolean;
  categories?: string[];
}

function getProducts(): ProductData[] {
  try {
    const raw = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/catalog`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/delivery`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/warranty`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contacts`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];

  const products = getProducts()
    .filter(p => p.enabled !== false);

  const productPages: MetadataRoute.Sitemap = products.map(p => ({
    url: `${BASE_URL}/shop/${p.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const categorySlugs = new Set<string>();
  for (const p of products) {
    for (const cat of p.categories || []) {
      const leaf = cat.split('>').pop()?.trim().toLowerCase().replace(/\s+/g, '-') || '';
      if (leaf && !['смартфоны', 'ноутбуки', 'планшеты', 'наушники-и-аксессуары'].includes(leaf)) {
        categorySlugs.add(leaf);
      }
    }
  }

  const categoryPages: MetadataRoute.Sitemap = [...categorySlugs].map(slug => ({
    url: `${BASE_URL}/catalog?category=${slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
