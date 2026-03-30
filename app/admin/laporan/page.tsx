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
import { FileText, Download, FileSpreadsheet } from 'lucide-react';

export default function LaporanPage() {
  const [type, setType] = useState('sarpras');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function fetchReport() {
    setLoading(true);
    const params = new URLSearchParams({ type, start_date: startDate, end_date: endDate });
    const res = await fetch(`/api/laporan?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  async function exportExcel() {
    if (!data || !data.data || data.data.length === 0) {
      toast('error', 'Tidak ada data untuk diekspor');
      return;
    }

    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(data.data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan');
    XLSX.writeFile(wb, `laporan-${type}-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast('success', 'File Excel berhasil diunduh');
  }

  async function exportPDF() {
    if (!data || !data.data || data.data.length === 0) {
      toast('error', 'Tidak ada data untuk diekspor');
      return;
    }

    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const titles: Record<string, string> = {
      sarpras: 'Laporan Inventaris Sarpras',
      perpustakaan: 'Laporan Data Buku Perpustakaan',
      peminjaman_barang: 'Laporan Peminjaman Barang',
      peminjaman_buku: 'Laporan Peminjaman Buku',
    };
    doc.text(titles[type] || 'Laporan', 148, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (startDate && endDate) {
      doc.text(`Periode: ${startDate} s/d ${endDate}`, 148, 22, { align: 'center' });
    }

    // Table headers & data
    const headers = Object.keys(data.data[0] || {});
    const startX = 10;
    let y = 30;

    // Header
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240, 240, 240);
    const colWidth = (277 - 20) / headers.length;
    headers.forEach((h, i) => {
      doc.rect(startX + i * colWidth, y, colWidth, 7, 'F');
      doc.text(h.replace(/_/g, ' ').toUpperCase(), startX + i * colWidth + 1, y + 5);
    });
    y += 7;

    // Rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    for (const row of data.data) {
      if (y > 190) {
        doc.addPage();
        y = 15;
      }
      headers.forEach((h, i) => {
        const val = row[h] != null ? String(row[h]) : '-';
        const truncated = val.length > 20 ? val.substring(0, 20) + '...' : val;
        doc.text(truncated, startX + i * colWidth + 1, y + 4);
      });
      doc.setDrawColor(230);
      doc.line(startX, y + 6, 287, y + 6);
      y += 7;
    }

    // Summary
    if (data.summary) {
      y += 5;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Ringkasan:', startX, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      for (const [key, value] of Object.entries(data.summary)) {
        doc.text(`${key.replace(/_/g, ' ')}: ${value}`, startX, y);
        y += 4;
      }
    }

    doc.save(`laporan-${type}-${new Date().toISOString().split('T')[0]}.pdf`);
    toast('success', 'File PDF berhasil diunduh');
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <FileText size={28} className="text-secondary-700" />
        <h1 className="text-2xl font-bold text-secondary-900">Laporan</h1>
      </div>

      {/* Filters */}
      <Card className="p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <Select
            label="Jenis Laporan"
            value={type}
            onChange={(e) => { setType(e.target.value); setData(null); }}
            options={[
              { value: 'sarpras', label: 'Inventaris Sarpras' },
              { value: 'perpustakaan', label: 'Data Buku Perpustakaan' },
              { value: 'peminjaman_barang', label: 'Peminjaman Barang' },
              { value: 'peminjaman_buku', label: 'Peminjaman Buku' },
            ]}
          />
          <Input
            label="Tanggal Mulai"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="Tanggal Akhir"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Button onClick={fetchReport} loading={loading}>
            Tampilkan
          </Button>
        </div>
      </Card>

      {/* Summary */}
      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(data.summary).map(([key, value]) => (
            <Card key={key} className="p-4">
              <p className="text-xs text-secondary-500 mb-1">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
              <p className="text-xl font-bold text-secondary-900">
                {key.includes('nilai') || key.includes('denda') ? formatCurrency(Number(value)) : String(value ?? 0)}
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* Data Table */}
      {data && (
        <Card className="p-5">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-secondary-600">{data.data?.length || 0} data ditemukan</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={exportExcel}>
                <FileSpreadsheet size={14} className="mr-1" /> Excel
              </Button>
              <Button variant="secondary" size="sm" onClick={exportPDF}>
                <Download size={14} className="mr-1" /> PDF
              </Button>
            </div>
          </div>

          {!data.data || data.data.length === 0 ? (
            <EmptyState description="Tidak ada data untuk ditampilkan." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-secondary-200">
                    {Object.keys(data.data[0]).map(key => (
                      <th key={key} className="text-left py-3 px-3 font-medium text-secondary-500 text-xs whitespace-nowrap">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((row: any, idx: number) => (
                    <tr key={idx} className="border-b border-secondary-100 hover:bg-secondary-50">
                      {Object.entries(row).map(([key, val]) => (
                        <td key={key} className="py-2 px-3 text-xs whitespace-nowrap">
                          {key === 'status' || key === 'kondisi' ? (
                            <StatusBadge status={String(val)} />
                          ) : key.includes('harga') || key.includes('biaya') || key.includes('denda') ? (
                            formatCurrency(Number(val))
                          ) : (
                            String(val ?? '-')
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
