-- ============================================
-- Sistem Informasi Manajemen SekolahSQ
-- Database Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS simsq CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE simsq;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'sarpras', 'perpus', 'kepala_sekolah') NOT NULL DEFAULT 'sarpras',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Settings (key-value)
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT') NOT NULL,
  table_name VARCHAR(100),
  record_id INT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('keterlambatan_buku', 'keterlambatan_barang', 'stok_minimum', 'perawatan_jadwal') NOT NULL,
  is_read BOOLEAN DEFAULT false,
  reference_id INT,
  reference_table VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============ SARPRAS MODULE ============

-- Kategori Barang
CREATE TABLE IF NOT EXISTS kategori_barang (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lokasi / Ruangan
CREATE TABLE IF NOT EXISTS lokasi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Barang (Inventaris)
CREATE TABLE IF NOT EXISTS barang (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kode_barang VARCHAR(50) UNIQUE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  kategori_id INT,
  lokasi_id INT,
  merk VARCHAR(255),
  tahun_pengadaan YEAR,
  sumber_dana VARCHAR(255),
  harga_perolehan DECIMAL(15,2) DEFAULT 0,
  jumlah INT DEFAULT 1,
  kondisi ENUM('baik', 'rusak_ringan', 'rusak_berat', 'hilang') DEFAULT 'baik',
  status ENUM('tersedia', 'dipinjam', 'dalam_perawatan', 'dihapuskan') DEFAULT 'tersedia',
  foto_url VARCHAR(500),
  penanggung_jawab VARCHAR(255),
  jabatan_pj VARCHAR(255),
  kontak_pj VARCHAR(100),
  keterangan TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (kategori_id) REFERENCES kategori_barang(id) ON DELETE SET NULL,
  FOREIGN KEY (lokasi_id) REFERENCES lokasi(id) ON DELETE SET NULL
);

-- Peminjaman Barang
CREATE TABLE IF NOT EXISTS peminjaman_barang (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kode_peminjaman VARCHAR(50) UNIQUE NOT NULL,
  barang_id INT NOT NULL,
  peminjam VARCHAR(255) NOT NULL,
  jabatan VARCHAR(255),
  keperluan TEXT,
  jumlah_pinjam INT DEFAULT 1,
  tanggal_pinjam DATE NOT NULL,
  tanggal_kembali_rencana DATE NOT NULL,
  tanggal_kembali_aktual DATE,
  status ENUM('dipinjam', 'dikembalikan', 'terlambat') DEFAULT 'dipinjam',
  catatan TEXT,
  petugas_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (barang_id) REFERENCES barang(id) ON DELETE RESTRICT,
  FOREIGN KEY (petugas_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Perawatan Barang
CREATE TABLE IF NOT EXISTS perawatan_barang (
  id INT AUTO_INCREMENT PRIMARY KEY,
  barang_id INT NOT NULL,
  tanggal_perawatan DATE NOT NULL,
  jenis_perawatan ENUM('rutin', 'perbaikan', 'penggantian_komponen') NOT NULL,
  deskripsi TEXT,
  biaya DECIMAL(15,2) DEFAULT 0,
  teknisi VARCHAR(255),
  hasil ENUM('selesai', 'dalam_proses', 'perlu_tindak_lanjut') DEFAULT 'selesai',
  catatan TEXT,
  petugas_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (barang_id) REFERENCES barang(id) ON DELETE RESTRICT,
  FOREIGN KEY (petugas_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============ PERPUSTAKAAN MODULE ============

-- Kategori Buku
CREATE TABLE IF NOT EXISTS kategori_buku (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rak
CREATE TABLE IF NOT EXISTS rak (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kode_rak VARCHAR(50) UNIQUE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  lokasi VARCHAR(255),
  kapasitas INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buku
CREATE TABLE IF NOT EXISTS buku (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kode_buku VARCHAR(50) UNIQUE NOT NULL,
  judul VARCHAR(500) NOT NULL,
  pengarang VARCHAR(255),
  penerbit VARCHAR(255),
  isbn VARCHAR(20),
  tahun_terbit YEAR,
  kategori_id INT,
  rak_id INT,
  stok INT DEFAULT 1,
  stok_tersedia INT DEFAULT 1,
  stok_minimum INT DEFAULT 1,
  bahasa VARCHAR(50) DEFAULT 'Indonesia',
  halaman INT,
  foto_url VARCHAR(500),
  keterangan TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (kategori_id) REFERENCES kategori_buku(id) ON DELETE SET NULL,
  FOREIGN KEY (rak_id) REFERENCES rak(id) ON DELETE SET NULL
);

-- Anggota Perpustakaan
CREATE TABLE IF NOT EXISTS anggota (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kode_anggota VARCHAR(50) UNIQUE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  jenis ENUM('siswa', 'guru', 'karyawan') NOT NULL,
  kelas VARCHAR(50),
  no_hp VARCHAR(20),
  alamat TEXT,
  is_active BOOLEAN DEFAULT true,
  tanggal_daftar DATE NOT NULL,
  foto_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Peminjaman Buku
CREATE TABLE IF NOT EXISTS peminjaman_buku (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kode_transaksi VARCHAR(50) UNIQUE NOT NULL,
  buku_id INT NOT NULL,
  anggota_id INT NOT NULL,
  tanggal_pinjam DATE NOT NULL,
  tanggal_kembali_rencana DATE NOT NULL,
  tanggal_dikembalikan DATE,
  status ENUM('dipinjam', 'dikembalikan', 'terlambat', 'hilang') DEFAULT 'dipinjam',
  denda DECIMAL(15,2) DEFAULT 0,
  catatan TEXT,
  petugas_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (buku_id) REFERENCES buku(id) ON DELETE RESTRICT,
  FOREIGN KEY (anggota_id) REFERENCES anggota(id) ON DELETE RESTRICT,
  FOREIGN KEY (petugas_id) REFERENCES users(id) ON DELETE SET NULL
);
