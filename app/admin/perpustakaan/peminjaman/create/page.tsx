'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import BarcodeScanner from '@/components/ui/BarcodeScanner';
import { toast } from '@/components/ui/Toast';
import { ArrowLeft, BookOpen, User, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function CreatePeminjamanBukuPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [bukuList, setBukuList] = useState<any[]>([]);
  const [anggotaList, setAnggotaList] = useState<any[]>([]);
  const [scannedBuku, setScannedBuku] = useState<any>(null);
  const [scannedAnggota, setScannedAnggota] = useState<any>(null);
  const [form, setForm] = useState({
    buku_id: '', anggota_id: '',
    tanggal_pinjam: new Date().toISOString().split('T')[0],
    tanggal_kembali_rencana: '',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/perpustakaan/buku?limit=200').then(r => r.json()),
      fetch('/api/perpustakaan/anggota?limit=200').then(r => r.json()),
    ]).then(([bukuData, anggotaData]) => {
      setBukuList((bukuData.data || []).filter((b: any) => b.stok_tersedia > 0));
      setAnggotaList((anggotaData.data || []).filter((a: any) => a.is_active));
    });
  }, []);

  async function handleScanBuku(code: string) {
    const res = await fetch(`/api/scan/buku?code=${encodeURIComponent(code)}`);
    const json = await res.json();
    if (json.found) {
      setScannedBuku(json.data);
      setForm(prev => ({ ...prev, buku_id: String(json.data.id) }));
      toast('success', `Buku ditemukan: ${json.data.judul}`);
    } else {
      toast('error', `Buku dengan kode "${code}" tidak ditemukan`);
      setScannedBuku(null);
    }
  }

  async function handleScanAnggota(code: string) {
    const res = await fetch(`/api/scan/anggota?code=${encodeURIComponent(code)}`);
    const json = await res.json();
    if (json.found) {
      setScannedAnggota(json.data);
      setForm(prev => ({ ...prev, anggota_id: String(json.data.id) }));
      toast('success', `Anggota ditemukan: ${json.data.nama}`);
    } else {
      toast('error', `Anggota dengan kode "${code}" tidak ditemukan`);
      setScannedAnggota(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.buku_id || !form.anggota_id || !form.tanggal_kembali_rencana) {
      toast('error', 'Lengkapi semua data wajib');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/perpustakaan/peminjaman', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) { toast('success', 'Peminjaman buku berhasil'); router.push('/admin/perpustakaan/peminjaman'); }
    else { const err = await res.json(); toast('error', err.error || 'Gagal membuat peminjaman'); }
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/perpustakaan/peminjaman"><button className="p-2 rounded-lg hover:bg-secondary-100"><ArrowLeft size={20} /></button></Link>
        <h1 className="text-2xl font-bold text-secondary-900">Tambah Peminjaman Buku</h1>
      </div>

      {/* Barcode Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <BarcodeScanner
            onScan={handleScanBuku}
            label="Scan Barcode Buku"
            placeholder="Masukkan kode buku atau ISBN..."
          />
          {scannedBuku && (
            <Card className="p-4 mt-3 border-green-200 bg-green-50">
              <div className="flex items-start gap-3">
                <BookOpen size={20} className="text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">{scannedBuku.judul}</p>
                  <p className="text-sm text-green-700">Kode: {scannedBuku.kode_buku}</p>
                  <p className="text-sm text-green-700">Pengarang: {scannedBuku.pengarang || '-'}</p>
                  <p className="text-sm text-green-700">Stok tersedia: {scannedBuku.stok_tersedia}</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div>
          <BarcodeScanner
            onScan={handleScanAnggota}
            label="Scan Barcode Anggota"
            placeholder="Masukkan kode anggota..."
          />
          {scannedAnggota && (
            <Card className="p-4 mt-3 border-blue-200 bg-blue-50">
              <div className="flex items-start gap-3">
                <User size={20} className="text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">{scannedAnggota.nama}</p>
                  <p className="text-sm text-blue-700">Kode: {scannedAnggota.kode_anggota}</p>
                  <p className="text-sm text-blue-700">Jenis: {scannedAnggota.jenis}</p>
                  {scannedAnggota.active_pinjaman?.length > 0 && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                      <p className="text-xs text-yellow-700 flex items-center gap-1">
                        <AlertCircle size={12} /> Sedang meminjam {scannedAnggota.active_pinjaman.length} buku
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Form */}
      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select id="buku_id" label="Buku *" value={form.buku_id} onChange={(e) => { set('buku_id')(e); setScannedBuku(null); }} placeholder="Pilih buku"
            options={bukuList.map((b: any) => ({ value: String(b.id), label: `${b.kode_buku} - ${b.judul} (sisa: ${b.stok_tersedia})` }))} />
          <Select id="anggota_id" label="Anggota *" value={form.anggota_id} onChange={(e) => { set('anggota_id')(e); setScannedAnggota(null); }} placeholder="Pilih anggota"
            options={anggotaList.map((a: any) => ({ value: String(a.id), label: `${a.kode_anggota} - ${a.nama}` }))} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="tanggal_pinjam" label="Tgl Pinjam *" type="date" value={form.tanggal_pinjam} onChange={set('tanggal_pinjam')} required />
            <Input id="tanggal_kembali_rencana" label="Tgl Kembali *" type="date" value={form.tanggal_kembali_rencana} onChange={set('tanggal_kembali_rencana')} required />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>Simpan</Button>
            <Link href="/admin/perpustakaan/peminjaman"><Button type="button" variant="secondary">Batal</Button></Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
