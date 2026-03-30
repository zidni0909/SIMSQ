import { NextRequest, NextResponse } from 'next/server';
import { authProtectedEndpoint } from '@/lib/api-auth';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// Auto-calculate denda for all overdue book loans
export async function POST(request: NextRequest) {
  return authProtectedEndpoint(request, async (_req, token) => {
    // Get denda_per_hari from settings
    const [[settings]] = await db.query<RowDataPacket[]>(
      "SELECT value FROM settings WHERE `key` = 'denda_per_hari'"
    );
    const dendaPerHari = parseInt(settings?.value || '1000');

    const today = new Date().toISOString().split('T')[0];

    // Find overdue loans that are still 'dipinjam'
    const [overdueLoans] = await db.query<RowDataPacket[]>(
      `SELECT pb.id, pb.kode_transaksi, pb.anggota_id, pb.tanggal_kembali_rencana,
              DATEDIFF(?, pb.tanggal_kembali_rencana) as hari_terlambat,
              a.nama as anggota_nama, b.judul as buku_judul
       FROM peminjaman_buku pb
       LEFT JOIN anggota a ON pb.anggota_id = a.id
       LEFT JOIN buku b ON pb.buku_id = b.id
       WHERE pb.status = 'dipinjam' AND pb.tanggal_kembali_rencana < ?`,
      [today, today]
    );

    let updated = 0;
    const notifications: string[] = [];

    for (const loan of overdueLoans) {
      const denda = loan.hari_terlambat * dendaPerHari;

      // Update status to 'terlambat' and set denda
      await db.query(
        `UPDATE peminjaman_buku SET status = 'terlambat', denda = ? WHERE id = ?`,
        [denda, loan.id]
      );

      // Create notification
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_table)
         VALUES (NULL, ?, ?, 'keterlambatan_buku', ?, 'peminjaman_buku')
         ON DUPLICATE KEY UPDATE message = VALUES(message)`,
        [
          `Keterlambatan: ${loan.kode_transaksi}`,
          `${loan.anggota_nama} terlambat mengembalikan "${loan.buku_judul}" selama ${loan.hari_terlambat} hari. Denda: Rp ${denda.toLocaleString('id-ID')}`,
          loan.id,
        ]
      );

      notifications.push(loan.kode_transaksi);
      updated++;
    }

    // Also check for low stock books
    const [lowStockBooks] = await db.query<RowDataPacket[]>(
      `SELECT id, kode_buku, judul, stok_tersedia, stok_minimum
       FROM buku WHERE stok_tersedia <= stok_minimum AND stok_tersedia > 0`
    );

    for (const book of lowStockBooks) {
      await db.query(
        `INSERT IGNORE INTO notifications (user_id, title, message, type, reference_id, reference_table)
         VALUES (NULL, ?, ?, 'stok_minimum', ?, 'buku')`,
        [
          `Stok Rendah: ${book.kode_buku}`,
          `Buku "${book.judul}" tersisa ${book.stok_tersedia} eksemplar (minimum: ${book.stok_minimum})`,
          book.id,
        ]
      );
    }

    // Check overdue barang loans
    const [overdueBarang] = await db.query<RowDataPacket[]>(
      `SELECT pb.id, pb.kode_peminjaman, pb.peminjam, pb.tanggal_kembali_rencana,
              DATEDIFF(?, pb.tanggal_kembali_rencana) as hari_terlambat,
              b.nama as barang_nama
       FROM peminjaman_barang pb
       LEFT JOIN barang b ON pb.barang_id = b.id
       WHERE pb.status = 'dipinjam' AND pb.tanggal_kembali_rencana < ?`,
      [today, today]
    );

    for (const loan of overdueBarang) {
      await db.query(
        `UPDATE peminjaman_barang SET status = 'terlambat' WHERE id = ?`,
        [loan.id]
      );

      await db.query(
        `INSERT IGNORE INTO notifications (user_id, title, message, type, reference_id, reference_table)
         VALUES (NULL, ?, ?, 'keterlambatan_barang', ?, 'peminjaman_barang')`,
        [
          `Keterlambatan Barang: ${loan.kode_peminjaman}`,
          `${loan.peminjam} terlambat mengembalikan "${loan.barang_nama}" selama ${loan.hari_terlambat} hari`,
          loan.id,
        ]
      );
    }

    return NextResponse.json({
      message: `Berhasil memproses ${updated} peminjaman buku terlambat, ${overdueBarang.length} peminjaman barang terlambat`,
      updated_buku: updated,
      updated_barang: overdueBarang.length,
      low_stock_books: lowStockBooks.length,
    });
  }, ['admin', 'perpus', 'sarpras']);
}
