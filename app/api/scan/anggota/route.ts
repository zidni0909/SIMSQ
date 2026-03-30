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

    const [[anggota]] = await db.query<RowDataPacket[]>(
      `SELECT * FROM anggota WHERE kode_anggota = ?`,
      [code]
    );

    if (!anggota) {
      return NextResponse.json({ error: 'Anggota tidak ditemukan', found: false }, { status: 404 });
    }

    // Get active peminjaman
    const [activePinjaman] = await db.query<RowDataPacket[]>(
      `SELECT pb.*, b.judul as buku_judul, b.kode_buku
       FROM peminjaman_buku pb
       LEFT JOIN buku b ON pb.buku_id = b.id
       WHERE pb.anggota_id = ? AND pb.status IN ('dipinjam', 'terlambat')
       ORDER BY pb.tanggal_pinjam DESC`,
      [anggota.id]
    );

    return NextResponse.json({ data: { ...anggota, active_pinjaman: activePinjaman }, found: true });
  }, ['admin', 'perpus']);
}
