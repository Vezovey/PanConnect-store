import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { getAllProducts, addProduct, updateProduct, deleteProduct, toggleProductEnabled, slugify } from '@/lib/admin-products';

export async function GET() {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const products = getAllProducts();
  const summary = products.map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    type: p.type,
    price: p.price,
    sale_price: p.sale_price,
    brand: p.brand,
    categories: p.categories,
    short_description: p.short_description || '',
    description: p.description || '',
    specs: p.specs || [],
    in_stock: true,
    enabled: p.enabled !== false,
    variations_count: p.variations?.length || 0,
    attributes: p.attributes || [],
    variations: p.variations || [],
    local_images: p.local_images || [],
  }));
  return NextResponse.json({ total: summary.length, products: summary });
}

export async function POST(req: NextRequest) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, price, sale_price, short_description, description, categories, type, attributes, variations, local_images, specs } = body;

    if (!name || !price) {
      return NextResponse.json({ error: 'Название и цена обязательны' }, { status: 400 });
    }

    const product = addProduct({
      name,
      slug: slugify(name),
      type: type || 'simple',
      price: String(price),
      sale_price: sale_price ? String(sale_price) : '',
      short_description: short_description || '',
      description: description || '',
      local_images: local_images || [],
      categories: categories || [],
      brand: '',
      attributes: attributes || [],
      variations: variations || [],
      enabled: true,
      specs: specs || [],
    });

    return NextResponse.json({ id: product.id, slug: product.slug, ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing product id' }, { status: 400 });
    }

    if (data.name) {
      data.slug = slugify(data.name);
    }
    if (data.price !== undefined) data.price = String(data.price);
    if (data.sale_price !== undefined) data.sale_price = String(data.sale_price);

    const product = updateProduct(id, data);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing product id' }, { status: 400 });
    }

    const ok = deleteProduct(id);
    if (!ok) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, enabled } = await req.json();
    if (id === undefined) {
      return NextResponse.json({ error: 'Missing product id' }, { status: 400 });
    }

    const product = toggleProductEnabled(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, enabled: product.enabled !== false });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
