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
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function AnggotaPage() {
  const [data, setData] = useState<any>({ data: [], total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [jenis, setJenis] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '10', search, jenis });
    const res = await fetch(`/api/perpustakaan/anggota?${params}`);
    setData(await res.json());
    setLoading(false);
  }, [page, search, jenis]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleDelete(id: number) {
    if (!confirm('Yakin ingin menghapus anggota ini?')) return;
    const res = await fetch(`/api/perpustakaan/anggota/${id}`, { method: 'DELETE' });
    if (res.ok) { toast('success', 'Anggota berhasil dihapus'); fetchData(); }
    else { const err = await res.json(); toast('error', err.error || 'Gagal menghapus'); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Data Anggota</h1>
        <Link href="/admin/perpustakaan/anggota/create"><Button><Plus size={16} className="mr-2" /> Tambah Anggota</Button></Link>
      </div>

      <Card className="p-5">
        <div className="mb-4">
          <SearchFilter search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} placeholder="Cari nama, kode, kelas..."
            filters={[{
              label: 'Semua Jenis', value: jenis,
              onChange: (v) => { setJenis(v); setPage(1); },
              options: [{ value: 'siswa', label: 'Siswa' }, { value: 'guru', label: 'Guru' }, { value: 'karyawan', label: 'Karyawan' }],
            }]}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
        ) : data.data.length === 0 ? (
          <EmptyState description="Belum ada data anggota." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-secondary-200">
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Kode</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Nama</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Jenis</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Kelas</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">No HP</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Status</th>
                    <th className="text-center py-3 px-4 font-medium text-secondary-500">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((item: any) => (
                    <tr key={item.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                      <td className="py-3 px-4 font-mono text-xs">{item.kode_anggota}</td>
                      <td className="py-3 px-4 font-medium">{item.nama}</td>
                      <td className="py-3 px-4"><StatusBadge status={item.jenis} /></td>
                      <td className="py-3 px-4">{item.kelas || '-'}</td>
                      <td className="py-3 px-4">{item.no_hp || '-'}</td>
                      <td className="py-3 px-4"><StatusBadge status={item.is_active ? 'active' : 'inactive'} /></td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={`/admin/perpustakaan/anggota/${item.id}/edit`}><button className="p-1.5 rounded hover:bg-secondary-100"><Pencil size={14} /></button></Link>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-secondary-500">Total: {data.total} anggota</p>
              <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
