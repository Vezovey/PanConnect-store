import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
const PUBLIC_IMAGES = path.join(process.cwd(), 'public', 'images');

const ALLOWED_EXTENSIONS: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  // Validate filename: only safe characters, no path traversal
  if (!filename || !/^[a-zA-Z0-9._-]+$/.test(filename)) {
    return new NextResponse('Bad filename', { status: 400 });
  }
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return new NextResponse('Forbidden', { status: 400 });
  }

  const ext = path.extname(filename).toLowerCase();
  const contentType = ALLOWED_EXTENSIONS[ext];
  if (!contentType) {
    return new NextResponse('Unsupported file type', { status: 400 });
  }

  // Try uploads/images/ first, then public/images/ (fallback for old files)
  const uploadPath = path.join(UPLOADS_DIR, 'images', filename);
  const publicPath = path.join(PUBLIC_IMAGES, filename);

  let filePath: string;
  if (fs.existsSync(uploadPath)) {
    filePath = uploadPath;
  } else if (fs.existsSync(publicPath)) {
    filePath = publicPath;
  } else {
    return new NextResponse('Not found', { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const buffer = fs.readFileSync(filePath);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(stat.size),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
