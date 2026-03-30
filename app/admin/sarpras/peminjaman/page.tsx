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
import { formatDateShort } from '@/lib/utils/format';
import { Plus, Pencil, CheckCircle } from 'lucide-react';

export default function PeminjamanBarangPage() {
  const [data, setData] = useState<any>({ data: [], total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '10', search, status });
    const res = await fetch(`/api/sarpras/peminjaman?${params}`);
    setData(await res.json());
    setLoading(false);
  }, [page, search, status]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleReturn(id: number) {
    if (!confirm('Konfirmasi pengembalian barang?')) return;
    const res = await fetch(`/api/sarpras/peminjaman/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'dikembalikan' }),
    });
    if (res.ok) {
      toast('success', 'Barang berhasil dikembalikan');
      fetchData();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Peminjaman Barang</h1>
        <Link href="/admin/sarpras/peminjaman/create">
          <Button><Plus size={16} className="mr-2" /> Tambah Peminjaman</Button>
        </Link>
      </div>

      <Card className="p-5">
        <div className="mb-4">
          <SearchFilter
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Cari peminjam, kode..."
            filters={[{
              label: 'Semua Status', value: status,
              onChange: (v) => { setStatus(v); setPage(1); },
              options: [{ value: 'dipinjam', label: 'Dipinjam' }, { value: 'dikembalikan', label: 'Dikembalikan' }, { value: 'terlambat', label: 'Terlambat' }],
            }]}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
        ) : data.data.length === 0 ? (
          <EmptyState description="Belum ada data peminjaman." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-secondary-200">
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Kode</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Barang</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Peminjam</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Tgl Pinjam</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Tgl Kembali</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Status</th>
                    <th className="text-center py-3 px-4 font-medium text-secondary-500">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((item: any) => (
                    <tr key={item.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                      <td className="py-3 px-4 font-mono text-xs">{item.kode_peminjaman}</td>
                      <td className="py-3 px-4">{item.barang_nama}</td>
                      <td className="py-3 px-4">{item.peminjam}</td>
                      <td className="py-3 px-4">{formatDateShort(item.tanggal_pinjam)}</td>
                      <td className="py-3 px-4">{formatDateShort(item.tanggal_kembali_rencana)}</td>
                      <td className="py-3 px-4"><StatusBadge status={item.status} /></td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          {item.status === 'dipinjam' && (
                            <button onClick={() => handleReturn(item.id)} className="p-1.5 rounded hover:bg-green-50 text-green-600" title="Kembalikan">
                              <CheckCircle size={14} />
                            </button>
                          )}
                          <Link href={`/admin/sarpras/peminjaman/${item.id}/edit`}>
                            <button className="p-1.5 rounded hover:bg-secondary-100"><Pencil size={14} /></button>
                          </Link>
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
