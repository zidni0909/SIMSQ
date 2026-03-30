import { NextRequest, NextResponse } from 'next/server';
import { authProtectedEndpoint } from '@/lib/api-auth';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  return authProtectedEndpoint(request, async () => {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids'); // comma-separated IDs
    const search = searchParams.get('search') || '';
    const kategori = searchParams.get('kategori') || '';

    if (ids) {
      const idList = ids.split(',').map(Number).filter(Boolean);
      if (idList.length === 0) {
        return NextResponse.json({ data: [] });
      }
      const placeholders = idList.map(() => '?').join(',');
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT b.id, b.kode_barang, b.nama, b.merk, kb.nama as kategori_nama, l.nama as lokasi_nama
         FROM barang b
         LEFT JOIN kategori_barang kb ON b.kategori_id = kb.id
         LEFT JOIN lokasi l ON b.lokasi_id = l.id
         WHERE b.id IN (${placeholders})
         ORDER BY b.nama`,
        idList
      );
      return NextResponse.json({ data: rows });
    }

    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (search) {
      where += ' AND (b.nama LIKE ? OR b.kode_barang LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (kategori) {
      where += ' AND b.kategori_id = ?';
      params.push(kategori);
    }

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT b.id, b.kode_barang, b.nama, b.merk, kb.nama as kategori_nama, l.nama as lokasi_nama
       FROM barang b
       LEFT JOIN kategori_barang kb ON b.kategori_id = kb.id
       LEFT JOIN lokasi l ON b.lokasi_id = l.id
       ${where}
       ORDER BY b.nama`,
      params
    );

    const [kategoriList] = await db.query<RowDataPacket[]>('SELECT id, nama FROM kategori_barang ORDER BY nama');

    return NextResponse.json({ data: rows, filters: { kategoriList } });
  }, ['admin', 'sarpras', 'kepala_sekolah']);
}
