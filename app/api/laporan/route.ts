import { NextRequest, NextResponse } from 'next/server';
import { authProtectedEndpoint } from '@/lib/api-auth';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  return authProtectedEndpoint(request, async () => {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'sarpras';
    const startDate = searchParams.get('start_date') || '';
    const endDate = searchParams.get('end_date') || '';

    if (type === 'sarpras') {
      let where = '';
      const params: string[] = [];
      if (startDate && endDate) {
        where = 'WHERE b.created_at BETWEEN ? AND ?';
        params.push(startDate, endDate + ' 23:59:59');
      }

      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT b.kode_barang, b.nama, kb.nama as kategori, l.nama as lokasi, b.merk,
                b.tahun_pengadaan, b.harga_perolehan, b.jumlah, b.kondisi, b.status
         FROM barang b
         LEFT JOIN kategori_barang kb ON b.kategori_id = kb.id
         LEFT JOIN lokasi l ON b.lokasi_id = l.id
         ${where}
         ORDER BY b.nama`,
        params
      );

      // Summary
      const [[summary]] = await db.query<RowDataPacket[]>(
        `SELECT COUNT(*) as total_barang,
                SUM(jumlah) as total_unit,
                SUM(harga_perolehan * jumlah) as total_nilai,
                SUM(CASE WHEN kondisi = 'baik' THEN 1 ELSE 0 END) as baik,
                SUM(CASE WHEN kondisi = 'rusak_ringan' THEN 1 ELSE 0 END) as rusak_ringan,
                SUM(CASE WHEN kondisi = 'rusak_berat' THEN 1 ELSE 0 END) as rusak_berat
         FROM barang b ${where}`,
        params
      );

      return NextResponse.json({ data: rows, summary, type: 'sarpras' });
    }

    if (type === 'perpustakaan') {
      let where = '';
      const params: string[] = [];
      if (startDate && endDate) {
        where = 'WHERE b.created_at BETWEEN ? AND ?';
        params.push(startDate, endDate + ' 23:59:59');
      }

      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT b.kode_buku, b.judul, b.pengarang, b.penerbit, b.isbn, b.tahun_terbit,
                kb.nama as kategori, r.kode_rak, b.stok, b.stok_tersedia
         FROM buku b
         LEFT JOIN kategori_buku kb ON b.kategori_id = kb.id
         LEFT JOIN rak r ON b.rak_id = r.id
         ${where}
         ORDER BY b.judul`,
        params
      );

      const [[summary]] = await db.query<RowDataPacket[]>(
        `SELECT COUNT(*) as total_judul,
                SUM(stok) as total_eksemplar,
                SUM(stok - stok_tersedia) as sedang_dipinjam,
                SUM(CASE WHEN stok_tersedia <= stok_minimum THEN 1 ELSE 0 END) as stok_rendah
         FROM buku b ${where}`,
        params
      );

      return NextResponse.json({ data: rows, summary, type: 'perpustakaan' });
    }

    if (type === 'peminjaman_barang') {
      let where = 'WHERE 1=1';
      const params: string[] = [];
      if (startDate && endDate) {
        where += ' AND pb.tanggal_pinjam BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }

      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT pb.kode_peminjaman, b.nama as barang_nama, pb.peminjam, pb.jabatan,
                pb.tanggal_pinjam, pb.tanggal_kembali_rencana, pb.tanggal_kembali_aktual,
                pb.jumlah_pinjam, pb.status
         FROM peminjaman_barang pb
         LEFT JOIN barang b ON pb.barang_id = b.id
         ${where}
         ORDER BY pb.tanggal_pinjam DESC`,
        params
      );

      return NextResponse.json({ data: rows, type: 'peminjaman_barang' });
    }

    if (type === 'peminjaman_buku') {
      let where = 'WHERE 1=1';
      const params: string[] = [];
      if (startDate && endDate) {
        where += ' AND pb.tanggal_pinjam BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }

      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT pb.kode_transaksi, bk.judul as buku_judul, a.nama as anggota_nama,
                pb.tanggal_pinjam, pb.tanggal_kembali_rencana, pb.tanggal_dikembalikan,
                pb.status, pb.denda
         FROM peminjaman_buku pb
         LEFT JOIN buku bk ON pb.buku_id = bk.id
         LEFT JOIN anggota a ON pb.anggota_id = a.id
         ${where}
         ORDER BY pb.tanggal_pinjam DESC`,
        params
      );

      const [[summary]] = await db.query<RowDataPacket[]>(
        `SELECT COUNT(*) as total_transaksi,
                SUM(CASE WHEN pb.status = 'dipinjam' THEN 1 ELSE 0 END) as sedang_dipinjam,
                SUM(CASE WHEN pb.status = 'terlambat' THEN 1 ELSE 0 END) as terlambat,
                SUM(pb.denda) as total_denda
         FROM peminjaman_buku pb ${where}`,
        params
      );

      return NextResponse.json({ data: rows, summary, type: 'peminjaman_buku' });
    }

    return NextResponse.json({ error: 'Type tidak valid' }, { status: 400 });
  }, ['admin', 'kepala_sekolah']);
}
