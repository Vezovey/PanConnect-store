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

function buildExportName(p: LocalProduct, attrs: Record<string, string>): string {
  const typePrefix = p.typePrefix || 'Смартфон';
  let model = (p.model || p.name).replace(/^(Смартфон|Планшет|Наушники|Электронная книга|Ноутбук)\s+/, '').trim();
  model = model.replace(/\s+/g, ' ').trim();

  const ef = p.exportFields;
  const isHuawei = model.startsWith('Huawei') || model.startsWith('Pura');
  const isSamsungTab = model.includes('Tab');
  const isSamsung = model.includes('Samsung') || model.includes('Galaxy');
  const isEarphone = (p.categories || []).some(c => c.includes('Наушники'));

  const netMod = (ef?.antenna !== false) ? (attrs['Модуль связи'] || attrs['Модуль антенны'] || p.network_module || '') : '';
  const ram = normalizeMemory(attrs['Оперативная память'] || '');
  const storage = normalizeMemory(attrs['Встроенная память'] || '');
  const color = (attrs['Цвет корпуса'] || '').toLowerCase();
  const version = (ef?.version && p.model_version) ? p.model_version : '';
  const kit = (ef?.kit && attrs['Комплектация']) ? attrs['Комплектация'] : '';
  const processor = (ef?.processor && p.processor) ? p.processor : '';

  const tokens: Record<string, string> = {};
  tokens.typePrefix = typePrefix;
  tokens.model = model;
  tokens.dualSim = (ef?.dualSim && p.dual_sim && !isSamsung) ? 'Dual SIM' : '';
  tokens.netMod = (netMod && !model.toLowerCase().includes(netMod.toLowerCase())) ? netMod : '';
  const partNum = attrs['Парт-номер'] || p.part_number || '';
  if (ef?.partNumber && partNum) {
    let pn = partNum;
    if (isSamsung && ef?.dualSim && p.dual_sim && !pn.endsWith('/DS')) pn += '/DS';
    tokens.partNumber = pn;
  } else tokens.partNumber = '';
  tokens.ramStorage = (ram && storage) ? `${ram}/${storage}` : (storage || ram);
  tokens.processor = processor;
  tokens.version = version;
  tokens.kit = kit;
  tokens.color = color;

  const DEFAULT_ORDER = ['typePrefix','model','dualSim','netMod','partNumber','ramStorage','processor','version','kit','color'];
  const rawOrder = p.exportOrder && p.exportOrder.length > 0 ? p.exportOrder : DEFAULT_ORDER.map(k => ({ key: k, brackets: k === 'color' || k === 'kit' }));
  
  const parts: string[] = [];
  const bracketGroup: string[] = [];
  for (const item of rawOrder) {
    const key = typeof item === 'string' ? item : item.key;
    const brackets = typeof item === 'string' ? (key === 'color' || key === 'kit') : item.brackets;
    const val = tokens[key];
    if (!val) continue;
    if (brackets) {
      bracketGroup.push(val);
    } else {
      if (bracketGroup.length > 0) {
        parts.push(`(${bracketGroup.join(', ')})`);
        bracketGroup.length = 0;
      }
      parts.push(val);
    }
  }
  if (bracketGroup.length > 0) parts.push(`(${bracketGroup.join(', ')})`);

  return parts.join(' ');
}

function getCsvCategory(p: LocalProduct): string {
  const root = p.categories?.[0] || '';
  const map: Record<string, string> = {
    'Смартфон': 'Телефоны', 'Смартфоны': 'Телефоны',
    'Планшет': 'Планшеты', 'Планшеты': 'Планшеты',
    'Наушники': 'Наушники и гарнитуры', 'Наушники и аксессуары': 'Наушники и гарнитуры',
    'Электронная книга': 'Электронные книги', 'Электронные книги': 'Электронные книги',
    'Ноутбук': 'Ноутбуки', 'Ноутбуки': 'Ноутбуки',
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
  // delivery_days: from variation (if preorder) or product
  const baseDeliveryDays = String(p.deliveryDays || '');

  if (p.type === 'variable' && p.variations && p.variations.length > 0) {
    for (const v of p.variations) {
      if (v.enabled === false) continue;
      const attrs: Record<string, string> = {};
      const raw = v.attributes;
      if (Array.isArray(raw)) {
        for (const a of raw) attrs[a.name] = a.option;
      } else if (raw && typeof raw === 'object') {
        Object.assign(attrs, raw as Record<string, string>);
      }
      // For headphones: always use full card name; for others: csvName || buildVariationName
      const varName = csvCategory === 'Наушники и гарнитуры'
        ? (v.csvName || buildExportName(p, attrs))
        : (v.csvName || buildExportName(p, attrs));
      const varPrice = v.sale_price || v.price || p.price;

      rows.push({
        id: String(v.id),
        available: 'true',
        url,
        price: String(varPrice),
        oldprice: '', // Always empty per spec
        currencyId: 'BYN',
        delivery_days: String(v.deliveryDays || baseDeliveryDays),
        category: csvCategory,
        picture: imgUrl,
        name: varName,
        description,
      });
    }
  } else {
    const simpleName = csvCategory === 'Наушники и гарнитуры'
      ? (p.csvName || buildExportName(p, {}))
      : buildExportName(p, {});
    rows.push({
      id: String(p.id),
      available: 'true',
      url,
      price: p.price,
      oldprice: '', // Always empty per spec
      currencyId: 'BYN',
      delivery_days: baseDeliveryDays,
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
