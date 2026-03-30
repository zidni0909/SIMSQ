import { NextRequest, NextResponse } from 'next/server';
import { authProtectedEndpoint } from '@/lib/api-auth';
import { logAudit } from '@/lib/audit';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

const EXPORT_TABLES = [
  'kategori_barang', 'lokasi', 'barang', 'peminjaman_barang', 'perawatan_barang',
  'kategori_buku', 'rak', 'buku', 'anggota', 'peminjaman_buku',
  'settings', 'users',
];

export async function GET(request: NextRequest) {
  return authProtectedEndpoint(request, async (req, token) => {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table') || 'all';
    const format = searchParams.get('format') || 'json';

    const tables = table === 'all' ? EXPORT_TABLES : [table];
    const data: Record<string, any[]> = {};

    for (const t of tables) {
      if (!EXPORT_TABLES.includes(t)) continue;
      const [rows] = await db.query<RowDataPacket[]>(`SELECT * FROM ${t}`);
      data[t] = rows;
    }

    if (format === 'json') {
      await logAudit(token.id, 'CREATE', undefined, null, null, { action: 'backup_export', tables, format });
      return NextResponse.json({ backup_date: new Date().toISOString(), data });
    }

    // CSV format (single table only)
    if (format === 'csv' && table !== 'all') {
      const rows = data[table] || [];
      if (rows.length === 0) return NextResponse.json({ error: 'Tidak ada data' }, { status: 404 });

      const headers = Object.keys(rows[0]);
      const csvLines = [
        headers.join(','),
        ...rows.map(row => headers.map(h => {
          const val = row[h];
          if (val === null) return '';
          const str = String(val);
          return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
        }).join(','))
      ];

      await logAudit(token.id, 'CREATE', undefined, null, null, { action: 'backup_export', tables: [table], format });
      return new NextResponse(csvLines.join('\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${table}_backup.csv"`,
        },
      });
    }

    return NextResponse.json({ error: 'Format tidak valid' }, { status: 400 });
  }, ['admin']);
}

export async function POST(request: NextRequest) {
  return authProtectedEndpoint(request, async (req, token) => {
    const body = await req.json();
    const { table, data: importData } = body;

    if (!table || !importData || !Array.isArray(importData) || importData.length === 0) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
    }

    if (!EXPORT_TABLES.includes(table) || table === 'users') {
      return NextResponse.json({ error: 'Tabel tidak valid untuk import' }, { status: 400 });
    }

    let imported = 0;
    for (const row of importData) {
      const keys = Object.keys(row).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at');
      const values = keys.map(k => row[k] ?? null);
      const placeholders = keys.map(() => '?').join(',');

      try {
        await db.query(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`, values);
        imported++;
      } catch {
        // Skip duplicates
      }
    }

    await logAudit(token.id, 'CREATE', table, null, null, { action: 'backup_import', table, count: imported });
    return NextResponse.json({ message: `${imported} dari ${importData.length} data berhasil diimport` });
  }, ['admin']);
}
