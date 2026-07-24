import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { getAllProducts } from '@/lib/admin-products';
import type { LocalProduct } from '@/lib/woocommerce';

const SITE_URL = 'https://panconnect.by';
const DELIVERY_DAYS = '21';

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
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function getBrand(p: LocalProduct): string {
  if (p.vendor) return p.vendor;
  for (const cat of p.categories) {
    const parts = cat.split(' > ');
    if (parts.length >= 2 && parts[0] === 'Смартфоны') {
      return parts[1];
    }
  }
  return '';
}

function getModel(p: LocalProduct, brand: string): string {
  if (p.model) return p.model;
  if (brand && p.name.startsWith(brand)) {
    return p.name.slice(brand.length).trim();
  }
  return p.name;
}

function buildVariationName(p: LocalProduct, attrs: Record<string, string>): string {
  const typePrefix = p.typePrefix || 'Смартфон';
  const brand = getBrand(p);
  const model = getModel(p, brand);

  const parts: string[] = [typePrefix];
  if (brand) parts.push(brand);
  if (model) parts.push(model);

  const ram = attrs['Оперативная память'] || '';
  const storage = attrs['Встроенная память'] || '';
  if (ram && storage) {
    parts.push(`${ram}/${storage}`);
  } else if (storage) {
    parts.push(storage);
  } else if (ram) {
    parts.push(ram);
  }

  const color = attrs['Цвет корпуса'] || '';
  if (color) {
    parts.push(`(${color})`);
  }

  return parts.join(' ');
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
  if (!p.enabled && p.enabled !== undefined) return [];

  const rows: CsvRow[] = [];
  const shopId = p.shopById || p.slug;
  const url = `${SITE_URL}/shop/${p.slug}/`;
  const imgUrl = p.local_images?.[0] ? `${SITE_URL}${p.local_images[0]}` : '';
  const description = stripHtml(p.short_description || '');

  if (p.type === 'variable' && p.variations && p.variations.length > 0) {
    for (const v of p.variations) {
      const attrs: Record<string, string> = {};
      for (const a of v.attributes) {
        attrs[a.name] = a.option;
      }
      const varName = buildVariationName(p, attrs);
      const varId = `${shopId}-${v.id}`;
      const varPrice = v.sale_price || v.price || p.price;

      rows.push({
        id: varId,
        available: 'true',
        url,
        price: String(varPrice),
        oldprice: v.sale_price ? (v.price || p.price) : '',
        currencyId: 'BYN',
        delivery_days: DELIVERY_DAYS,
        category: 'Телефоны',
        picture: imgUrl,
        name: varName,
        description,
      });
    }
  } else {
    const simpleName = buildVariationName(p, {});
    rows.push({
      id: shopId,
      available: 'true',
      url,
      price: p.price,
      oldprice: p.sale_price || '',
      currencyId: 'BYN',
      delivery_days: DELIVERY_DAYS,
      category: 'Телефоны',
      picture: imgUrl,
      name: simpleName,
      description,
    });
  }

  return rows;
}

function utf8ToWin1251(str: string): Buffer {
  const buf = Buffer.alloc(str.length * 3);
  let offset = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 0x80) {
      buf[offset++] = code;
    } else if (code >= 0x0410 && code <= 0x042F) {
      buf[offset++] = code - 0x0410 + 0xC0;
    } else if (code >= 0x0430 && code <= 0x044F) {
      buf[offset++] = code - 0x0430 + 0xE0;
    } else if (code === 0x0401) {
      buf[offset++] = 0xA8;
    } else if (code === 0x0451) {
      buf[offset++] = 0xB8;
    } else if (code === 0x2014) {
      buf[offset++] = 0x96;
    } else if (code === 0x2013) {
      buf[offset++] = 0x97;
    } else if (code === 0x00AB) {
      buf[offset++] = 0xAB;
    } else if (code === 0x00BB) {
      buf[offset++] = 0xBB;
    } else if (code === 0x00B7) {
      buf[offset++] = 0xB7;
    } else if (code === 0x2116) {
      buf[offset++] = 0xB9;
    } else {
      buf[offset++] = 0x3F;
    }
  }
  return buf.subarray(0, offset);
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
  const buf = utf8ToWin1251(csv);
  const now = new Date();

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'text/csv; charset=windows-1251',
      'Content-Disposition': `attachment; filename="pricelist_${now.toISOString().slice(0, 10)}.csv"`,
    },
  });
}
