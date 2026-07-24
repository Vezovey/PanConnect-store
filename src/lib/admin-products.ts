import fs from 'fs';
import path from 'path';
import type { LocalProduct } from '@/lib/woocommerce';

const PRODUCTS_FILE = path.join(process.cwd(), 'src', 'data', 'products.json');
const IMAGES_DIR = path.join(process.cwd(), 'public', 'images');

function readProducts(): LocalProduct[] {
  try {
    const raw = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeProducts(products: LocalProduct[]) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
}

export function getAllProducts(): LocalProduct[] {
  return readProducts();
}

export function getEnabledProducts(): LocalProduct[] {
  return readProducts().filter(p => p.enabled !== false);
}

export function getProductBySlugLocal(slug: string): LocalProduct | null {
  return readProducts().find(p => p.slug === slug) || null;
}

export function addProduct(product: Omit<LocalProduct, 'id'>): LocalProduct {
  const products = readProducts();
  const maxId = products.reduce((max, p) => Math.max(max, p.id), 0);
  const newProduct: LocalProduct = { ...product, id: maxId + 1, enabled: true };
  products.push(newProduct);
  writeProducts(products);
  return newProduct;
}

export function updateProduct(id: number, data: Partial<LocalProduct>): LocalProduct | null {
  const products = readProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return null;
  products[idx] = { ...products[idx], ...data, id };
  writeProducts(products);
  return products[idx];
}

export function deleteProduct(id: number): boolean {
  const products = readProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return false;
  const product = products[idx];

  // Удаляем изображения товара
  if (product.local_images) {
    for (const img of product.local_images) {
      const imgPath = path.join(process.cwd(), 'public', img);
      try {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      } catch { /* ignore */ }
    }
  }

  products.splice(idx, 1);
  writeProducts(products);
  return true;
}

export function toggleProductEnabled(id: number): LocalProduct | null {
  const products = readProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return null;
  products[idx].enabled = products[idx].enabled === false ? true : false;
  writeProducts(products);
  return products[idx];
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function saveProductImage(slug: string, index: number, buffer: Buffer): string {
  const filename = `${slug}-${index + 1}.webp`;
  const filepath = path.join(IMAGES_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  return `/images/${filename}`;
}
