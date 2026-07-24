import { NextRequest, NextResponse } from 'next/server';
import { searchProducts } from '@/lib/woocommerce';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  if (q.trim().length < 2) {
    return NextResponse.json({ products: [] });
  }
  const products = await searchProducts(q);
  return NextResponse.json({
    products: products.map(p => ({
      name: p.name,
      slug: p.slug,
      price: p.price,
      image: p.images[0]?.src || null,
      type: p.type,
    })),
  });
}
