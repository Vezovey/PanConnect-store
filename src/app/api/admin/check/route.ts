import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET() {
  const isAdmin = await verifyAdmin();
  return NextResponse.json({ isAdmin });
}