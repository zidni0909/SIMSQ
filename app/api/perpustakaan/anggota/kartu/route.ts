import { NextRequest, NextResponse } from 'next/server';
import { authProtectedEndpoint } from '@/lib/api-auth';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  return authProtectedEndpoint(request, async () => {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');
    const search = searchParams.get('search') || '';
    const jenis = searchParams.get('jenis') || '';

    let where = 'WHERE is_active = 1';
    const params: string[] = [];

    if (ids) {
      const idArr = ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      if (idArr.length === 0) return NextResponse.json({ data: [] });
      where += ` AND id IN (${idArr.map(() => '?').join(',')})`;
      params.push(...idArr.map(String));
    } else {
      if (search) {
        where += ' AND (nama LIKE ? OR kode_anggota LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
      if (jenis) {
        where += ' AND jenis = ?';
        params.push(jenis);
      }
    }

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id, kode_anggota, nama, jenis, kelas, foto_url FROM anggota ${where} ORDER BY nama ASC`,
      params
    );

    return NextResponse.json({ data: rows });
  }, ['admin', 'perpus']);
}
