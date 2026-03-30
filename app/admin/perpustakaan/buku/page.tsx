'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SearchFilter from '@/components/ui/SearchFilter';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { toast } from '@/components/ui/Toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function BukuPage() {
  const [data, setData] = useState<any>({ data: [], total: 0, page: 1, totalPages: 1, filters: {} });
  const [search, setSearch] = useState('');
  const [kategori, setKategori] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '10', search, kategori });
    const res = await fetch(`/api/perpustakaan/buku?${params}`);
    setData(await res.json());
    setLoading(false);
  }, [page, search, kategori]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleDelete(id: number) {
    if (!confirm('Yakin ingin menghapus buku ini?')) return;
    const res = await fetch(`/api/perpustakaan/buku/${id}`, { method: 'DELETE' });
    if (res.ok) { toast('success', 'Buku berhasil dihapus'); fetchData(); }
    else { const err = await res.json(); toast('error', err.error || 'Gagal menghapus'); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Data Buku</h1>
        <Link href="/admin/perpustakaan/buku/create"><Button><Plus size={16} className="mr-2" /> Tambah Buku</Button></Link>
      </div>

      <Card className="p-5">
        <div className="mb-4">
          <SearchFilter search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} placeholder="Cari judul, kode, pengarang, ISBN..."
            filters={[{
              label: 'Semua Kategori', value: kategori,
              onChange: (v) => { setKategori(v); setPage(1); },
              options: (data.filters?.kategoriList || []).map((k: any) => ({ value: String(k.id), label: k.nama })),
            }]}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
        ) : data.data.length === 0 ? (
          <EmptyState description="Belum ada data buku." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-secondary-200">
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Kode</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Judul</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Pengarang</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Kategori</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Rak</th>
                    <th className="text-center py-3 px-4 font-medium text-secondary-500">Stok</th>
                    <th className="text-center py-3 px-4 font-medium text-secondary-500">Tersedia</th>
                    <th className="text-center py-3 px-4 font-medium text-secondary-500">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((item: any) => (
                    <tr key={item.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                      <td className="py-3 px-4 font-mono text-xs">{item.kode_buku}</td>
                      <td className="py-3 px-4 font-medium">{item.judul}</td>
                      <td className="py-3 px-4 text-secondary-600">{item.pengarang || '-'}</td>
                      <td className="py-3 px-4 text-secondary-600">{item.kategori_nama || '-'}</td>
                      <td className="py-3 px-4 text-secondary-600">{item.rak_kode || '-'}</td>
                      <td className="py-3 px-4 text-center">{item.stok}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={item.stok_tersedia <= item.stok_minimum ? 'text-red-600 font-medium' : ''}>
                          {item.stok_tersedia}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={`/admin/perpustakaan/buku/${item.id}/edit`}><button className="p-1.5 rounded hover:bg-secondary-100"><Pencil size={14} /></button></Link>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-secondary-500">Total: {data.total} buku</p>
              <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
