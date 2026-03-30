'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import { toast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils/format';
import { FileSpreadsheet } from 'lucide-react';

export default function LaporanPerpusPage() {
  const [type, setType] = useState('perpustakaan');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function fetchReport() {
    setLoading(true);
    const params = new URLSearchParams({ type, start_date: startDate, end_date: endDate });
    const res = await fetch(`/api/laporan?${params}`);
    setData(await res.json());
    setLoading(false);
  }

  async function exportExcel() {
    if (!data?.data?.length) { toast('error', 'Tidak ada data'); return; }
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(data.data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan');
    XLSX.writeFile(wb, `laporan-${type}-${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary-900 mb-6">Laporan Perpustakaan</h1>

      <Card className="p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <Select label="Jenis Laporan" value={type} onChange={e => { setType(e.target.value); setData(null); }} options={[
            { value: 'perpustakaan', label: 'Data Buku' },
            { value: 'peminjaman_buku', label: 'Peminjaman Buku' },
          ]} />
          <Input label="Tanggal Mulai" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <Input label="Tanggal Akhir" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          <Button onClick={fetchReport} loading={loading}>Tampilkan</Button>
        </div>
      </Card>

      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(data.summary).map(([key, value]) => (
            <Card key={key} className="p-4">
              <p className="text-xs text-secondary-500 mb-1">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
              <p className="text-xl font-bold text-secondary-900">
                {key.includes('denda') ? formatCurrency(Number(value)) : String(value ?? 0)}
              </p>
            </Card>
          ))}
        </div>
      )}

      {data && (
        <Card className="p-5">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-secondary-600">{data.data?.length || 0} data</p>
            <Button variant="secondary" size="sm" onClick={exportExcel}><FileSpreadsheet size={14} className="mr-1" /> Excel</Button>
          </div>
          {!data.data?.length ? <EmptyState description="Tidak ada data." /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-secondary-200">
                  {Object.keys(data.data[0]).map(key => (
                    <th key={key} className="text-left py-3 px-3 font-medium text-secondary-500 text-xs whitespace-nowrap">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</th>
                  ))}
                </tr></thead>
                <tbody>{data.data.map((row: any, idx: number) => (
                  <tr key={idx} className="border-b border-secondary-100 hover:bg-secondary-50">
                    {Object.entries(row).map(([key, val]) => (
                      <td key={key} className="py-2 px-3 text-xs whitespace-nowrap">
                        {key === 'status' ? <StatusBadge status={String(val)} /> : key.includes('denda') ? formatCurrency(Number(val)) : String(val ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
