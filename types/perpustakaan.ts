export interface KategoriBuku {
  id: number;
  nama: string;
  keterangan: string | null;
  created_at: string;
}

export interface Rak {
  id: number;
  kode_rak: string;
  nama: string;
  lokasi: string | null;
  kapasitas: number;
  created_at: string;
}

export interface Buku {
  id: number;
  kode_buku: string;
  judul: string;
  pengarang: string | null;
  penerbit: string | null;
  isbn: string | null;
  tahun_terbit: number | null;
  kategori_id: number | null;
  rak_id: number | null;
  stok: number;
  stok_tersedia: number;
  stok_minimum: number;
  bahasa: string;
  halaman: number | null;
  foto_url: string | null;
  keterangan: string | null;
  created_at: string;
  updated_at: string;
  kategori_nama?: string;
  rak_nama?: string;
  rak_kode?: string;
}

export interface Anggota {
  id: number;
  kode_anggota: string;
  nama: string;
  jenis: 'siswa' | 'guru' | 'karyawan';
  kelas: string | null;
  no_hp: string | null;
  alamat: string | null;
  is_active: boolean;
  tanggal_daftar: string;
  foto_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PeminjamanBuku {
  id: number;
  kode_transaksi: string;
  buku_id: number;
  anggota_id: number;
  tanggal_pinjam: string;
  tanggal_kembali_rencana: string;
  tanggal_dikembalikan: string | null;
  status: 'dipinjam' | 'dikembalikan' | 'terlambat' | 'hilang';
  denda: number;
  catatan: string | null;
  petugas_id: number | null;
  created_at: string;
  updated_at: string;
  buku_judul?: string;
  buku_kode?: string;
  anggota_nama?: string;
  anggota_kode?: string;
  petugas_nama?: string;
}
