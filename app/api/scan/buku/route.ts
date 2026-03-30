import { NextRequest, NextResponse } from 'next/server';
import { authProtectedEndpoint } from '@/lib/api-auth';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  return authProtectedEndpoint(request, async () => {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code') || '';

    if (!code) {
      return NextResponse.json({ error: 'Kode tidak boleh kosong' }, { status: 400 });
    }

    // Search by kode_buku or ISBN
    const [[buku]] = await db.query<RowDataPacket[]>(
      `SELECT b.*, kb.nama as kategori_nama, r.kode_rak, r.nama as rak_nama
       FROM buku b
       LEFT JOIN kategori_buku kb ON b.kategori_id = kb.id
       LEFT JOIN rak r ON b.rak_id = r.id
       WHERE b.kode_buku = ? OR b.isbn = ?`,
      [code, code]
    );

    if (!buku) {
      return NextResponse.json({ error: 'Buku tidak ditemukan', found: false }, { status: 404 });
    }

    return NextResponse.json({ data: buku, found: true });
  }, ['admin', 'perpus']);
}
