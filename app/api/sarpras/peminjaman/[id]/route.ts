import { NextRequest, NextResponse } from 'next/server';
import { authProtectedEndpoint } from '@/lib/api-auth';
import { logAudit } from '@/lib/audit';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return authProtectedEndpoint(request, async () => {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT pb.*, b.nama as barang_nama, b.kode_barang as barang_kode, u.nama as petugas_nama
       FROM peminjaman_barang pb
       LEFT JOIN barang b ON pb.barang_id = b.id
       LEFT JOIN users u ON pb.petugas_id = u.id
       WHERE pb.id = ?`,
      [params.id]
    );

    if (!rows[0]) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  }, ['admin', 'sarpras', 'kepala_sekolah']);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return authProtectedEndpoint(request, async (req, token) => {
    const body = await req.json();

    const [old] = await db.query<RowDataPacket[]>('SELECT * FROM peminjaman_barang WHERE id = ?', [params.id]);
    if (!old[0]) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    }

    // If returning item
    if (body.status === 'dikembalikan' && old[0].status !== 'dikembalikan') {
      await db.query(
        'UPDATE peminjaman_barang SET status = "dikembalikan", tanggal_kembali_aktual = CURDATE() WHERE id = ?',
        [params.id]
      );
      await db.query('UPDATE barang SET status = "tersedia" WHERE id = ?', [old[0].barang_id]);
    } else {
      await db.query(
        'UPDATE peminjaman_barang SET peminjam=?, jabatan=?, keperluan=?, tanggal_kembali_rencana=?, catatan=? WHERE id=?',
        [body.peminjam, body.jabatan || null, body.keperluan || null, body.tanggal_kembali_rencana, body.catatan || null, params.id]
      );
    }

    await logAudit(token.id, 'UPDATE', 'peminjaman_barang', params.id, old[0], body);

    return NextResponse.json({ message: 'Data berhasil diupdate' });
  }, ['admin', 'sarpras']);
}
