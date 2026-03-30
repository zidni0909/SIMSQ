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
    const kondisi = searchParams.get('kondisi') || '';
    const status = searchParams.get('status') || '';
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (search) {
      where += ' AND (b.nama LIKE ? OR b.kode_barang LIKE ? OR b.merk LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (kategori) {
      where += ' AND b.kategori_id = ?';
      params.push(kategori);
    }
    if (kondisi) {
      where += ' AND b.kondisi = ?';
      params.push(kondisi);
    }
    if (status) {
      where += ' AND b.status = ?';
      params.push(status);
    }

    const [[{ total }]] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM barang b ${where}`,
      params
    );

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT b.*, kb.nama as kategori_nama, l.nama as lokasi_nama
       FROM barang b
       LEFT JOIN kategori_barang kb ON b.kategori_id = kb.id
       LEFT JOIN lokasi l ON b.lokasi_id = l.id
       ${where}
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Also return kategori and lokasi for filters
    const [kategoriList] = await db.query<RowDataPacket[]>('SELECT id, nama FROM kategori_barang ORDER BY nama');
    const [lokasiList] = await db.query<RowDataPacket[]>('SELECT id, nama FROM lokasi ORDER BY nama');

    return NextResponse.json({
      data: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      filters: { kategoriList, lokasiList },
    });
  }, ['admin', 'sarpras', 'kepala_sekolah']);
}

export async function POST(request: NextRequest) {
  return authProtectedEndpoint(request, async (req, token) => {
    const body = await req.json();

    // Generate kode_barang
    const [[{ maxId }]] = await db.query<RowDataPacket[]>(
      'SELECT COALESCE(MAX(id), 0) + 1 as maxId FROM barang'
    );
    const now = new Date();
    const kode = `BRG-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(maxId).padStart(4, '0')}`;

    const [result] = await db.query(
      `INSERT INTO barang (kode_barang, nama, kategori_id, lokasi_id, merk, tahun_pengadaan, sumber_dana, harga_perolehan, jumlah, kondisi, foto_url, penanggung_jawab, jabatan_pj, kontak_pj, keterangan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [kode, body.nama, body.kategori_id || null, body.lokasi_id || null, body.merk || null, body.tahun_pengadaan || null, body.sumber_dana || null, body.harga_perolehan || 0, body.jumlah || 1, body.kondisi || 'baik', body.foto_url || null, body.penanggung_jawab || null, body.jabatan_pj || null, body.kontak_pj || null, body.keterangan || null]
    );

    await logAudit(token.id, 'CREATE', 'barang', (result as { insertId: number }).insertId, null, body);

    return NextResponse.json({ message: 'Barang berhasil ditambahkan', kode_barang: kode }, { status: 201 });
  }, ['admin', 'sarpras']);
}
