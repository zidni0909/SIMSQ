'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { toast } from '@/components/ui/Toast';
import { ArrowLeft, Upload, X } from 'lucide-react';
import Link from 'next/link';

export default function EditBarangPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [kategoriList, setKategoriList] = useState<any[]>([]);
  const [lokasiList, setLokasiList] = useState<any[]>([]);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    nama: '', kategori_id: '', lokasi_id: '', merk: '', tahun_pengadaan: '',
    sumber_dana: '', harga_perolehan: '', jumlah: '1', kondisi: 'baik', status: 'tersedia', keterangan: '',
    foto_url: '', penanggung_jawab: '', jabatan_pj: '', kontak_pj: '',
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/sarpras/barang/${params.id}`).then(r => r.json()),
      fetch('/api/sarpras/barang?limit=1').then(r => r.json()),
    ]).then(([item, listData]) => {
      setForm({
        nama: item.nama || '', kategori_id: String(item.kategori_id || ''), lokasi_id: String(item.lokasi_id || ''),
        merk: item.merk || '', tahun_pengadaan: String(item.tahun_pengadaan || ''),
        sumber_dana: item.sumber_dana || '', harga_perolehan: String(item.harga_perolehan || ''),
        jumlah: String(item.jumlah || 1), kondisi: item.kondisi || 'baik', status: item.status || 'tersedia',
        keterangan: item.keterangan || '', foto_url: item.foto_url || '',
        penanggung_jawab: item.penanggung_jawab || '', jabatan_pj: item.jabatan_pj || '', kontak_pj: item.kontak_pj || '',
      });
      if (item.foto_url) setFotoPreview(item.foto_url);
      setKategoriList(listData.filters?.kategoriList || []);
      setLokasiList(listData.filters?.lokasiList || []);
      setFetching(false);
    });
  }, [params.id]);

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast('error', 'Ukuran file maksimal 2MB'); return; }
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    let foto_url = form.foto_url || null;
    if (fotoFile) {
      const fd = new FormData();
      fd.append('file', fotoFile);
      fd.append('folder', 'barang');
      const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
      if (upRes.ok) {
        const upData = await upRes.json();
        foto_url = upData.url;
      }
    }

    const res = await fetch(`/api/sarpras/barang/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, foto_url, harga_perolehan: Number(form.harga_perolehan) || 0, jumlah: Number(form.jumlah) || 1 }),
    });
    setLoading(false);
    if (res.ok) {
      toast('success', 'Barang berhasil diupdate');
      router.push('/admin/sarpras/barang');
    } else {
      const err = await res.json();
      toast('error', err.error || 'Gagal mengupdate');
    }
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  if (fetching) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/sarpras/barang"><button className="p-2 rounded-lg hover:bg-secondary-100"><ArrowLeft size={20} /></button></Link>
        <h1 className="text-2xl font-bold text-secondary-900">Edit Barang</h1>
      </div>

      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Foto Upload */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Foto Barang</label>
            <div className="flex items-center gap-4">
              {fotoPreview ? (
                <div className="relative w-24 h-24">
                  <Image src={fotoPreview} alt="Preview" fill className="object-cover rounded-lg border" />
                  <button type="button" onClick={() => { setFotoPreview(null); setFotoFile(null); setForm(p => ({ ...p, foto_url: '' })); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="w-24 h-24 border-2 border-dashed border-secondary-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 transition-colors">
                  <Upload size={20} className="text-secondary-400" />
                  <span className="text-xs text-secondary-400 mt-1">Upload</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFoto} />
                </label>
              )}
              <p className="text-xs text-secondary-500">Maks. 2MB (JPG, PNG, WebP)</p>
            </div>
          </div>

          <Input id="nama" label="Nama Barang *" value={form.nama} onChange={set('nama')} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select id="kategori_id" label="Kategori" value={form.kategori_id} onChange={set('kategori_id')} placeholder="Pilih kategori" options={kategoriList.map((k: any) => ({ value: String(k.id), label: k.nama }))} />
            <Select id="lokasi_id" label="Lokasi" value={form.lokasi_id} onChange={set('lokasi_id')} placeholder="Pilih lokasi" options={lokasiList.map((l: any) => ({ value: String(l.id), label: l.nama }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="merk" label="Merk" value={form.merk} onChange={set('merk')} />
            <Input id="tahun_pengadaan" label="Tahun Pengadaan" type="number" value={form.tahun_pengadaan} onChange={set('tahun_pengadaan')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="harga_perolehan" label="Harga Perolehan (Rp)" type="number" value={form.harga_perolehan} onChange={set('harga_perolehan')} />
            <Input id="jumlah" label="Jumlah" type="number" value={form.jumlah} onChange={set('jumlah')} min="1" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input id="sumber_dana" label="Sumber Dana" value={form.sumber_dana} onChange={set('sumber_dana')} />
            <Select id="kondisi" label="Kondisi" value={form.kondisi} onChange={set('kondisi')} options={[
              { value: 'baik', label: 'Baik' }, { value: 'rusak_ringan', label: 'Rusak Ringan' }, { value: 'rusak_berat', label: 'Rusak Berat' }, { value: 'hilang', label: 'Hilang' },
            ]} />
            <Select id="status" label="Status" value={form.status} onChange={set('status')} options={[
              { value: 'tersedia', label: 'Tersedia' }, { value: 'dipinjam', label: 'Dipinjam' }, { value: 'dalam_perawatan', label: 'Dalam Perawatan' }, { value: 'dihapuskan', label: 'Dihapuskan' },
            ]} />
          </div>

          {/* Penanggung Jawab */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-semibold text-secondary-700 mb-3">Penanggung Jawab</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input id="penanggung_jawab" label="Nama PJ" value={form.penanggung_jawab} onChange={set('penanggung_jawab')} />
              <Input id="jabatan_pj" label="Jabatan" value={form.jabatan_pj} onChange={set('jabatan_pj')} />
              <Input id="kontak_pj" label="Kontak" value={form.kontak_pj} onChange={set('kontak_pj')} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Keterangan</label>
            <textarea className="w-full px-3 py-2 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" rows={3} value={form.keterangan} onChange={set('keterangan')} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>Simpan</Button>
            <Link href="/admin/sarpras/barang"><Button type="button" variant="secondary">Batal</Button></Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
