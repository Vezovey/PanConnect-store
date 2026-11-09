import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { getNextProductId, getNextVariationId } from '@/lib/admin-products';

export async function GET() {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({
    nextProductId: getNextProductId(),
    nextVariationId: getNextVariationId(),
  });
}