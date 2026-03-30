import { NextRequest, NextResponse } from 'next/server';
import { authProtectedEndpoint } from '@/lib/api-auth';
import { logAudit } from '@/lib/audit';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return authProtectedEndpoint(request, async () => {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT pb.*, b.judul as buku_judul, b.kode_buku as buku_kode, a.nama as anggota_nama, a.kode_anggota as anggota_kode, u.nama as petugas_nama
       FROM peminjaman_buku pb
       LEFT JOIN buku b ON pb.buku_id = b.id LEFT JOIN anggota a ON pb.anggota_id = a.id LEFT JOIN users u ON pb.petugas_id = u.id
       WHERE pb.id = ?`,
      [params.id]
    );
    if (!rows[0]) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    return NextResponse.json(rows[0]);
  }, ['admin', 'perpus', 'kepala_sekolah']);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return authProtectedEndpoint(request, async (req, token) => {
    const body = await req.json();
    const [old] = await db.query<RowDataPacket[]>('SELECT * FROM peminjaman_buku WHERE id = ?', [params.id]);
    if (!old[0]) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });

    // Return book
    if (body.status === 'dikembalikan' && old[0].status !== 'dikembalikan') {
      const tanggalKembali = new Date();
      const tanggalRencana = new Date(old[0].tanggal_kembali_rencana);
      let denda = 0;

      if (tanggalKembali > tanggalRencana) {
        const diffDays = Math.ceil((tanggalKembali.getTime() - tanggalRencana.getTime()) / (1000 * 60 * 60 * 24));
        const [[settings]] = await db.query<RowDataPacket[]>("SELECT value FROM settings WHERE `key` = 'denda_per_hari'");
        const dendaPerHari = parseInt(settings?.value || '1000');
        denda = diffDays * dendaPerHari;
      }

      await db.query(
        'UPDATE peminjaman_buku SET status = "dikembalikan", tanggal_dikembalikan = CURDATE(), denda = ? WHERE id = ?',
        [denda, params.id]
      );

      // Increment stok
      await db.query('UPDATE buku SET stok_tersedia = stok_tersedia + 1 WHERE id = ?', [old[0].buku_id]);

      await logAudit(token.id, 'UPDATE', 'peminjaman_buku', params.id, old[0], { status: 'dikembalikan', denda });
      return NextResponse.json({ message: 'Buku berhasil dikembalikan', denda });
    }

    // Update other fields
    await db.query(
      'UPDATE peminjaman_buku SET tanggal_kembali_rencana=?, catatan=? WHERE id=?',
      [body.tanggal_kembali_rencana || old[0].tanggal_kembali_rencana, body.catatan || null, params.id]
    );

    await logAudit(token.id, 'UPDATE', 'peminjaman_buku', params.id, old[0], body);
    return NextResponse.json({ message: 'Data berhasil diupdate' });
  }, ['admin', 'perpus']);
}
