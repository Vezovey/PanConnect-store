import { NextRequest, NextResponse } from 'next/server';
import { addOrder } from '@/lib/orders';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, subtotal, delivery, total, customer, comment, source } = body;

    if (!items?.length || !customer?.name || !customer?.phone || !customer?.city || !customer?.address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const order = addOrder({
      items,
      subtotal,
      delivery: delivery || 0,
      total,
      customer,
      comment,
      source: source || 'Корзина',
      date: new Date().toISOString(),
    });

    return NextResponse.json({ id: order.id, ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
