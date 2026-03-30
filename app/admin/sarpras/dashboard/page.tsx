'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import { Package, BookCopy, Wrench, AlertTriangle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280'];
const kondisiLabels: Record<string, string> = {
  baik: 'Baik', rusak_ringan: 'Rusak Ringan', rusak_berat: 'Rusak Berat', hilang: 'Hilang',
};

export default function DashboardSarprasPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard-stats')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>;
  if (!data) return null;

  const stats = [
    { label: 'Total Aset', value: data.stats.totalAset, icon: <Package size={24} />, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Sedang Dipinjam', value: data.stats.barangDipinjam, icon: <BookCopy size={24} />, color: 'bg-blue-100 text-blue-600' },
    { label: 'Barang Rusak', value: data.stats.barangRusak, icon: <Wrench size={24} />, color: 'bg-yellow-100 text-yellow-600' },
  ];

  const monthlyData = data.charts.peminjamanBulanan
    .filter((i: any) => i.tipe === 'barang')
    .map((i: any) => ({ bulan: i.bulan, jumlah: i.jumlah }));

  const kondisiData = data.charts.kondisiBarang.map((i: any) => ({
    name: kondisiLabels[i.kondisi] || i.kondisi, value: i.jumlah,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary-900 mb-6">Dashboard Sarpras</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map(s => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-sm text-secondary-500">{s.label}</p>
                <p className="text-2xl font-bold text-secondary-900">{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Peminjaman Barang per Bulan</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="bulan" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="jumlah" name="Peminjaman" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Kondisi Barang</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={kondisiData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label>
                {kondisiData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
