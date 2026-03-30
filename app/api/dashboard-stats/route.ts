import { NextRequest, NextResponse } from 'next/server';
import { authProtectedEndpoint } from '@/lib/api-auth';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  return authProtectedEndpoint(request, async () => {
    // Stats
    const [[totalAset]] = await db.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM barang WHERE status != "dihapuskan"');
    const [[totalBuku]] = await db.query<RowDataPacket[]>('SELECT COALESCE(SUM(stok), 0) as count FROM buku');
    const [[barangDipinjam]] = await db.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM peminjaman_barang WHERE status = "dipinjam"');
    const [[bukuDipinjam]] = await db.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM peminjaman_buku WHERE status = "dipinjam"');
    const [[barangRusak]] = await db.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM barang WHERE kondisi IN ("rusak_ringan", "rusak_berat")');
    const [[bukuTerlambat]] = await db.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM peminjaman_buku WHERE status = "dipinjam" AND tanggal_kembali_rencana < CURDATE()');

    // Chart: Peminjaman per bulan (6 bulan terakhir)
    const [peminjamanBulanan] = await db.query<RowDataPacket[]>(`
      SELECT
        DATE_FORMAT(tanggal_pinjam, '%Y-%m') as bulan,
        'barang' as tipe,
        COUNT(*) as jumlah
      FROM peminjaman_barang
      WHERE tanggal_pinjam >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(tanggal_pinjam, '%Y-%m')
      UNION ALL
      SELECT
        DATE_FORMAT(tanggal_pinjam, '%Y-%m') as bulan,
        'buku' as tipe,
        COUNT(*) as jumlah
      FROM peminjaman_buku
      WHERE tanggal_pinjam >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(tanggal_pinjam, '%Y-%m')
      ORDER BY bulan
    `);

    // Chart: Kondisi barang
    const [kondisiBarang] = await db.query<RowDataPacket[]>(`
      SELECT kondisi, COUNT(*) as jumlah FROM barang WHERE status != 'dihapuskan' GROUP BY kondisi
    `);

    // Chart: Kategori buku
    const [kategoriBuku] = await db.query<RowDataPacket[]>(`
      SELECT kb.nama as kategori, COUNT(b.id) as jumlah
      FROM kategori_buku kb
      LEFT JOIN buku b ON b.kategori_id = kb.id
      GROUP BY kb.id, kb.nama
      ORDER BY jumlah DESC
      LIMIT 6
    `);

    return NextResponse.json({
      stats: {
        totalAset: totalAset.count,
        totalBuku: totalBuku.count,
        barangDipinjam: barangDipinjam.count,
        bukuDipinjam: bukuDipinjam.count,
        barangRusak: barangRusak.count,
        bukuTerlambat: bukuTerlambat.count,
      },
      charts: {
        peminjamanBulanan,
        kondisiBarang,
        kategoriBuku,
      },
    });
  });
}
