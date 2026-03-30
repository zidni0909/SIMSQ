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
import { formatDate } from '@/lib/utils/format';

export default function UsersPage() {
  const [data, setData] = useState<{ data: any[]; total: number; page: number; totalPages: number }>({ data: [], total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '10', search, role });
    const res = await fetch(`/api/users?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [page, search, role]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleDelete(id: number) {
    if (!confirm('Yakin ingin menghapus user ini?')) return;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast('success', 'User berhasil dihapus');
      fetchData();
    } else {
      const err = await res.json();
      toast('error', err.error || 'Gagal menghapus');
    }
  }

  const roleLabel: Record<string, string> = {
    admin: 'Admin',
    sarpras: 'Petugas Sarpras',
    perpus: 'Petugas Perpustakaan',
    kepala_sekolah: 'Kepala Sekolah',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">User Management</h1>
        <Link href="/admin/users/create">
          <Button><Plus size={16} className="mr-2" /> Tambah User</Button>
        </Link>
      </div>

      <Card className="p-5">
        <div className="mb-4">
          <SearchFilter
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Cari nama atau email..."
            filters={[
              {
                label: 'Semua Role',
                value: role,
                onChange: (v) => { setRole(v); setPage(1); },
                options: [
                  { value: 'admin', label: 'Admin' },
                  { value: 'sarpras', label: 'Petugas Sarpras' },
                  { value: 'perpus', label: 'Petugas Perpustakaan' },
                  { value: 'kepala_sekolah', label: 'Kepala Sekolah' },
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
          <EmptyState description="Belum ada data user." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-secondary-200">
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Nama</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Login Terakhir</th>
                    <th className="text-center py-3 px-4 font-medium text-secondary-500">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((user: any) => (
                    <tr key={user.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                      <td className="py-3 px-4 font-medium">{user.nama}</td>
                      <td className="py-3 px-4 text-secondary-600">{user.email}</td>
                      <td className="py-3 px-4"><StatusBadge status={user.role} /></td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {user.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-secondary-600 text-xs">{user.last_login ? formatDate(user.last_login) : '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={`/admin/users/${user.id}/edit`}>
                            <button className="p-1.5 rounded hover:bg-secondary-100"><Pencil size={14} /></button>
                          </Link>
                          <button onClick={() => handleDelete(user.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500">
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
              <p className="text-sm text-secondary-500">Total: {data.total} user</p>
              <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
