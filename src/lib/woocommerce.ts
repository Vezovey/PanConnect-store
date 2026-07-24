import fs from 'fs';
import path from 'path';
import type { Product, ProductVariation, LocalVariation, ProductSpec } from '@/types';

const PRODUCTS_FILE = path.join(process.cwd(), 'src', 'data', 'products.json');

function readProductsRaw(): LocalProduct[] {
  try {
    const raw = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function getEnabledProducts(): LocalProduct[] {
  return readProductsRaw().filter(p => p.enabled !== false);
}

function findBySlug(slug: string): LocalProduct | undefined {
  return getEnabledProducts().find(p => p.slug === slug);
}

function findById(id: number): LocalProduct | undefined {
  return getEnabledProducts().find(p => p.id === id);
}

export interface LocalProduct {
  id: number;
  name: string;
  slug: string;
  type: string;
  price: string;
  sale_price: string;
  short_description: string;
  description: string;
  local_images: string[];
  categories: string[];
  brand: string;
  attributes: { name: string; options: string[] }[];
  variations: LocalVariation[];
  enabled?: boolean;
  specs?: ProductSpec[];
  // shop.by export fields
  vendor?: string;
  model?: string;
  typePrefix?: string;
  shopById?: string;
  deliveryDays?: number;
  orderBefore?: number;
  shopByCategory?: number;
}

function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .replace(/^\s+|\s+$/g, '');
}

function leafCategory(fullPath: string): string {
  return fullPath.split('>').pop()!.trim();
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '-');
}

const ROOT_CATEGORIES = new Set(['Смартфоны', 'Ноутбуки', 'Планшеты', 'Наушники и аксессуары']);

function isRootType(leaf: string): boolean {
  return ROOT_CATEGORIES.has(leaf);
}

function toProduct(p: LocalProduct): Product {
  const images = p.local_images.map((src, i) => ({
    id: i,
    src,
    name: p.name,
    alt: p.name,
  }));

  const attributes = (p.attributes || []).map((a, i) => ({
    id: i,
    name: a.name,
    options: a.options,
  }));

  const variations: ProductVariation[] = (p.variations || []).map((v) => ({
    id: v.id,
    name: v.name,
    price: v.price,
    regular_price: v.regular_price,
    sale_price: v.sale_price,
    image: { id: 0, src: '', name: '', alt: '' },
    attributes: v.attributes.map((a, i) => ({
      id: i,
      name: a.name,
      options: [],
      option: a.option,
    })),
  }));

  const hasVariationsWithPrice = variations.some(v => v.price);
  let displayPrice = p.price;

  if (hasVariationsWithPrice) {
    const prices = variations
      .map(v => parseFloat(v.price))
      .filter(price => !isNaN(price) && price > 0);
    if (prices.length > 0) {
      displayPrice = String(Math.min(...prices));
    }
  }

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: displayPrice,
    regular_price: displayPrice,
    sale_price: p.sale_price || '',
    description: cleanText(p.description) || `<p>${cleanText(p.short_description)}</p>`,
    short_description: cleanText(p.short_description),
    images,
    categories: p.categories
      .map(name => leafCategory(name))
      .filter((leaf, i, arr) => !isRootType(leaf) && arr.indexOf(leaf) === i)
      .map((leaf, i) => ({
        id: i,
        name: leaf,
        slug: slugify(leaf),
      })),
    attributes,
    variations: variations.map(v => v.id),
    type: p.type as 'simple' | 'variable',
    in_stock: true,
    stock_quantity: null,
    rating_count: 0,
    average_rating: '0',
    permalink: `/product/${p.slug}`,
    specs: p.specs || [],
  };
}

export async function getProducts(params: {
  page?: number;
  per_page?: number;
  category?: string;
  search?: string;
  order?: 'asc' | 'desc';
  orderby?: 'date' | 'price' | 'popularity' | 'title';
  price_min?: number;
  price_max?: number;
  ram?: string[];
  storage?: string[];
  color?: string[];
} = {}): Promise<{ products: Product[]; totalPages: number; total: number }> {
  let filtered = getEnabledProducts();

  if (params.category) {
    const catSlug = params.category.toLowerCase();
    filtered = filtered.filter(p =>
      p.categories.some(c => slugify(leafCategory(c)) === catSlug) ||
      slugify(p.brand) === catSlug
    );
  }

  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.short_description.toLowerCase().includes(q)
    );
  }

  if (params.price_min !== undefined) {
    filtered = filtered.filter(p => {
      const price = parseFloat(p.price) || 0;
      return price >= params.price_min!;
    });
  }

  if (params.price_max !== undefined) {
    filtered = filtered.filter(p => {
      const price = parseFloat(p.price) || 0;
      return price <= params.price_max!;
    });
  }

  if (params.ram && params.ram.length > 0) {
    filtered = filtered.filter(p => {
      const allVariations = p.variations || [];
      return allVariations.some(v =>
        v.attributes.some(a => a.name === 'Оперативная память' && params.ram!.includes(a.option))
      ) || p.attributes.some(a => a.name === 'Оперативная память' && a.options.some(o => params.ram!.includes(o)));
    });
  }

  if (params.storage && params.storage.length > 0) {
    filtered = filtered.filter(p => {
      const allVariations = p.variations || [];
      return allVariations.some(v =>
        v.attributes.some(a => a.name === 'Встроенная память' && params.storage!.includes(a.option))
      ) || p.attributes.some(a => a.name === 'Встроенная память' && a.options.some(o => params.storage!.includes(o)));
    });
  }

  if (params.color && params.color.length > 0) {
    filtered = filtered.filter(p => {
      const allVariations = p.variations || [];
      return allVariations.some(v =>
        v.attributes.some(a => a.name === 'Цвет корпуса' && params.color!.includes(a.option))
      ) || p.attributes.some(a => a.name === 'Цвет корпуса' && a.options.some(o => params.color!.includes(o)));
    });
  }

  if (params.orderby === 'price') {
    filtered.sort((a, b) => {
      const pa = parseFloat(a.sale_price || a.price) || 0;
      const pb = parseFloat(b.sale_price || b.price) || 0;
      return params.order === 'asc' ? pa - pb : pb - pa;
    });
  } else if (params.orderby === 'title') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    filtered.sort((a, b) => b.id - a.id);
  }

  const perPage = params.per_page || 16;
  const page = params.page || 1;
  const total = filtered.length;
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const products = filtered.slice(start, start + perPage).map(toProduct);

  return { products, totalPages, total };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const found = findBySlug(slug);
  return found ? toProduct(found) : null;
}

export async function getProductById(id: number): Promise<Product | null> {
  const found = findById(id);
  return found ? toProduct(found) : null;
}

export async function getProductVariations(slug: string): Promise<ProductVariation[]> {
  const found = findBySlug(slug);
  if (!found) return [];

  return (found.variations || []).map((v) => ({
    id: v.id,
    name: v.name,
    price: v.price,
    regular_price: v.regular_price,
    sale_price: v.sale_price,
    image: { id: 0, src: '', name: '', alt: '' },
    attributes: v.attributes.map((a, i) => ({
      id: i,
      name: a.name,
      options: [],
      option: a.option,
    })),
  }));
}

export async function getCategories(): Promise<{ id: number; name: string; slug: string; count: number }[]> {
  const catMap = new Map<string, number>();
  for (const p of getEnabledProducts()) {
    for (const cat of p.categories) {
      const leaf = leafCategory(cat);
      if (isRootType(leaf)) continue;
      catMap.set(leaf, (catMap.get(leaf) || 0) + 1);
    }
  }
  return Array.from(catMap.entries())
    .map(([name, count], i) => ({
      id: i + 1,
      name,
      slug: slugify(name),
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

/** Собирает уникальные значения атрибутов по всем товарам */
export async function getFilterOptions(): Promise<{
  ram: string[];
  storage: string[];
  color: string[];
  priceMin: number;
  priceMax: number;
}> {
  const ramSet = new Set<string>();
  const storageSet = new Set<string>();
  const colorSet = new Set<string>();
  let priceMin = Infinity;
  let priceMax = 0;

  for (const p of getEnabledProducts()) {
    const price = parseFloat(p.price) || 0;
    if (price > 0 && price < priceMin) priceMin = price;
    if (price > priceMax) priceMax = price;

    for (const a of p.attributes || []) {
      if (a.name === 'Оперативная память') a.options.forEach(o => ramSet.add(o));
      if (a.name === 'Встроенная память') a.options.forEach(o => storageSet.add(o));
      if (a.name === 'Цвет корпуса') a.options.forEach(o => colorSet.add(o));
    }
  }

  const sortNumeric = (arr: string[]) =>
    [...arr].sort((a, b) => parseFloat(a) - parseFloat(b));

  return {
    ram: sortNumeric([...ramSet]),
    storage: sortNumeric([...storageSet]),
    color: [...colorSet].sort(),
    priceMin: priceMin === Infinity ? 0 : priceMin,
    priceMax,
  };
}

export async function searchProducts(query: string): Promise<Product[]> {
  const { products } = await getProducts({ search: query, per_page: 8 });
  return products;
}
