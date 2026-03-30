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

    const [[barang]] = await db.query<RowDataPacket[]>(
      `SELECT b.*, kb.nama as kategori_nama, l.nama as lokasi_nama
       FROM barang b
       LEFT JOIN kategori_barang kb ON b.kategori_id = kb.id
       LEFT JOIN lokasi l ON b.lokasi_id = l.id
       WHERE b.kode_barang = ?`,
      [code]
    );

    if (!barang) {
      return NextResponse.json({ error: 'Barang tidak ditemukan', found: false }, { status: 404 });
    }

    return NextResponse.json({ data: barang, found: true });
  }, ['admin', 'sarpras']);
}
