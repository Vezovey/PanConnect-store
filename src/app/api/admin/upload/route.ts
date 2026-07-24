import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { saveProductImage } from '@/lib/admin-products';

export async function POST(req: NextRequest) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const slug = formData.get('slug') as string | null;
    const index = parseInt(formData.get('index') as string || '0', 10);

    if (!file || !slug) {
      return NextResponse.json({ error: 'Missing file or slug' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const path = saveProductImage(slug, index, buffer);

    return NextResponse.json({ path, ok: true });
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
