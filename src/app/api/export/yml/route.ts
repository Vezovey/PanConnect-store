import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { getAllProducts } from '@/lib/admin-products';
import type { LocalProduct } from '@/lib/woocommerce';

const SITE_URL = 'https://panconnect.by';
const SHOP_NAME = 'PanConnect';
const SHOP_COMPANY = 'ООО «Коннект бай»';

const CATEGORY_MAP: Record<number, string> = {
  1: 'Смартфоны',
  2: 'Ноутбуки',
  3: 'Планшеты',
  4: 'Наушники и аксессуары',
};

const MARKET_CATEGORY_MAP: Record<number, string> = {
  1: 'Мобильные телефоны',
  2: 'Ноутбуки',
  3: 'Планшеты',
  4: 'Наушники и аксессуары',
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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

function normalizeMemory(s: string): string {
  return s.replace(/(\d+)\s*ГБ/g, '$1GB').replace(/(\d+)\s*ТБ/g, '$1TB');
}

function buildExportName(p: LocalProduct, attrs: Record<string, string>): string {
  const typePrefix = p.typePrefix || 'Смартфон';
  let model = (p.model || p.name).replace(/^(Смартфон|Планшет|Наушники|Электронная книга|Ноутбук)\s+/, '').trim();
  model = model.replace(/\s+/g, ' ').trim();

  const ef = p.exportFields;
  const isHuawei = model.startsWith('Huawei') || model.startsWith('Pura');
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

function buildOffer(
  id: string,
  url: string,
  imgUrl: string,
  price: string,
  oldprice: string,
  catId: number,
  marketCat: string,
  name: string,
  description: string,
  deliveryDays: number,
  orderBefore: number,
  params: string,
  available: boolean = true
): string {
  let xml = '      <offer id="' + escapeXml(id) + '" available="' + (available ? 'true' : 'false') + '">\n';
  xml += '        <url>' + escapeXml(url) + '</url>\n';
  xml += '        <delivery-options>\n';
  xml += '          <option days="' + deliveryDays + '" order-before="' + orderBefore + '"/>\n';
  xml += '        </delivery-options>\n';
  xml += '        <price>' + escapeXml(price) + '</price>\n';
  if (oldprice) {
    xml += '        <oldprice>' + escapeXml(oldprice) + '</oldprice>\n';
  }
  xml += '        <currencyId>BYN</currencyId>\n';
  xml += '        <categoryId>' + catId + '</categoryId>\n';
  xml += '        <market_category>' + escapeXml(marketCat) + '</market_category>\n';
  xml += '        <picture>' + escapeXml(imgUrl) + '</picture>\n';
  xml += '        <name>' + escapeXml(name) + '</name>\n';
  xml += '        <description>' + escapeXml(description) + '</description>\n';
  xml += params;
  xml += '      </offer>';
  return xml;
}

function productToOffers(p: LocalProduct): string[] {
  if (p.enabled === false) return [];

  const offers: string[] = [];
  const shopId = String(p.id);
  const url = SITE_URL + '/shop/' + p.slug + '/';
  const imgUrl = p.local_images?.[0] ? SITE_URL + p.local_images[0] : '';
  const description = stripHtml(p.short_description || '');
  const baseDeliveryDays = p.deliveryDays ?? 1;
  const orderBefore = p.orderBefore ?? 18;
  const catId = p.shopByCategory ?? 1;
  const marketCat = MARKET_CATEGORY_MAP[catId] || 'Мобильные телефоны';

  if (p.type === 'variable' && p.variations && p.variations.length > 0) {
    for (const v of p.variations) {
      if (v.enabled === false) continue;
      const attrs: Record<string, string> = {};
      for (const a of v.attributes) {
        attrs[a.name] = a.option;
      }
      const varName = buildExportName(p, attrs);
      const varId = String(v.id);
      const varPrice = v.sale_price || v.price || p.price;
      const oldprice = v.sale_price ? (v.price || p.price) : '';

      let params = '';
      params += '        <param name="Производитель">' + escapeXml(p.vendor || '') + '</param>\n';
      for (const a of v.attributes) {
        params += '        <param name="' + escapeXml(a.name) + '">' + escapeXml(a.option) + '</param>\n';
      }

      const varDelivery = v.deliveryDays || baseDeliveryDays;
      offers.push(buildOffer(varId, url, imgUrl, varPrice, oldprice, catId, marketCat, varName, description, varDelivery, orderBefore, params, true));
    }
  } else {
    const simpleName = buildExportName(p, {});
    let params = '';
    params += '        <param name="Производитель">' + escapeXml(p.vendor || '') + '</param>\n';
    for (const a of p.attributes || []) {
      if (a.options.length === 1) {
        params += '        <param name="' + escapeXml(a.name) + '">' + escapeXml(a.options[0]) + '</param>\n';
      }
    }

    offers.push(buildOffer(shopId, url, imgUrl, p.price, p.sale_price || '', catId, marketCat, simpleName, description, baseDeliveryDays, orderBefore, params, true));
  }

  return offers;
}

export async function GET() {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const products = getAllProducts();
  const now = new Date();
  const dateStr = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + ' ' +
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0');

  const allOffers: string[] = [];
  for (const p of products) {
    allOffers.push(...productToOffers(p));
  }

  const catEntries = Object.entries(CATEGORY_MAP)
    .map(([id, name]) => '      <category id="' + id + '">' + escapeXml(name) + '</category>')
    .join('\n');

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<!DOCTYPE yml_catalog SYSTEM "shops.dtd">\n';
  xml += '<yml_catalog date="' + dateStr + '">\n';
  xml += '  <shop>\n';
  xml += '    <name>' + escapeXml(SHOP_NAME) + '</name>\n';
  xml += '    <company>' + escapeXml(SHOP_COMPANY) + '</company>\n';
  xml += '    <url>' + SITE_URL + '/</url>\n';
  xml += '    <currencies>\n';
  xml += '      <currency id="BYN" rate="1"/>\n';
  xml += '    </currencies>\n';
  xml += '    <categories>\n';
  xml += catEntries + '\n';
  xml += '    </categories>\n';
  xml += '    <offers>\n';
  xml += allOffers.join('\n') + '\n';
  xml += '    </offers>\n';
  xml += '  </shop>\n';
  xml += '</yml_catalog>';

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': 'attachment; filename="pricelist_' + now.toISOString().slice(0, 10) + '.yml"',
    },
  });
}
