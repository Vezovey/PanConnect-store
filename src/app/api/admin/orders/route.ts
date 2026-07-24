import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { getAllOrders, updateOrderStatus, deleteOrder } from '@/lib/orders';

export async function GET() {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json(getAllOrders());
}

export async function PATCH(req: NextRequest) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id, status, comment } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  if (status) {
    const order = updateOrderStatus(id, status);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  if (comment !== undefined) {
    const { updateOrderComment } = await import('@/lib/orders');
    updateOrderComment(id, comment);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  const ok = deleteOrder(id);
  if (!ok) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
