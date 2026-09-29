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
  // Rule: [TypePrefix] [Brand] [Model] [DualSIM] [4G/5G] [PartNumber] [RAM/Storage] [Version] [(color)]
  // Each block is included ONLY if the attribute is filled. Empty = skip.
  const typePrefix = p.typePrefix || 'Смартфон';
  const brand = getBrand(p);
  let model = getModel(p, brand);
  model = model.replace(/"/g, '').replace(/\s+/g, ' ').trim();

  const parts: string[] = [typePrefix];
  if (brand) parts.push(brand);
  if (model) parts.push(model);

  // dual_sim
  if (p.dual_sim) parts.push(p.dual_sim);

  // network_module (4G/5G/LTE) — skip if already in model name
  const netMod = p.network_module || '';
  if (netMod && !model.toLowerCase().includes(netMod.toLowerCase())) parts.push(netMod);

  // part_number (SM-xxx, MLN-LX9, etc.)
  if (p.part_number) parts.push(p.part_number);

  // RAM/Storage
  const ram = normalizeMemory(attrs['Оперативная память'] || '');
  const storage = normalizeMemory(attrs['Встроенная память'] || '');
  if (ram && storage) parts.push(`${ram}/${storage}`);
  else if (storage) parts.push(storage);
  else if (ram) parts.push(ram);

  // version (международная/индийская/европейская)
  if (p.model_version) parts.push(p.model_version);

  // color — always last, in parentheses, lowercase
  const color = (attrs['Цвет корпуса'] || '').toLowerCase();
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
      // For headphones: always use full card name; for others: csvName || buildVariationName
      if (v.name?.includes('AirPods') || p?.name?.includes('AirPods')) {
        console.log('=== AIRPODS DEBUG ===');
        console.log('csvCategory =', JSON.stringify(csvCategory));
        console.log('typeof csvCategory =', typeof csvCategory);
        console.log('v.name =', JSON.stringify(v.name));
        console.log('v.csvName =', JSON.stringify(v.csvName));
        console.log('p.name =', JSON.stringify(p?.name));
        console.log('p.categories =', JSON.stringify(p?.categories));
        console.log('attrs =', JSON.stringify(attrs));
        console.log('====================');
      }
      const varName = csvCategory === 'Наушники и гарнитуры'
        ? v.name
        : (v.csvName || buildVariationName(p, attrs));
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
    const simpleName = csvCategory === 'Наушники и гарнитуры'
      ? (p.name.startsWith('Наушники') ? p.name : `Наушники ${p.name}`)
      : buildVariationName(p, {});
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
