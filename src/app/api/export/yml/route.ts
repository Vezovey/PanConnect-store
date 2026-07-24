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

function buildVariationName(p: LocalProduct, attrs: Record<string, string>): string {
  const parts: string[] = [];
  if (p.typePrefix) parts.push(p.typePrefix);
  if (p.vendor) parts.push(p.vendor);
  if (p.model) parts.push(p.model);
  else parts.push(p.name);

  const extras: string[] = [];
  for (const [, v] of Object.entries(attrs)) {
    if (v) extras.push(v);
  }
  if (extras.length) parts.push('(' + extras.join(', ') + ')');

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
  params: string
): string {
  let xml = '      <offer id="' + escapeXml(id) + '" available="true">\n';
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
  if (!p.enabled && p.enabled !== undefined) return [];

  const offers: string[] = [];
  const shopId = p.shopById || p.slug;
  const url = SITE_URL + '/product/' + p.slug + '/';
  const imgUrl = p.local_images?.[0] ? SITE_URL + p.local_images[0] : '';
  const description = stripHtml(p.short_description || '');
  const deliveryDays = p.deliveryDays ?? 1;
  const orderBefore = p.orderBefore ?? 18;
  const catId = p.shopByCategory ?? 1;
  const marketCat = MARKET_CATEGORY_MAP[catId] || 'Мобильные телефоны';

  if (p.type === 'variable' && p.variations && p.variations.length > 0) {
    for (const v of p.variations) {
      const attrs: Record<string, string> = {};
      for (const a of v.attributes) {
        attrs[a.name] = a.option;
      }
      const varName = buildVariationName(p, attrs);
      const varId = shopId + '-' + v.id;
      const varPrice = v.sale_price || v.price || p.price;
      const oldprice = v.sale_price ? (v.price || p.price) : '';

      let params = '';
      params += '        <param name="Производитель">' + escapeXml(p.vendor || '') + '</param>\n';
      for (const a of v.attributes) {
        params += '        <param name="' + escapeXml(a.name) + '">' + escapeXml(a.option) + '</param>\n';
      }

      offers.push(buildOffer(varId, url, imgUrl, varPrice, oldprice, catId, marketCat, varName, description, deliveryDays, orderBefore, params));
    }
  } else {
    const simpleName = buildVariationName(p, {});
    let params = '';
    params += '        <param name="Производитель">' + escapeXml(p.vendor || '') + '</param>\n';
    for (const a of p.attributes || []) {
      if (a.options.length === 1) {
        params += '        <param name="' + escapeXml(a.name) + '">' + escapeXml(a.options[0]) + '</param>\n';
      }
    }

    offers.push(buildOffer(shopId, url, imgUrl, p.price, p.sale_price || '', catId, marketCat, simpleName, description, deliveryDays, orderBefore, params));
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
