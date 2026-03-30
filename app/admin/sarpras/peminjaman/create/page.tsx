'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import BarcodeScanner from '@/components/ui/BarcodeScanner';
import { toast } from '@/components/ui/Toast';
import { ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';

export default function CreatePeminjamanBarangPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [barangList, setBarangList] = useState<any[]>([]);
  const [scannedBarang, setScannedBarang] = useState<any>(null);
  const [form, setForm] = useState({
    barang_id: '', peminjam: '', jabatan: '', keperluan: '', jumlah_pinjam: '1',
    tanggal_pinjam: new Date().toISOString().split('T')[0],
    tanggal_kembali_rencana: '', catatan: '',
  });

  useEffect(() => {
    fetch('/api/sarpras/barang?limit=100&status=tersedia').then(r => r.json()).then(d => {
      setBarangList(d.data || []);
    });
  }, []);

  async function handleScanBarang(code: string) {
    const res = await fetch(`/api/scan/barang?code=${encodeURIComponent(code)}`);
    const json = await res.json();
    if (json.found) {
      setScannedBarang(json.data);
      setForm(prev => ({ ...prev, barang_id: String(json.data.id) }));
      toast('success', `Barang ditemukan: ${json.data.nama}`);
    } else {
      toast('error', `Barang dengan kode "${code}" tidak ditemukan`);
      setScannedBarang(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.barang_id || !form.peminjam || !form.tanggal_kembali_rencana) {
      toast('error', 'Lengkapi data wajib');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/sarpras/peminjaman', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      toast('success', 'Peminjaman berhasil dibuat');
      router.push('/admin/sarpras/peminjaman');
    } else {
      toast('error', 'Gagal membuat peminjaman');
    }
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/sarpras/peminjaman"><button className="p-2 rounded-lg hover:bg-secondary-100"><ArrowLeft size={20} /></button></Link>
        <h1 className="text-2xl font-bold text-secondary-900">Tambah Peminjaman Barang</h1>
      </div>

      {/* Barcode Scanner */}
      <div className="mb-6 max-w-md">
        <BarcodeScanner
          onScan={handleScanBarang}
          label="Scan Barcode Barang"
          placeholder="Masukkan kode barang..."
        />
        {scannedBarang && (
          <Card className="p-4 mt-3 border-green-200 bg-green-50">
            <div className="flex items-start gap-3">
              <Package size={20} className="text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">{scannedBarang.nama}</p>
                <p className="text-sm text-green-700">Kode: {scannedBarang.kode_barang}</p>
                <p className="text-sm text-green-700">Lokasi: {scannedBarang.lokasi_nama || '-'}</p>
                <p className="text-sm text-green-700">Kondisi: {scannedBarang.kondisi}</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select id="barang_id" label="Barang *" value={form.barang_id} onChange={(e) => { set('barang_id')(e); setScannedBarang(null); }} placeholder="Pilih barang"
            options={barangList.map((b: any) => ({ value: String(b.id), label: `${b.kode_barang} - ${b.nama}` }))} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="peminjam" label="Peminjam *" value={form.peminjam} onChange={set('peminjam')} required />
            <Input id="jabatan" label="Jabatan" value={form.jabatan} onChange={set('jabatan')} />
          </div>
          <Input id="keperluan" label="Keperluan" value={form.keperluan} onChange={set('keperluan')} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input id="jumlah_pinjam" label="Jumlah" type="number" value={form.jumlah_pinjam} onChange={set('jumlah_pinjam')} min="1" />
            <Input id="tanggal_pinjam" label="Tgl Pinjam *" type="date" value={form.tanggal_pinjam} onChange={set('tanggal_pinjam')} required />
            <Input id="tanggal_kembali_rencana" label="Tgl Kembali *" type="date" value={form.tanggal_kembali_rencana} onChange={set('tanggal_kembali_rencana')} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Catatan</label>
            <textarea className="w-full px-3 py-2 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" rows={3} value={form.catatan} onChange={set('catatan')} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>Simpan</Button>
            <Link href="/admin/sarpras/peminjaman"><Button type="button" variant="secondary">Batal</Button></Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
