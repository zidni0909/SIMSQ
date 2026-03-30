import { NextRequest, NextResponse } from 'next/server';
import { authProtectedEndpoint } from '@/lib/api-auth';
import { logAudit } from '@/lib/audit';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  return authProtectedEndpoint(request, async () => {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (search) {
      where += ' AND (nama LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (role) {
      where += ' AND role = ?';
      params.push(role);
    }

    const [[{ total }]] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM users ${where}`,
      params
    );

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id, nama, email, role, is_active, last_login, created_at, updated_at
       FROM users ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      data: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  }, ['admin']);
}

export async function POST(request: NextRequest) {
  return authProtectedEndpoint(request, async (req, token) => {
    const body = await req.json();

    // Check duplicate email
    const [[existing]] = await db.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?',
      [body.email]
    );
    if (existing) {
      return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(body.password, 12);

    const [result] = await db.query(
      `INSERT INTO users (nama, email, password, role, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [body.nama, body.email, hashedPassword, body.role, body.is_active !== false]
    );

    await logAudit(token.id, 'CREATE', 'users', (result as { insertId: number }).insertId, null, { nama: body.nama, email: body.email, role: body.role });

    return NextResponse.json({ message: 'User berhasil ditambahkan' }, { status: 201 });
  }, ['admin']);
}
