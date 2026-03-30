'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import {
  Package,
  BookOpen,
  BookCopy,
  Wrench,
  AlertTriangle,
  Clock,
  Home,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface DashboardData {
  stats: {
    totalAset: number;
    totalBuku: number;
    barangDipinjam: number;
    bukuDipinjam: number;
    barangRusak: number;
    bukuTerlambat: number;
  };
  charts: {
    peminjamanBulanan: { bulan: string; tipe: string; jumlah: number }[];
    kondisiBarang: { kondisi: string; jumlah: number }[];
    kategoriBuku: { kategori: string; jumlah: number }[];
  };
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const kondisiLabels: Record<string, string> = {
  baik: 'Baik',
  rusak_ringan: 'Rusak Ringan',
  rusak_berat: 'Rusak Berat',
  hilang: 'Hilang',
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard-stats')
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!data) return null;

  const statCards = [
    { label: 'Total Aset Sarpras', value: data.stats.totalAset, icon: <Package size={24} />, color: 'bg-primary-100 text-primary-600' },
    { label: 'Total Buku', value: data.stats.totalBuku, icon: <BookOpen size={24} />, color: 'bg-accent-100 text-accent-600' },
    { label: 'Barang Dipinjam', value: data.stats.barangDipinjam, icon: <BookCopy size={24} />, color: 'bg-blue-100 text-blue-600' },
    { label: 'Buku Dipinjam', value: data.stats.bukuDipinjam, icon: <BookCopy size={24} />, color: 'bg-cyan-100 text-cyan-600' },
    { label: 'Barang Rusak', value: data.stats.barangRusak, icon: <Wrench size={24} />, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Buku Terlambat', value: data.stats.bukuTerlambat, icon: <Clock size={24} />, color: 'bg-red-100 text-red-600' },
  ];

  // Process chart data - monthly borrowings
  const monthlyMap = new Map<string, { bulan: string; barang: number; buku: number }>();
  data.charts.peminjamanBulanan.forEach((item) => {
    const existing = monthlyMap.get(item.bulan) || { bulan: item.bulan, barang: 0, buku: 0 };
    if (item.tipe === 'barang') existing.barang = item.jumlah;
    else existing.buku = item.jumlah;
    monthlyMap.set(item.bulan, existing);
  });
  const monthlyData = Array.from(monthlyMap.values());

  const kondisiData = data.charts.kondisiBarang.map((item) => ({
    name: kondisiLabels[item.kondisi] || item.kondisi,
    value: item.jumlah,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
        <Link href="/admin/portal" className="flex items-center gap-2 px-3 py-2 text-sm text-secondary-600 hover:bg-secondary-100 rounded-lg">
          <Home size={16} /> Portal
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.label} className="p-5">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>{stat.icon}</div>
              <div>
                <p className="text-sm text-secondary-500">{stat.label}</p>
                <p className="text-2xl font-bold text-secondary-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peminjaman per Bulan */}
        <Card className="p-5">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Peminjaman per Bulan</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="bulan" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="barang" name="Barang" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="buku" name="Buku" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Kondisi Barang */}
        <Card className="p-5">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Kondisi Barang</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={kondisiData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label>
                {kondisiData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Kategori Buku */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Buku per Kategori</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.charts.kategoriBuku} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis type="number" fontSize={12} />
              <YAxis dataKey="kategori" type="category" fontSize={12} width={100} />
              <Tooltip />
              <Bar dataKey="jumlah" name="Jumlah Buku" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
