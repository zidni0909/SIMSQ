import { NextRequest, NextResponse } from 'next/server';
import { authProtectedEndpoint } from '@/lib/api-auth';
import { logAudit } from '@/lib/audit';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return authProtectedEndpoint(request, async () => {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT b.*, kb.nama as kategori_nama, r.nama as rak_nama, r.kode_rak as rak_kode
       FROM buku b LEFT JOIN kategori_buku kb ON b.kategori_id = kb.id LEFT JOIN rak r ON b.rak_id = r.id WHERE b.id = ?`,
      [params.id]
    );
    if (!rows[0]) return NextResponse.json({ error: 'Buku tidak ditemukan' }, { status: 404 });
    return NextResponse.json(rows[0]);
  }, ['admin', 'perpus', 'kepala_sekolah']);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return authProtectedEndpoint(request, async (req, token) => {
    const body = await req.json();
    const [old] = await db.query<RowDataPacket[]>('SELECT * FROM buku WHERE id = ?', [params.id]);
    if (!old[0]) return NextResponse.json({ error: 'Buku tidak ditemukan' }, { status: 404 });

    const stokDiff = (body.stok || old[0].stok) - old[0].stok;
    const newStokTersedia = old[0].stok_tersedia + stokDiff;

    await db.query(
      `UPDATE buku SET judul=?, pengarang=?, penerbit=?, isbn=?, tahun_terbit=?, kategori_id=?, rak_id=?, stok=?, stok_tersedia=?, stok_minimum=?, bahasa=?, halaman=?, keterangan=? WHERE id=?`,
      [body.judul, body.pengarang || null, body.penerbit || null, body.isbn || null, body.tahun_terbit || null, body.kategori_id || null, body.rak_id || null, body.stok || 1, newStokTersedia, body.stok_minimum || 1, body.bahasa || 'Indonesia', body.halaman || null, body.keterangan || null, params.id]
    );

    await logAudit(token.id, 'UPDATE', 'buku', params.id, old[0], body);
    return NextResponse.json({ message: 'Buku berhasil diupdate' });
  }, ['admin', 'perpus']);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return authProtectedEndpoint(request, async (req, token) => {
    const [old] = await db.query<RowDataPacket[]>('SELECT * FROM buku WHERE id = ?', [params.id]);
    if (!old[0]) return NextResponse.json({ error: 'Buku tidak ditemukan' }, { status: 404 });
    await db.query('DELETE FROM buku WHERE id = ?', [params.id]);
    await logAudit(token.id, 'DELETE', 'buku', params.id, old[0], null);
    return NextResponse.json({ message: 'Buku berhasil dihapus' });
  }, ['admin']);
}
