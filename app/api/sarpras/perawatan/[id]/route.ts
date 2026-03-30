import { NextRequest, NextResponse } from 'next/server';
import { authProtectedEndpoint } from '@/lib/api-auth';
import { logAudit } from '@/lib/audit';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return authProtectedEndpoint(request, async () => {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT pr.*, b.nama as barang_nama, b.kode_barang as barang_kode
       FROM perawatan_barang pr
       LEFT JOIN barang b ON pr.barang_id = b.id
       WHERE pr.id = ?`,
      [params.id]
    );

    if (!rows[0]) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    return NextResponse.json(rows[0]);
  }, ['admin', 'sarpras', 'kepala_sekolah']);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return authProtectedEndpoint(request, async (req, token) => {
    const body = await req.json();

    const [old] = await db.query<RowDataPacket[]>('SELECT * FROM perawatan_barang WHERE id = ?', [params.id]);
    if (!old[0]) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });

    await db.query(
      `UPDATE perawatan_barang SET tanggal_perawatan=?, jenis_perawatan=?, deskripsi=?, biaya=?, teknisi=?, hasil=?, catatan=? WHERE id=?`,
      [body.tanggal_perawatan, body.jenis_perawatan, body.deskripsi || null, body.biaya || 0, body.teknisi || null, body.hasil, body.catatan || null, params.id]
    );

    // Update barang status if maintenance is complete
    if (body.hasil === 'selesai' && old[0].hasil !== 'selesai') {
      await db.query('UPDATE barang SET status = "tersedia" WHERE id = ?', [old[0].barang_id]);
    }

    await logAudit(token.id, 'UPDATE', 'perawatan_barang', params.id, old[0], body);

    return NextResponse.json({ message: 'Data perawatan berhasil diupdate' });
  }, ['admin', 'sarpras']);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return authProtectedEndpoint(request, async (req, token) => {
    const [old] = await db.query<RowDataPacket[]>('SELECT * FROM perawatan_barang WHERE id = ?', [params.id]);
    if (!old[0]) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });

    await db.query('DELETE FROM perawatan_barang WHERE id = ?', [params.id]);
    await logAudit(token.id, 'DELETE', 'perawatan_barang', params.id, old[0], null);

    return NextResponse.json({ message: 'Data perawatan berhasil dihapus' });
  }, ['admin']);
}
