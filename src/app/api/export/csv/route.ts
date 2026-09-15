import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { getAllProducts } from '@/lib/admin-products';
import type { LocalProduct } from '@/lib/woocommerce';

const SITE_URL = 'https://panconnect.by';
const PREORDER_DELIVERY_DAYS = '21';

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
    .replace(/\s+/g, ' ')
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
  if (p.enabled === false) return [];

  const rows: CsvRow[] = [];
  const url = `${SITE_URL}/shop/${p.slug}/`;
  const imgUrl = p.local_images?.[0] ? `${SITE_URL}${p.local_images[0]}` : '';
  const description = stripHtml(p.short_description || '');

  if (p.type === 'variable' && p.variations && p.variations.length > 0) {
    for (const v of p.variations) {
      const attrs: Record<string, string> = {};
      for (const a of v.attributes) {
        attrs[a.name] = a.option;
      }
      const varName = v.csvName || buildVariationName(p, attrs);
      const varPrice = v.sale_price || v.price || p.price;

      rows.push({
        id: String(v.id),
        available: p.preorder ? 'false' : 'true',
        url,
        price: String(varPrice),
        oldprice: v.sale_price ? (v.price || p.price) : '',
        currencyId: 'BYN',
        delivery_days: p.preorder ? PREORDER_DELIVERY_DAYS : '',
        category: 'Телефоны',
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
      oldprice: p.sale_price || '',
      currencyId: 'BYN',
      delivery_days: p.preorder ? PREORDER_DELIVERY_DAYS : '',
      category: 'Телефоны',
      picture: imgUrl,
      name: simpleName,
      description,
    });
  }

  return rows;
}

function sanitizeForWin1251(str: string): string {
  return str
    .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/\u00D7/g, 'x')
    .replace(/\u2026/g, '...')
    .replace(/\u00B0/g, '\u00B0')
    .replace(/[\u00A0\u2009\u200A\u2002\u2003]/g, ' ')
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, '')
    .replace(/\u2248/g, '~')
    .replace(/\u2260/g, '!=')
    .replace(/\u2264/g, '<=')
    .replace(/\u2265/g, '>=')
    .replace(/[\u2500-\u257F]/g, '-');
}

function utf8ToWin1251(str: string): Buffer {
  str = sanitizeForWin1251(str);
  const buf = Buffer.alloc(str.length * 3);
  let offset = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 0x80) {
      buf[offset++] = code;
    } else if (WIN1251_MAP[code] !== undefined) {
      buf[offset++] = WIN1251_MAP[code];
    } else {
      buf[offset++] = 0x3F;
    }
  }
  return buf.subarray(0, offset);
}

const WIN1251_MAP: Record<number, number> = {
  0x0402: 0x80, 0x0403: 0x81, 0x201A: 0x82, 0x0453: 0x83, 0x201E: 0x84,
  0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x20AC: 0x88, 0x2030: 0x89,
  0x0409: 0x8A, 0x2039: 0x8B, 0x040A: 0x8C, 0x040C: 0x8D, 0x040B: 0x8E,
  0x040F: 0x8F, 0x0452: 0x90, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93,
  0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x2122: 0x99,
  0x0459: 0x9A, 0x203A: 0x9B, 0x045A: 0x9C, 0x045C: 0x9D, 0x045B: 0x9E,
  0x045F: 0x9F, 0x00A0: 0xA0, 0x040E: 0xA1, 0x045E: 0xA2, 0x0408: 0xA3,
  0x00A4: 0xA4, 0x0490: 0xA5, 0x00A6: 0xA6, 0x00A7: 0xA7, 0x0401: 0xA8,
  0x00A9: 0xA9, 0x0404: 0xAA, 0x00AB: 0xAB, 0x00AC: 0xAC, 0x00AD: 0xAD,
  0x00AE: 0xAE, 0x0407: 0xAF, 0x00B0: 0xB0, 0x00B1: 0xB1, 0x0406: 0xB2,
  0x0456: 0xB3, 0x0491: 0xB4, 0x00B5: 0xB5, 0x00B6: 0xB6, 0x00B7: 0xB7,
  0x0451: 0xB8, 0x2116: 0xB9, 0x0454: 0xBA, 0x00BB: 0xBB, 0x0458: 0xBC,
  0x0405: 0xBD, 0x0455: 0xBE, 0x0457: 0xBF,
  0x0410: 0xC0, 0x0411: 0xC1, 0x0412: 0xC2, 0x0413: 0xC3, 0x0414: 0xC4,
  0x0415: 0xC5, 0x0416: 0xC6, 0x0417: 0xC7, 0x0418: 0xC8, 0x0419: 0xC9,
  0x041A: 0xCA, 0x041B: 0xCB, 0x041C: 0xCC, 0x041D: 0xCD, 0x041E: 0xCE,
  0x041F: 0xCF, 0x0420: 0xD0, 0x0421: 0xD1, 0x0422: 0xD2, 0x0423: 0xD3,
  0x0424: 0xD4, 0x0425: 0xD5, 0x0426: 0xD6, 0x0427: 0xD7, 0x0428: 0xD8,
  0x0429: 0xD9, 0x042A: 0xDA, 0x042B: 0xDB, 0x042C: 0xDC, 0x042D: 0xDD,
  0x042E: 0xDE, 0x042F: 0xDF,
  0x0430: 0xE0, 0x0431: 0xE1, 0x0432: 0xE2, 0x0433: 0xE3, 0x0434: 0xE4,
  0x0435: 0xE5, 0x0436: 0xE6, 0x0437: 0xE7, 0x0438: 0xE8, 0x0439: 0xE9,
  0x043A: 0xEA, 0x043B: 0xEB, 0x043C: 0xEC, 0x043D: 0xED, 0x043E: 0xEE,
  0x043F: 0xEF, 0x0440: 0xF0, 0x0441: 0xF1, 0x0442: 0xF2, 0x0443: 0xF3,
  0x0444: 0xF4, 0x0445: 0xF5, 0x0446: 0xF6, 0x0447: 0xF7, 0x0448: 0xF8,
  0x0449: 0xF9, 0x044A: 0xFA, 0x044B: 0xFB, 0x044C: 0xFC, 0x044D: 0xFD,
  0x044E: 0xFE, 0x044F: 0xFF,
  0x00D7: 0x3F, 0x2033: 0x22, 0x2032: 0x27,
};

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
      'Content-Disposition': 'attachment; filename="price_list_panconnect.csv"',
    },
  });
}
