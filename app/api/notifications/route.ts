import { NextRequest, NextResponse } from 'next/server';
import { authProtectedEndpoint } from '@/lib/api-auth';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  return authProtectedEndpoint(request, async (_req, token) => {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT * FROM notifications
       WHERE user_id = ? OR user_id IS NULL
       ORDER BY created_at DESC
       LIMIT 50`,
      [token.id]
    );

    const [[{ unread }]] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as unread FROM notifications
       WHERE (user_id = ? OR user_id IS NULL) AND is_read = false`,
      [token.id]
    );

    return NextResponse.json({ data: rows, unread });
  });
}

export async function PUT(request: NextRequest) {
  return authProtectedEndpoint(request, async (req, token) => {
    const body = await req.json();

    if (body.mark_all_read) {
      await db.query(
        'UPDATE notifications SET is_read = true WHERE user_id = ? OR user_id IS NULL',
        [token.id]
      );
    } else if (body.id) {
      await db.query('UPDATE notifications SET is_read = true WHERE id = ?', [body.id]);
    }

    return NextResponse.json({ message: 'OK' });
  });
}
