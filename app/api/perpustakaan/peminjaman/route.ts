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
      where += ' AND (pb.kode_transaksi LIKE ? OR b.judul LIKE ? OR a.nama LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) { where += ' AND pb.status = ?'; params.push(status); }

    const [[{ total }]] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM peminjaman_buku pb LEFT JOIN buku b ON pb.buku_id = b.id LEFT JOIN anggota a ON pb.anggota_id = a.id ${where}`, params
    );

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT pb.*, b.judul as buku_judul, b.kode_buku as buku_kode, a.nama as anggota_nama, a.kode_anggota as anggota_kode, u.nama as petugas_nama
       FROM peminjaman_buku pb
       LEFT JOIN buku b ON pb.buku_id = b.id
       LEFT JOIN anggota a ON pb.anggota_id = a.id
       LEFT JOIN users u ON pb.petugas_id = u.id
       ${where} ORDER BY pb.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json({ data: rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  }, ['admin', 'perpus', 'kepala_sekolah']);
}

export async function POST(request: NextRequest) {
  return authProtectedEndpoint(request, async (req, token) => {
    const body = await req.json();

    // Check stok
    const [[buku]] = await db.query<RowDataPacket[]>('SELECT stok_tersedia FROM buku WHERE id = ?', [body.buku_id]);
    if (!buku || buku.stok_tersedia <= 0) {
      return NextResponse.json({ error: 'Stok buku tidak tersedia' }, { status: 400 });
    }

    // Check max pinjam
    const [[settings]] = await db.query<RowDataPacket[]>("SELECT value FROM settings WHERE `key` = 'max_pinjam_buku'");
    const maxPinjam = parseInt(settings?.value || '3');
    const [[{ activePinjam }]] = await db.query<RowDataPacket[]>(
      'SELECT COUNT(*) as activePinjam FROM peminjaman_buku WHERE anggota_id = ? AND status = "dipinjam"',
      [body.anggota_id]
    );
    if (activePinjam >= maxPinjam) {
      return NextResponse.json({ error: `Anggota sudah mencapai batas maksimal peminjaman (${maxPinjam} buku)` }, { status: 400 });
    }

    const [[{ maxId }]] = await db.query<RowDataPacket[]>('SELECT COALESCE(MAX(id), 0) + 1 as maxId FROM peminjaman_buku');
    const now = new Date();
    const kode = `PJK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(maxId).padStart(4, '0')}`;

    await db.query(
      `INSERT INTO peminjaman_buku (kode_transaksi, buku_id, anggota_id, tanggal_pinjam, tanggal_kembali_rencana, status, petugas_id)
       VALUES (?, ?, ?, ?, ?, 'dipinjam', ?)`,
      [kode, body.buku_id, body.anggota_id, body.tanggal_pinjam, body.tanggal_kembali_rencana, token.id]
    );

    // Decrement stok
    await db.query('UPDATE buku SET stok_tersedia = stok_tersedia - 1 WHERE id = ?', [body.buku_id]);

    await logAudit(token.id, 'CREATE', 'peminjaman_buku', maxId, null, body);
    return NextResponse.json({ message: 'Peminjaman buku berhasil', kode_transaksi: kode }, { status: 201 });
  }, ['admin', 'perpus']);
}
