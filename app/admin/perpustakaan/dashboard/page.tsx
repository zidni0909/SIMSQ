'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import { BookOpen, BookCopy, Clock, Users } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function DashboardPerpusPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard-stats')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" /></div>;
  if (!data) return null;

  const stats = [
    { label: 'Total Buku', value: data.stats.totalBuku, icon: <BookOpen size={24} />, color: 'bg-purple-100 text-purple-600' },
    { label: 'Sedang Dipinjam', value: data.stats.bukuDipinjam, icon: <BookCopy size={24} />, color: 'bg-blue-100 text-blue-600' },
    { label: 'Terlambat', value: data.stats.bukuTerlambat, icon: <Clock size={24} />, color: 'bg-red-100 text-red-600' },
  ];

  const monthlyData = data.charts.peminjamanBulanan
    .filter((i: any) => i.tipe === 'buku')
    .map((i: any) => ({ bulan: i.bulan, jumlah: i.jumlah }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary-900 mb-6">Dashboard Perpustakaan</h1>

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
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Peminjaman Buku per Bulan</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="bulan" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="jumlah" name="Peminjaman" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Buku per Kategori</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.charts.kategoriBuku} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis type="number" fontSize={12} />
              <YAxis dataKey="kategori" type="category" fontSize={12} width={100} />
              <Tooltip />
              <Bar dataKey="jumlah" name="Jumlah" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
