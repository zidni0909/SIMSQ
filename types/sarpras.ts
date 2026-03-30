export interface KategoriBarang {
  id: number;
  nama: string;
  keterangan: string | null;
  created_at: string;
}

export interface Lokasi {
  id: number;
  nama: string;
  keterangan: string | null;
  created_at: string;
}

export interface Barang {
  id: number;
  kode_barang: string;
  nama: string;
  kategori_id: number | null;
  lokasi_id: number | null;
  merk: string | null;
  tahun_pengadaan: number | null;
  sumber_dana: string | null;
  harga_perolehan: number;
  jumlah: number;
  kondisi: 'baik' | 'rusak_ringan' | 'rusak_berat' | 'hilang';
  status: 'tersedia' | 'dipinjam' | 'dalam_perawatan' | 'dihapuskan';
  foto_url: string | null;
  keterangan: string | null;
  created_at: string;
  updated_at: string;
  kategori_nama?: string;
  lokasi_nama?: string;
}

export interface PeminjamanBarang {
  id: number;
  kode_peminjaman: string;
  barang_id: number;
  peminjam: string;
  jabatan: string | null;
  keperluan: string | null;
  jumlah_pinjam: number;
  tanggal_pinjam: string;
  tanggal_kembali_rencana: string;
  tanggal_kembali_aktual: string | null;
  status: 'dipinjam' | 'dikembalikan' | 'terlambat';
  catatan: string | null;
  petugas_id: number | null;
  created_at: string;
  updated_at: string;
  barang_nama?: string;
  barang_kode?: string;
  petugas_nama?: string;
}

export interface PerawatanBarang {
  id: number;
  barang_id: number;
  tanggal_perawatan: string;
  jenis_perawatan: 'rutin' | 'perbaikan' | 'penggantian_komponen';
  deskripsi: string | null;
  biaya: number;
  teknisi: string | null;
  hasil: 'selesai' | 'dalam_proses' | 'perlu_tindak_lanjut';
  catatan: string | null;
  petugas_id: number | null;
  created_at: string;
  barang_nama?: string;
  barang_kode?: string;
  petugas_nama?: string;
}
