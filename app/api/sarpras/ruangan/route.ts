import { NextRequest, NextResponse } from 'next/server';
import { authProtectedEndpoint } from '@/lib/api-auth';
import { logAudit } from '@/lib/audit';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  return authProtectedEndpoint(request, async () => {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params: string[] = [];

    if (search) {
      where += ' AND (l.nama LIKE ? OR l.keterangan LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [[{ total }]] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM lokasi l ${where}`, params
    );

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT l.*, (SELECT COUNT(*) FROM barang WHERE lokasi_id = l.id) as jumlah_barang
       FROM lokasi l ${where} ORDER BY l.nama ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json({ data: rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  }, ['admin', 'sarpras', 'kepala_sekolah']);
}

export async function POST(request: NextRequest) {
  return authProtectedEndpoint(request, async (req, token) => {
    const body = await req.json();
    if (!body.nama) return NextResponse.json({ error: 'Nama ruangan wajib diisi' }, { status: 400 });

    const [result] = await db.query(
      'INSERT INTO lokasi (nama, keterangan) VALUES (?, ?)',
      [body.nama, body.keterangan || null]
    );

    await logAudit(token.id, 'CREATE', 'lokasi', (result as any).insertId, null, body);
    return NextResponse.json({ message: 'Ruangan berhasil ditambahkan' }, { status: 201 });
  }, ['admin', 'sarpras']);
}
