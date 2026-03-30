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
import { formatCurrency } from '@/lib/utils/format';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function BarangPage() {
  const [data, setData] = useState<{ data: any[]; total: number; page: number; totalPages: number; filters: any }>({ data: [], total: 0, page: 1, totalPages: 1, filters: {} });
  const [search, setSearch] = useState('');
  const [kategori, setKategori] = useState('');
  const [kondisi, setKondisi] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '10', search, kategori, kondisi });
    const res = await fetch(`/api/sarpras/barang?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [page, search, kategori, kondisi]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleDelete(id: number) {
    if (!confirm('Yakin ingin menghapus barang ini?')) return;
    const res = await fetch(`/api/sarpras/barang/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast('success', 'Barang berhasil dihapus');
      fetchData();
    } else {
      const err = await res.json();
      toast('error', err.error || 'Gagal menghapus');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Data Barang</h1>
        <Link href="/admin/sarpras/barang/create">
          <Button><Plus size={16} className="mr-2" /> Tambah Barang</Button>
        </Link>
      </div>

      <Card className="p-5">
        <div className="mb-4">
          <SearchFilter
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Cari nama, kode, merk..."
            filters={[
              {
                label: 'Semua Kategori',
                value: kategori,
                onChange: (v) => { setKategori(v); setPage(1); },
                options: (data.filters?.kategoriList || []).map((k: any) => ({ value: String(k.id), label: k.nama })),
              },
              {
                label: 'Semua Kondisi',
                value: kondisi,
                onChange: (v) => { setKondisi(v); setPage(1); },
                options: [
                  { value: 'baik', label: 'Baik' },
                  { value: 'rusak_ringan', label: 'Rusak Ringan' },
                  { value: 'rusak_berat', label: 'Rusak Berat' },
                  { value: 'hilang', label: 'Hilang' },
                ],
              },
            ]}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : data.data.length === 0 ? (
          <EmptyState description="Belum ada data barang." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-secondary-200">
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Kode</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Nama Barang</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Kategori</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Lokasi</th>
                    <th className="text-right py-3 px-4 font-medium text-secondary-500">Jumlah</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Kondisi</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-secondary-500">Harga</th>
                    <th className="text-center py-3 px-4 font-medium text-secondary-500">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((item: any) => (
                    <tr key={item.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                      <td className="py-3 px-4 font-mono text-xs">{item.kode_barang}</td>
                      <td className="py-3 px-4 font-medium">{item.nama}</td>
                      <td className="py-3 px-4 text-secondary-600">{item.kategori_nama || '-'}</td>
                      <td className="py-3 px-4 text-secondary-600">{item.lokasi_nama || '-'}</td>
                      <td className="py-3 px-4 text-right">{item.jumlah}</td>
                      <td className="py-3 px-4"><StatusBadge status={item.kondisi} /></td>
                      <td className="py-3 px-4"><StatusBadge status={item.status} /></td>
                      <td className="py-3 px-4 text-right">{formatCurrency(item.harga_perolehan)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={`/admin/sarpras/barang/${item.id}/edit`}>
                            <button className="p-1.5 rounded hover:bg-secondary-100"><Pencil size={14} /></button>
                          </Link>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-secondary-500">Total: {data.total} barang</p>
              <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
