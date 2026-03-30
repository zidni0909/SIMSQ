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
    const params: (string | number)[] = [];

    if (search) {
      where += ' AND (b.nama LIKE ? OR pr.teknisi LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [[{ total }]] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM perawatan_barang pr LEFT JOIN barang b ON pr.barang_id = b.id ${where}`,
      params
    );

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT pr.*, b.nama as barang_nama, b.kode_barang as barang_kode, u.nama as petugas_nama
       FROM perawatan_barang pr
       LEFT JOIN barang b ON pr.barang_id = b.id
       LEFT JOIN users u ON pr.petugas_id = u.id
       ${where}
       ORDER BY pr.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json({ data: rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  }, ['admin', 'sarpras', 'kepala_sekolah']);
}

export async function POST(request: NextRequest) {
  return authProtectedEndpoint(request, async (req, token) => {
    const body = await req.json();

    const [result] = await db.query(
      `INSERT INTO perawatan_barang (barang_id, tanggal_perawatan, jenis_perawatan, deskripsi, biaya, teknisi, hasil, catatan, petugas_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [body.barang_id, body.tanggal_perawatan, body.jenis_perawatan, body.deskripsi || null, body.biaya || 0, body.teknisi || null, body.hasil || 'selesai', body.catatan || null, token.id]
    );

    if (body.hasil === 'dalam_proses') {
      await db.query('UPDATE barang SET status = "dalam_perawatan" WHERE id = ?', [body.barang_id]);
    }

    await logAudit(token.id, 'CREATE', 'perawatan_barang', (result as { insertId: number }).insertId, null, body);

    return NextResponse.json({ message: 'Data perawatan berhasil ditambahkan' }, { status: 201 });
  }, ['admin', 'sarpras']);
}
