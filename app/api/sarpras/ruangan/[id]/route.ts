import { NextRequest, NextResponse } from 'next/server';
import { authProtectedEndpoint } from '@/lib/api-auth';
import { logAudit } from '@/lib/audit';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return authProtectedEndpoint(request, async (req, token) => {
    const body = await req.json();
    const [old] = await db.query<RowDataPacket[]>('SELECT * FROM lokasi WHERE id = ?', [params.id]);
    if (!old[0]) return NextResponse.json({ error: 'Ruangan tidak ditemukan' }, { status: 404 });

    await db.query('UPDATE lokasi SET nama=?, keterangan=? WHERE id=?', [body.nama, body.keterangan || null, params.id]);
    await logAudit(token.id, 'UPDATE', 'lokasi', params.id, old[0], body);
    return NextResponse.json({ message: 'Ruangan berhasil diupdate' });
  }, ['admin', 'sarpras']);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return authProtectedEndpoint(request, async (req, token) => {
    const [old] = await db.query<RowDataPacket[]>('SELECT * FROM lokasi WHERE id = ?', [params.id]);
    if (!old[0]) return NextResponse.json({ error: 'Ruangan tidak ditemukan' }, { status: 404 });

    // Check if any barang uses this lokasi
    const [[{ count }]] = await db.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM barang WHERE lokasi_id = ?', [params.id]);
    if (count > 0) return NextResponse.json({ error: `Tidak bisa dihapus, ${count} barang menggunakan ruangan ini` }, { status: 400 });

    await db.query('DELETE FROM lokasi WHERE id = ?', [params.id]);
    await logAudit(token.id, 'DELETE', 'lokasi', params.id, old[0], null);
    return NextResponse.json({ message: 'Ruangan berhasil dihapus' });
  }, ['admin']);
}
