import { NextRequest, NextResponse } from 'next/server';
import { authProtectedEndpoint } from '@/lib/api-auth';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  return authProtectedEndpoint(request, async () => {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');
    const search = searchParams.get('search') || '';
    const kategori = searchParams.get('kategori') || '';

    if (ids) {
      const idList = ids.split(',').map(Number).filter(Boolean);
      if (idList.length === 0) {
        return NextResponse.json({ data: [] });
      }
      const placeholders = idList.map(() => '?').join(',');
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT b.id, b.kode_buku, b.judul, b.pengarang, b.isbn, r.kode_rak, r.nama as rak_nama, kb.nama as kategori_nama
         FROM buku b
         LEFT JOIN rak r ON b.rak_id = r.id
         LEFT JOIN kategori_buku kb ON b.kategori_id = kb.id
         WHERE b.id IN (${placeholders})
         ORDER BY b.judul`,
        idList
      );
      return NextResponse.json({ data: rows });
    }

    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (search) {
      where += ' AND (b.judul LIKE ? OR b.kode_buku LIKE ? OR b.isbn LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (kategori) {
      where += ' AND b.kategori_id = ?';
      params.push(kategori);
    }

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT b.id, b.kode_buku, b.judul, b.pengarang, b.isbn, r.kode_rak, r.nama as rak_nama, kb.nama as kategori_nama
       FROM buku b
       LEFT JOIN rak r ON b.rak_id = r.id
       LEFT JOIN kategori_buku kb ON b.kategori_id = kb.id
       ${where}
       ORDER BY b.judul`,
      params
    );

    const [kategoriList] = await db.query<RowDataPacket[]>('SELECT id, nama FROM kategori_buku ORDER BY nama');

    return NextResponse.json({ data: rows, filters: { kategoriList } });
  }, ['admin', 'perpus', 'kepala_sekolah']);
}
