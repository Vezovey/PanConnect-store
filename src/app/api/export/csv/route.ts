import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { getAllProducts } from '@/lib/admin-products';
import type { LocalProduct } from '@/lib/woocommerce';

const SITE_URL = 'https://panconnect.by';

function csvEscape(s: string): string {
  if (!s) return '';
  if (s.includes(';') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/li>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeMemory(s: string): string {
  return s.replace(/(\d+)\s*ГБ/g, '$1GB').replace(/(\d+)\s*ТБ/g, '$1TB');
}

function getBrand(p: LocalProduct): string {
  if (p.vendor) return p.vendor;
  for (const cat of p.categories) {
    const parts = cat.split(' > ');
    if (parts.length >= 2) return parts[1];
  }
  return '';
}

function getModel(p: LocalProduct, brand: string): string {
  if (p.model) return p.model;
  if (brand && p.name.startsWith(brand)) return p.name.slice(brand.length).trim();
  return p.name;
}

function buildVariationName(p: LocalProduct, attrs: Record<string, string>): string {
  const typePrefix = p.typePrefix || 'Смартфон';
  const brand = getBrand(p);
  let model = getModel(p, brand);

  // Strip memory, color, version from model to avoid duplication
  model = model
    .replace(/"/g, '')
    .replace(/\d+GB\/\d+GB/gi, '')
    .replace(/\d+GB\/\d+TB/gi, '')
    .replace(/\d+TB/gi, '')
    .replace(/\d+GB(?!\s*\/)/gi, '')
    .replace(/\s*\([^)]+\)\s*$/, '')
    .replace(/\s+международная версия/i, '')
    .replace(/\s+европейская версия/i, '')
    .replace(/\s+SM-[A-Z0-9]+/i, '')
    .replace(/\s+MLN-[A-Z0-9]+/i, '')
    .replace(/\s+Wi-Fi/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  const parts: string[] = [typePrefix];
  if (brand) parts.push(brand);
  if (model) parts.push(model);

  const ram = normalizeMemory(attrs['Оперативная память'] || '');
  const storage = normalizeMemory(attrs['Встроенная память'] || '');
  if (ram && storage) parts.push(`${ram}/${storage}`);
  else if (storage) parts.push(storage);
  else if (ram) parts.push(ram);

  const color = attrs['Цвет корпуса'] || '';
  if (color) parts.push(`(${color})`);

  return parts.join(' ');
}

function getCsvCategory(p: LocalProduct): string {
  const root = p.categories?.[0] || '';
  const map: Record<string, string> = {
    'Смартфоны': 'Телефоны', 'Планшеты': 'Планшеты',
    'Наушники и аксессуары': 'Наушники и гарнитуры', 'Электронные книги': 'Электронные книги',
  };
  return map[root] || 'Телефоны';
}

interface CsvRow {
  id: string;
  available: string;
  url: string;
  price: string;
  oldprice: string;
  currencyId: string;
  delivery_days: string;
  category: string;
  picture: string;
  name: string;
  description: string;
}

function productToRows(p: LocalProduct): CsvRow[] {
  if (p.enabled === false) return [];

  const rows: CsvRow[] = [];
  const url = `${SITE_URL}/shop/${p.slug}/`;
  const imgUrl = p.local_images?.[0] ? `${SITE_URL}${p.local_images[0]}` : '';
  const description = stripHtml(p.short_description || '');
  const csvCategory = getCsvCategory(p);
  // delivery_days: auto for preorder, or from product data
  const deliveryDays = p.preorder ? '21' : String(p.deliveryDays || '');

  if (p.type === 'variable' && p.variations && p.variations.length > 0) {
    for (const v of p.variations) {
      if (v.enabled === false) continue;
      const attrs: Record<string, string> = {};
      for (const a of v.attributes) attrs[a.name] = a.option;
      const varName = v.csvName || buildVariationName(p, attrs);
      const varPrice = v.sale_price || v.price || p.price;

      rows.push({
        id: String(v.id),
        available: p.preorder ? 'false' : 'true',
        url,
        price: String(varPrice),
        oldprice: '', // Always empty per spec
        currencyId: 'BYN',
        delivery_days: deliveryDays,
        category: csvCategory,
        picture: imgUrl,
        name: varName,
        description,
      });
    }
  } else {
    const simpleName = buildVariationName(p, {});
    rows.push({
      id: String(p.id),
      available: p.preorder ? 'false' : 'true',
      url,
      price: p.price,
      oldprice: '', // Always empty per spec
      currencyId: 'BYN',
      delivery_days: deliveryDays,
      category: csvCategory,
      picture: imgUrl,
      name: simpleName,
      description,
    });
  }

  return rows;
}

export async function GET() {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const products = getAllProducts();
  const header = 'id;available;url;price;oldprice;currencyId;delivery_days;category;picture;name;description';

  const allRows: string[] = [];
  for (const p of products) {
    for (const row of productToRows(p)) {
      allRows.push(
        [row.id, row.available, row.url, row.price, row.oldprice, row.currencyId,
         row.delivery_days, row.category, row.picture, row.name, row.description]
          .map(csvEscape)
          .join(';')
      );
    }
  }

  const csv = header + '\n' + allRows.join('\n');
  // UTF-8 with BOM: 0xEF 0xBB 0xBF as raw bytes, then UTF-8 content
  const bomBuf = Buffer.from([0xEF, 0xBB, 0xBF]);
  const csvBuf = Buffer.from(csv, 'utf-8');
  const buf = Buffer.concat([bomBuf, csvBuf]);

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="price_list_panconnect.csv"',
    },
  });
}
