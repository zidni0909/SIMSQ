'use client';

import { useEffect, useState, useCallback } from 'react';
import Card from '@/components/ui/Card';
import SearchFilter from '@/components/ui/SearchFilter';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils/format';
import { ScrollText } from 'lucide-react';

export default function AuditLogPage() {
  const [data, setData] = useState<{ data: any[]; total: number; page: number; totalPages: number }>({ data: [], total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20', search, action });
    const res = await fetch(`/api/audit-logs?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [page, search, action]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <ScrollText size={28} className="text-secondary-700" />
        <h1 className="text-2xl font-bold text-secondary-900">Audit Log</h1>
      </div>

      <Card className="p-5">
        <div className="mb-4">
          <SearchFilter
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Cari user atau tabel..."
            filters={[
              {
                label: 'Semua Aksi',
                value: action,
                onChange: (v) => { setAction(v); setPage(1); },
                options: [
                  { value: 'CREATE', label: 'Create' },
                  { value: 'UPDATE', label: 'Update' },
                  { value: 'DELETE', label: 'Delete' },
                  { value: 'LOGIN', label: 'Login' },
                  { value: 'LOGOUT', label: 'Logout' },
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
          <EmptyState description="Belum ada audit log." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-secondary-200">
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Waktu</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">User</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Aksi</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Tabel</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Record ID</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((log: any) => (
                    <tr key={log.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                      <td className="py-3 px-4 text-xs text-secondary-600">{formatDate(log.created_at)}</td>
                      <td className="py-3 px-4 font-medium">{log.user_nama || '-'}</td>
                      <td className="py-3 px-4"><StatusBadge status={log.action} /></td>
                      <td className="py-3 px-4 text-secondary-600">{log.table_name || '-'}</td>
                      <td className="py-3 px-4 text-secondary-600">{log.record_id || '-'}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                          className="text-primary-600 hover:underline text-xs"
                        >
                          {expandedId === log.id ? 'Tutup' : 'Lihat'}
                        </button>
                        {expandedId === log.id && (
                          <div className="mt-2 space-y-2">
                            {log.old_values && (
                              <div>
                                <p className="text-xs font-medium text-secondary-500">Data Lama:</p>
                                <pre className="text-xs bg-red-50 p-2 rounded overflow-x-auto max-w-xs">
                                  {JSON.stringify(typeof log.old_values === 'string' ? JSON.parse(log.old_values) : log.old_values, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.new_values && (
                              <div>
                                <p className="text-xs font-medium text-secondary-500">Data Baru:</p>
                                <pre className="text-xs bg-green-50 p-2 rounded overflow-x-auto max-w-xs">
                                  {JSON.stringify(typeof log.new_values === 'string' ? JSON.parse(log.new_values) : log.new_values, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-secondary-500">Total: {data.total} log</p>
              <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
