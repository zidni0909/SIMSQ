'use client';

import { useState, useRef } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { toast } from '@/components/ui/Toast';
import { Download, Upload, Database, FileJson, FileSpreadsheet } from 'lucide-react';

const tables = [
  { value: 'all', label: 'Semua Data' },
  { value: 'barang', label: 'Data Barang' },
  { value: 'peminjaman_barang', label: 'Peminjaman Barang' },
  { value: 'perawatan_barang', label: 'Perawatan Barang' },
  { value: 'kategori_barang', label: 'Kategori Barang' },
  { value: 'lokasi', label: 'Ruangan/Lokasi' },
  { value: 'buku', label: 'Data Buku' },
  { value: 'anggota', label: 'Anggota Perpustakaan' },
  { value: 'peminjaman_buku', label: 'Peminjaman Buku' },
  { value: 'kategori_buku', label: 'Kategori Buku' },
  { value: 'rak', label: 'Rak Perpustakaan' },
  { value: 'settings', label: 'Pengaturan' },
];

export default function BackupPage() {
  const [exportTable, setExportTable] = useState('all');
  const [exportFormat, setExportFormat] = useState('json');
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importTable, setImportTable] = useState('barang');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    setExporting(true);
    try {
      const params = new URLSearchParams({ table: exportTable, format: exportFormat });
      const res = await fetch(`/api/backup?${params}`);

      if (!res.ok) {
        toast('error', 'Gagal mengexport data');
        setExporting(false);
        return;
      }

      if (exportFormat === 'csv') {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportTable}_backup.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `simsq_backup_${exportTable}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast('success', 'Data berhasil diexport');
    } catch {
      toast('error', 'Gagal mengexport data');
    }
    setExporting(false);
  }

  async function handleImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) { toast('error', 'Pilih file terlebih dahulu'); return; }

    setImporting(true);
    try {
      const text = await file.text();
      let importData: any[];

      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        // Support both {data: {table: [...]}} and direct array
        if (parsed.data && parsed.data[importTable]) {
          importData = parsed.data[importTable];
        } else if (Array.isArray(parsed)) {
          importData = parsed;
        } else {
          toast('error', 'Format JSON tidak valid');
          setImporting(false);
          return;
        }
      } else if (file.name.endsWith('.csv')) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        importData = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const obj: Record<string, string> = {};
          headers.forEach((h, i) => { obj[h] = values[i] || ''; });
          return obj;
        });
      } else {
        toast('error', 'Format file harus JSON atau CSV');
        setImporting(false);
        return;
      }

      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: importTable, data: importData }),
      });

      const result = await res.json();
      if (res.ok) {
        toast('success', result.message);
      } else {
        toast('error', result.error || 'Gagal mengimport data');
      }
    } catch {
      toast('error', 'Gagal membaca file');
    }
    setImporting(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary-900 mb-6">Backup & Import/Export Data</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Download size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-secondary-900">Export Data</h2>
              <p className="text-sm text-secondary-500">Download backup data</p>
            </div>
          </div>

          <div className="space-y-4">
            <Select id="export_table" label="Pilih Data" value={exportTable} onChange={e => setExportTable(e.target.value)} options={tables.map(t => ({ value: t.value, label: t.label }))} />
            <Select id="export_format" label="Format" value={exportFormat} onChange={e => setExportFormat(e.target.value)} options={[
              { value: 'json', label: 'JSON' },
              ...(exportTable !== 'all' ? [{ value: 'csv', label: 'CSV' }] : []),
            ]} />
            <Button onClick={handleExport} loading={exporting} className="w-full">
              <Download size={16} className="mr-2" /> Export
            </Button>
          </div>
        </Card>

        {/* Import */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Upload size={20} className="text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-secondary-900">Import Data</h2>
              <p className="text-sm text-secondary-500">Import dari file JSON/CSV</p>
            </div>
          </div>

          <div className="space-y-4">
            <Select id="import_table" label="Tabel Tujuan" value={importTable} onChange={e => setImportTable(e.target.value)} options={tables.filter(t => t.value !== 'all').map(t => ({ value: t.value, label: t.label }))} />
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">File (JSON/CSV)</label>
              <input ref={fileRef} type="file" accept=".json,.csv" className="w-full text-sm border border-secondary-300 rounded-lg p-2 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-primary-50 file:text-primary-700 file:font-medium file:text-sm" />
            </div>
            <Button onClick={handleImport} loading={importing} className="w-full" variant="secondary">
              <Upload size={16} className="mr-2" /> Import
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
