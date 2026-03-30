import { NextRequest, NextResponse } from 'next/server';
import { authProtectedEndpoint } from '@/lib/api-auth';
import { logAudit } from '@/lib/audit';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return authProtectedEndpoint(request, async () => {
    const [[user]] = await db.query<RowDataPacket[]>(
      'SELECT id, nama, email, role, is_active, last_login, created_at, updated_at FROM users WHERE id = ?',
      [params.id]
    );
    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json(user);
  }, ['admin']);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return authProtectedEndpoint(request, async (req, token) => {
    const body = await req.json();

    const [[oldUser]] = await db.query<RowDataPacket[]>(
      'SELECT id, nama, email, role, is_active FROM users WHERE id = ?',
      [params.id]
    );
    if (!oldUser) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Check duplicate email (exclude current user)
    if (body.email && body.email !== oldUser.email) {
      const [[existing]] = await db.query<RowDataPacket[]>(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [body.email, params.id]
      );
      if (existing) {
        return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 400 });
      }
    }

    let query = 'UPDATE users SET nama = ?, email = ?, role = ?, is_active = ?';
    const queryParams: (string | number | boolean)[] = [
      body.nama, body.email, body.role, body.is_active !== false,
    ];

    // Only update password if provided
    if (body.password) {
      query += ', password = ?';
      queryParams.push(await bcrypt.hash(body.password, 12));
    }

    query += ' WHERE id = ?';
    queryParams.push(params.id);

    await db.query(query, queryParams);

    await logAudit(token.id, 'UPDATE', 'users', params.id, oldUser, { nama: body.nama, email: body.email, role: body.role });

    return NextResponse.json({ message: 'User berhasil diperbarui' });
  }, ['admin']);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return authProtectedEndpoint(request, async (req, token) => {
    // Prevent self-deletion
    if (String(token.id) === params.id) {
      return NextResponse.json({ error: 'Tidak dapat menghapus akun sendiri' }, { status: 400 });
    }

    const [[user]] = await db.query<RowDataPacket[]>(
      'SELECT id, nama, email, role FROM users WHERE id = ?',
      [params.id]
    );
    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    await db.query('DELETE FROM users WHERE id = ?', [params.id]);
    await logAudit(token.id, 'DELETE', 'users', params.id, user, null);

    return NextResponse.json({ message: 'User berhasil dihapus' });
  }, ['admin']);
}
