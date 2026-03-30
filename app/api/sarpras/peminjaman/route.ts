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
    const status = searchParams.get('status') || '';
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (search) {
      where += ' AND (pb.peminjam LIKE ? OR pb.kode_peminjaman LIKE ? OR b.nama LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) {
      where += ' AND pb.status = ?';
      params.push(status);
    }

    const [[{ total }]] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM peminjaman_barang pb LEFT JOIN barang b ON pb.barang_id = b.id ${where}`,
      params
    );

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT pb.*, b.nama as barang_nama, b.kode_barang as barang_kode, u.nama as petugas_nama
       FROM peminjaman_barang pb
       LEFT JOIN barang b ON pb.barang_id = b.id
       LEFT JOIN users u ON pb.petugas_id = u.id
       ${where}
       ORDER BY pb.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json({ data: rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  }, ['admin', 'sarpras', 'kepala_sekolah']);
}

export async function POST(request: NextRequest) {
  return authProtectedEndpoint(request, async (req, token) => {
    const body = await req.json();

    const [[{ maxId }]] = await db.query<RowDataPacket[]>(
      'SELECT COALESCE(MAX(id), 0) + 1 as maxId FROM peminjaman_barang'
    );
    const now = new Date();
    const kode = `PJB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(maxId).padStart(4, '0')}`;

    await db.query(
      `INSERT INTO peminjaman_barang (kode_peminjaman, barang_id, peminjam, jabatan, keperluan, jumlah_pinjam, tanggal_pinjam, tanggal_kembali_rencana, status, catatan, petugas_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'dipinjam', ?, ?)`,
      [kode, body.barang_id, body.peminjam, body.jabatan || null, body.keperluan || null, body.jumlah_pinjam || 1, body.tanggal_pinjam, body.tanggal_kembali_rencana, body.catatan || null, token.id]
    );

    // Update barang status
    await db.query('UPDATE barang SET status = "dipinjam" WHERE id = ?', [body.barang_id]);

    await logAudit(token.id, 'CREATE', 'peminjaman_barang', maxId, null, body);

    return NextResponse.json({ message: 'Peminjaman berhasil dibuat', kode_peminjaman: kode }, { status: 201 });
  }, ['admin', 'sarpras']);
}
