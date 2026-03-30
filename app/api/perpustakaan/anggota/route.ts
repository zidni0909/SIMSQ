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
    const jenis = searchParams.get('jenis') || '';
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (search) {
      where += ' AND (nama LIKE ? OR kode_anggota LIKE ? OR kelas LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (jenis) { where += ' AND jenis = ?'; params.push(jenis); }

    const [[{ total }]] = await db.query<RowDataPacket[]>(`SELECT COUNT(*) as total FROM anggota ${where}`, params);
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT * FROM anggota ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json({ data: rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  }, ['admin', 'perpus', 'kepala_sekolah']);
}

export async function POST(request: NextRequest) {
  return authProtectedEndpoint(request, async (req, token) => {
    const body = await req.json();

    const [[{ maxId }]] = await db.query<RowDataPacket[]>('SELECT COALESCE(MAX(id), 0) + 1 as maxId FROM anggota');
    const kode = `AGT-${String(maxId).padStart(4, '0')}`;

    const [result] = await db.query(
      `INSERT INTO anggota (kode_anggota, nama, jenis, kelas, no_hp, alamat, tanggal_daftar)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [kode, body.nama, body.jenis, body.kelas || null, body.no_hp || null, body.alamat || null, body.tanggal_daftar || new Date().toISOString().split('T')[0]]
    );

    await logAudit(token.id, 'CREATE', 'anggota', (result as { insertId: number }).insertId, null, body);
    return NextResponse.json({ message: 'Anggota berhasil ditambahkan', kode_anggota: kode }, { status: 201 });
  }, ['admin', 'perpus']);
}
