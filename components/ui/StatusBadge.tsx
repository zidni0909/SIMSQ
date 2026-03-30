interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'dot';
}

const statusColors: Record<string, string> = {
  // General
  baik: 'bg-green-100 text-green-700',
  tersedia: 'bg-green-100 text-green-700',
  dikembalikan: 'bg-green-100 text-green-700',
  selesai: 'bg-green-100 text-green-700',
  active: 'bg-green-100 text-green-700',

  // Warning
  rusak_ringan: 'bg-yellow-100 text-yellow-700',
  dipinjam: 'bg-blue-100 text-blue-700',
  dalam_perawatan: 'bg-yellow-100 text-yellow-700',
  dalam_proses: 'bg-yellow-100 text-yellow-700',
  terlambat: 'bg-red-100 text-red-700',

  // Danger
  rusak_berat: 'bg-red-100 text-red-700',
  hilang: 'bg-red-100 text-red-700',
  dihapuskan: 'bg-secondary-100 text-secondary-700',
  perlu_tindak_lanjut: 'bg-orange-100 text-orange-700',
  inactive: 'bg-secondary-100 text-secondary-600',
};

const statusLabels: Record<string, string> = {
  baik: 'Baik',
  rusak_ringan: 'Rusak Ringan',
  rusak_berat: 'Rusak Berat',
  hilang: 'Hilang',
  tersedia: 'Tersedia',
  dipinjam: 'Dipinjam',
  dalam_perawatan: 'Dalam Perawatan',
  dihapuskan: 'Dihapuskan',
  dikembalikan: 'Dikembalikan',
  terlambat: 'Terlambat',
  selesai: 'Selesai',
  dalam_proses: 'Dalam Proses',
  perlu_tindak_lanjut: 'Perlu Tindak Lanjut',
  rutin: 'Rutin',
  perbaikan: 'Perbaikan',
  penggantian_komponen: 'Penggantian Komponen',
  siswa: 'Siswa',
  guru: 'Guru',
  karyawan: 'Karyawan',
  admin: 'Admin',
  sarpras: 'Petugas Sarpras',
  perpus: 'Petugas Perpus',
  kepala_sekolah: 'Kepala Sekolah',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const color = statusColors[status] || 'bg-secondary-100 text-secondary-700';
  const label = statusLabels[status] || status.replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
