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
    const kategori = searchParams.get('kategori') || '';
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (search) {
      where += ' AND (b.judul LIKE ? OR b.kode_buku LIKE ? OR b.pengarang LIKE ? OR b.isbn LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (kategori) {
      where += ' AND b.kategori_id = ?';
      params.push(kategori);
    }

    const [[{ total }]] = await db.query<RowDataPacket[]>(`SELECT COUNT(*) as total FROM buku b ${where}`, params);

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT b.*, kb.nama as kategori_nama, r.nama as rak_nama, r.kode_rak as rak_kode
       FROM buku b
       LEFT JOIN kategori_buku kb ON b.kategori_id = kb.id
       LEFT JOIN rak r ON b.rak_id = r.id
       ${where} ORDER BY b.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [kategoriList] = await db.query<RowDataPacket[]>('SELECT id, nama FROM kategori_buku ORDER BY nama');
    const [rakList] = await db.query<RowDataPacket[]>('SELECT id, kode_rak, nama FROM rak ORDER BY kode_rak');

    return NextResponse.json({ data: rows, total, page, limit, totalPages: Math.ceil(total / limit), filters: { kategoriList, rakList } });
  }, ['admin', 'perpus', 'kepala_sekolah']);
}

export async function POST(request: NextRequest) {
  return authProtectedEndpoint(request, async (req, token) => {
    const body = await req.json();

    const [[{ maxId }]] = await db.query<RowDataPacket[]>('SELECT COALESCE(MAX(id), 0) + 1 as maxId FROM buku');
    const now = new Date();
    const kode = `BKU-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(maxId).padStart(4, '0')}`;

    const [result] = await db.query(
      `INSERT INTO buku (kode_buku, judul, pengarang, penerbit, isbn, tahun_terbit, kategori_id, rak_id, stok, stok_tersedia, stok_minimum, bahasa, halaman, keterangan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [kode, body.judul, body.pengarang || null, body.penerbit || null, body.isbn || null, body.tahun_terbit || null, body.kategori_id || null, body.rak_id || null, body.stok || 1, body.stok || 1, body.stok_minimum || 1, body.bahasa || 'Indonesia', body.halaman || null, body.keterangan || null]
    );

    await logAudit(token.id, 'CREATE', 'buku', (result as { insertId: number }).insertId, null, body);

    return NextResponse.json({ message: 'Buku berhasil ditambahkan', kode_buku: kode }, { status: 201 });
  }, ['admin', 'perpus']);
}
