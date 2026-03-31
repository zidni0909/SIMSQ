import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { authProtectedEndpoint } from '@/lib/api-auth';

const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true, // wajib untuk MinIO
});

const BUCKET = process.env.MINIO_BUCKET || 'simsq';
const PUBLIC_URL = process.env.MINIO_PUBLIC_URL || process.env.MINIO_ENDPOINT;

export async function POST(request: NextRequest) {
  return authProtectedEndpoint(request, async () => {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'barang';

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran file maksimal 2MB' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Format file harus JPG, PNG, atau WebP' }, { status: 400 });
    }

    const safeFolder = folder.replace(/[^a-z0-9_-]/gi, '');
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${safeFolder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: filename,
      Body: buffer,
      ContentType: file.type,
    }));

    const url = `${PUBLIC_URL}/${BUCKET}/${filename}`;
    return NextResponse.json({ url });
  });
}
