import { NextRequest, NextResponse } from 'next/server';
import { authProtectedEndpoint } from '@/lib/api-auth';
import { logAudit } from '@/lib/audit';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  return authProtectedEndpoint(request, async () => {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT `key`, value FROM settings ORDER BY `key`'
    );
    // Convert to key-value object
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return NextResponse.json(settings);
  }, ['admin']);
}

export async function PUT(request: NextRequest) {
  return authProtectedEndpoint(request, async (req, token) => {
    const body = await req.json();

    // Get old settings
    const [oldRows] = await db.query<RowDataPacket[]>('SELECT `key`, value FROM settings');
    const oldSettings: Record<string, string> = {};
    for (const row of oldRows) {
      oldSettings[row.key] = row.value;
    }

    // Upsert each setting
    for (const [key, value] of Object.entries(body)) {
      await db.query(
        'INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
        [key, String(value), String(value)]
      );
    }

    await logAudit(token.id, 'UPDATE', 'settings', null, oldSettings, body);

    return NextResponse.json({ message: 'Settings berhasil disimpan' });
  }, ['admin']);
}
