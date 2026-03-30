import { NextRequest, NextResponse } from 'next/server';
import { authProtectedEndpoint } from '@/lib/api-auth';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  return authProtectedEndpoint(request, async (req, token) => {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Password wajib diisi' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
    }

    const [users] = await db.query<RowDataPacket[]>('SELECT password FROM users WHERE id = ?', [token.id]);
    if (!users[0]) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, users[0].password);
    if (!valid) {
      return NextResponse.json({ error: 'Password saat ini salah' }, { status: 400 });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hash, token.id]);

    return NextResponse.json({ message: 'Password berhasil diubah' });
  });
}
