import { NextRequest, NextResponse } from 'next/server';
import { authProtectedEndpoint } from '@/lib/api-auth';
import { logAudit } from '@/lib/audit';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return authProtectedEndpoint(request, async () => {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT b.*, kb.nama as kategori_nama, l.nama as lokasi_nama
       FROM barang b
       LEFT JOIN kategori_barang kb ON b.kategori_id = kb.id
       LEFT JOIN lokasi l ON b.lokasi_id = l.id
       WHERE b.id = ?`,
      [params.id]
    );

    if (!rows[0]) {
      return NextResponse.json({ error: 'Barang tidak ditemukan' }, { status: 404 });
    }

    // Fetch riwayat peminjaman & perawatan
    const [peminjaman] = await db.query<RowDataPacket[]>(
      `SELECT pb.*, u.nama as petugas_nama FROM peminjaman_barang pb
       LEFT JOIN users u ON pb.petugas_id = u.id
       WHERE pb.barang_id = ? ORDER BY pb.created_at DESC LIMIT 10`,
      [params.id]
    );
    const [perawatan] = await db.query<RowDataPacket[]>(
      `SELECT pw.*, u.nama as petugas_nama FROM perawatan_barang pw
       LEFT JOIN users u ON pw.petugas_id = u.id
       WHERE pw.barang_id = ? ORDER BY pw.created_at DESC LIMIT 10`,
      [params.id]
    );

    return NextResponse.json({ ...rows[0], peminjaman, perawatan });
  }, ['admin', 'sarpras', 'kepala_sekolah']);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return authProtectedEndpoint(request, async (req, token) => {
    const body = await req.json();

    const [old] = await db.query<RowDataPacket[]>('SELECT * FROM barang WHERE id = ?', [params.id]);
    if (!old[0]) {
      return NextResponse.json({ error: 'Barang tidak ditemukan' }, { status: 404 });
    }

    await db.query(
      `UPDATE barang SET nama=?, kategori_id=?, lokasi_id=?, merk=?, tahun_pengadaan=?, sumber_dana=?, harga_perolehan=?, jumlah=?, kondisi=?, status=?, foto_url=?, penanggung_jawab=?, jabatan_pj=?, kontak_pj=?, keterangan=? WHERE id=?`,
      [body.nama, body.kategori_id || null, body.lokasi_id || null, body.merk || null, body.tahun_pengadaan || null, body.sumber_dana || null, body.harga_perolehan || 0, body.jumlah || 1, body.kondisi, body.status, body.foto_url || null, body.penanggung_jawab || null, body.jabatan_pj || null, body.kontak_pj || null, body.keterangan || null, params.id]
    );

    await logAudit(token.id, 'UPDATE', 'barang', params.id, old[0], body);

    return NextResponse.json({ message: 'Barang berhasil diupdate' });
  }, ['admin', 'sarpras']);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return authProtectedEndpoint(request, async (req, token) => {
    const [old] = await db.query<RowDataPacket[]>('SELECT * FROM barang WHERE id = ?', [params.id]);
    if (!old[0]) {
      return NextResponse.json({ error: 'Barang tidak ditemukan' }, { status: 404 });
    }

    await db.query('DELETE FROM barang WHERE id = ?', [params.id]);
    await logAudit(token.id, 'DELETE', 'barang', params.id, old[0], null);

    return NextResponse.json({ message: 'Barang berhasil dihapus' });
  }, ['admin']);
}
