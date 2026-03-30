import { NextRequest, NextResponse } from 'next/server';
import { authProtectedEndpoint } from '@/lib/api-auth';
import { logAudit } from '@/lib/audit';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return authProtectedEndpoint(request, async () => {
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM anggota WHERE id = ?', [params.id]);
    if (!rows[0]) return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 });
    return NextResponse.json(rows[0]);
  }, ['admin', 'perpus', 'kepala_sekolah']);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return authProtectedEndpoint(request, async (req, token) => {
    const body = await req.json();
    const [old] = await db.query<RowDataPacket[]>('SELECT * FROM anggota WHERE id = ?', [params.id]);
    if (!old[0]) return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 });

    await db.query(
      `UPDATE anggota SET nama=?, jenis=?, kelas=?, no_hp=?, alamat=?, is_active=? WHERE id=?`,
      [body.nama, body.jenis, body.kelas || null, body.no_hp || null, body.alamat || null, body.is_active ?? true, params.id]
    );

    await logAudit(token.id, 'UPDATE', 'anggota', params.id, old[0], body);
    return NextResponse.json({ message: 'Anggota berhasil diupdate' });
  }, ['admin', 'perpus']);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return authProtectedEndpoint(request, async (req, token) => {
    const [old] = await db.query<RowDataPacket[]>('SELECT * FROM anggota WHERE id = ?', [params.id]);
    if (!old[0]) return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 });
    await db.query('DELETE FROM anggota WHERE id = ?', [params.id]);
    await logAudit(token.id, 'DELETE', 'anggota', params.id, old[0], null);
    return NextResponse.json({ message: 'Anggota berhasil dihapus' });
  }, ['admin']);
}
