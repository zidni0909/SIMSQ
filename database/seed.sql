USE simsq;

-- Default admin user (password: admin123)
INSERT INTO users (nama, email, password, role) VALUES
('Administrator', 'admin@sekolahsq.com', '$2a$10$8KxX5xKx5xKx5xKx5xKx5eAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'admin'),
('Petugas Sarpras', 'sarpras@sekolahsq.com', '$2a$10$8KxX5xKx5xKx5xKx5xKx5eAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'sarpras'),
('Petugas Perpustakaan', 'perpus@sekolahsq.com', '$2a$10$8KxX5xKx5xKx5xKx5xKx5eAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'perpus'),
('Kepala Sekolah', 'kepsek@sekolahsq.com', '$2a$10$8KxX5xKx5xKx5xKx5xKx5eAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'kepala_sekolah');

-- Settings
INSERT INTO settings (`key`, value) VALUES
('nama_sekolah', 'SekolahSQ'),
('alamat_sekolah', 'Jl. Pendidikan No. 1'),
('telepon_sekolah', '021-1234567'),
('email_sekolah', 'info@sekolahsq.com'),
('denda_per_hari', '1000'),
('max_pinjam_buku', '3'),
('max_hari_pinjam_buku', '7'),
('max_pinjam_barang', '2'),
('max_hari_pinjam_barang', '3'),
('kepala_sekolah', ''),
('nip_kepala_sekolah', '');

-- Kategori Barang
INSERT INTO kategori_barang (nama, keterangan) VALUES
('Elektronik', 'Peralatan elektronik seperti komputer, proyektor, dll'),
('Mebeler', 'Meja, kursi, lemari, dll'),
('Alat Olahraga', 'Peralatan olahraga'),
('Alat Laboratorium', 'Peralatan laboratorium IPA/Komputer'),
('Alat Kebersihan', 'Peralatan kebersihan');

-- Lokasi
INSERT INTO lokasi (nama, keterangan) VALUES
('Ruang Kepala Sekolah', NULL),
('Ruang Guru', NULL),
('Ruang Kelas 1A', NULL),
('Ruang Kelas 1B', NULL),
('Laboratorium IPA', NULL),
('Laboratorium Komputer', NULL),
('Perpustakaan', NULL),
('Gudang', NULL),
('Aula', NULL);

-- Kategori Buku
INSERT INTO kategori_buku (nama, keterangan) VALUES
('Fiksi', 'Novel, cerpen, puisi'),
('Non-Fiksi', 'Buku pengetahuan umum'),
('Pelajaran', 'Buku teks pelajaran'),
('Referensi', 'Kamus, ensiklopedia'),
('Agama', 'Buku keagamaan'),
('Sejarah', 'Buku sejarah');

-- Rak
INSERT INTO rak (kode_rak, nama, lokasi, kapasitas) VALUES
('R-01', 'Rak Fiksi', 'Lantai 1 Kiri', 100),
('R-02', 'Rak Non-Fiksi', 'Lantai 1 Kanan', 100),
('R-03', 'Rak Pelajaran', 'Lantai 2 Kiri', 150),
('R-04', 'Rak Referensi', 'Lantai 2 Kanan', 80),
('R-05', 'Rak Agama', 'Lantai 1 Tengah', 80);

-- Sample Barang
INSERT INTO barang (kode_barang, nama, kategori_id, lokasi_id, merk, tahun_pengadaan, harga_perolehan, jumlah, kondisi) VALUES
('BRG-202501-0001', 'Proyektor Epson', 1, 9, 'Epson', 2024, 8500000, 2, 'baik'),
('BRG-202501-0002', 'Laptop Lenovo', 1, 6, 'Lenovo', 2024, 12000000, 10, 'baik'),
('BRG-202501-0003', 'Meja Guru', 2, 2, 'Olympic', 2023, 1500000, 5, 'baik'),
('BRG-202501-0004', 'Kursi Siswa', 2, 3, 'Chitose', 2023, 350000, 40, 'baik'),
('BRG-202501-0005', 'Mikroskop', 4, 5, 'Olympus', 2022, 5000000, 3, 'rusak_ringan');

-- Sample Buku
INSERT INTO buku (kode_buku, judul, pengarang, penerbit, isbn, tahun_terbit, kategori_id, rak_id, stok, stok_tersedia) VALUES
('BKU-202501-0001', 'Laskar Pelangi', 'Andrea Hirata', 'Bentang Pustaka', '9789793062792', 2005, 1, 1, 5, 5),
('BKU-202501-0002', 'Matematika Kelas X', 'Tim Kemendikbud', 'Kemendikbud', '9786024270001', 2022, 3, 3, 20, 20),
('BKU-202501-0003', 'Bahasa Indonesia Kelas XI', 'Tim Kemendikbud', 'Kemendikbud', '9786024270002', 2022, 3, 3, 15, 15),
('BKU-202501-0004', 'Kamus Besar Bahasa Indonesia', 'Tim Penyusun', 'Balai Pustaka', '9789794072776', 2018, 4, 4, 3, 3),
('BKU-202501-0005', 'Bumi Manusia', 'Pramoedya Ananta Toer', 'Hasta Mitra', '9799731232', 1980, 1, 1, 4, 4);

-- Sample Anggota
INSERT INTO anggota (kode_anggota, nama, jenis, kelas, no_hp, tanggal_daftar) VALUES
('AGT-0001', 'Ahmad Rizki', 'siswa', 'X-IPA-1', '081234567890', '2025-01-10'),
('AGT-0002', 'Siti Nurhaliza', 'siswa', 'X-IPA-2', '081234567891', '2025-01-10'),
('AGT-0003', 'Budi Santoso', 'guru', NULL, '081234567892', '2025-01-05'),
('AGT-0004', 'Dewi Lestari', 'siswa', 'XI-IPS-1', '081234567893', '2025-01-12'),
('AGT-0005', 'Pak Rahman', 'karyawan', NULL, '081234567894', '2025-01-05');
