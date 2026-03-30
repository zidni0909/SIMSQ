'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SearchFilter from '@/components/ui/SearchFilter';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { toast } from '@/components/ui/Toast';
import { formatCurrency, formatDateShort } from '@/lib/utils/format';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function PerawatanBarangPage() {
  const [data, setData] = useState<any>({ data: [], total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '10', search });
    const res = await fetch(`/api/sarpras/perawatan?${params}`);
    setData(await res.json());
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleDelete(id: number) {
    if (!confirm('Yakin ingin menghapus data perawatan ini?')) return;
    const res = await fetch(`/api/sarpras/perawatan/${id}`, { method: 'DELETE' });
    if (res.ok) { toast('success', 'Data berhasil dihapus'); fetchData(); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Perawatan Barang</h1>
        <Link href="/admin/sarpras/perawatan/create">
          <Button><Plus size={16} className="mr-2" /> Tambah Perawatan</Button>
        </Link>
      </div>

      <Card className="p-5">
        <div className="mb-4">
          <SearchFilter search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} placeholder="Cari barang, teknisi..." />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
        ) : data.data.length === 0 ? (
          <EmptyState description="Belum ada data perawatan." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-secondary-200">
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Barang</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Tanggal</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Jenis</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Teknisi</th>
                    <th className="text-right py-3 px-4 font-medium text-secondary-500">Biaya</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Hasil</th>
                    <th className="text-center py-3 px-4 font-medium text-secondary-500">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((item: any) => (
                    <tr key={item.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                      <td className="py-3 px-4">{item.barang_nama}</td>
                      <td className="py-3 px-4">{formatDateShort(item.tanggal_perawatan)}</td>
                      <td className="py-3 px-4"><StatusBadge status={item.jenis_perawatan} /></td>
                      <td className="py-3 px-4">{item.teknisi || '-'}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(item.biaya)}</td>
                      <td className="py-3 px-4"><StatusBadge status={item.hasil} /></td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={`/admin/sarpras/perawatan/${item.id}/edit`}>
                            <button className="p-1.5 rounded hover:bg-secondary-100"><Pencil size={14} /></button>
                          </Link>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-secondary-500">Total: {data.total}</p>
              <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
