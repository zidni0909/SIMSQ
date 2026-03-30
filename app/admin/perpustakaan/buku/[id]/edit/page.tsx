'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { toast } from '@/components/ui/Toast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditBukuPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [kategoriList, setKategoriList] = useState<any[]>([]);
  const [rakList, setRakList] = useState<any[]>([]);
  const [form, setForm] = useState({
    judul: '', pengarang: '', penerbit: '', isbn: '', tahun_terbit: '',
    kategori_id: '', rak_id: '', stok: '1', stok_minimum: '1', bahasa: 'Indonesia', halaman: '', keterangan: '',
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/perpustakaan/buku/${params.id}`).then(r => r.json()),
      fetch('/api/perpustakaan/buku?limit=1').then(r => r.json()),
    ]).then(([item, listData]) => {
      setForm({
        judul: item.judul || '', pengarang: item.pengarang || '', penerbit: item.penerbit || '',
        isbn: item.isbn || '', tahun_terbit: String(item.tahun_terbit || ''),
        kategori_id: String(item.kategori_id || ''), rak_id: String(item.rak_id || ''),
        stok: String(item.stok || 1), stok_minimum: String(item.stok_minimum || 1),
        bahasa: item.bahasa || 'Indonesia', halaman: String(item.halaman || ''), keterangan: item.keterangan || '',
      });
      setKategoriList(listData.filters?.kategoriList || []);
      setRakList(listData.filters?.rakList || []);
      setFetching(false);
    });
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/perpustakaan/buku/${params.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, stok: Number(form.stok) || 1, stok_minimum: Number(form.stok_minimum) || 1, halaman: Number(form.halaman) || null }),
    });
    setLoading(false);
    if (res.ok) { toast('success', 'Buku berhasil diupdate'); router.push('/admin/perpustakaan/buku'); }
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  if (fetching) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/perpustakaan/buku"><button className="p-2 rounded-lg hover:bg-secondary-100"><ArrowLeft size={20} /></button></Link>
        <h1 className="text-2xl font-bold text-secondary-900">Edit Buku</h1>
      </div>

      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input id="judul" label="Judul Buku *" value={form.judul} onChange={set('judul')} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="pengarang" label="Pengarang" value={form.pengarang} onChange={set('pengarang')} />
            <Input id="penerbit" label="Penerbit" value={form.penerbit} onChange={set('penerbit')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="isbn" label="ISBN" value={form.isbn} onChange={set('isbn')} />
            <Input id="tahun_terbit" label="Tahun Terbit" type="number" value={form.tahun_terbit} onChange={set('tahun_terbit')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select id="kategori_id" label="Kategori" value={form.kategori_id} onChange={set('kategori_id')} placeholder="Pilih kategori" options={kategoriList.map((k: any) => ({ value: String(k.id), label: k.nama }))} />
            <Select id="rak_id" label="Rak" value={form.rak_id} onChange={set('rak_id')} placeholder="Pilih rak" options={rakList.map((r: any) => ({ value: String(r.id), label: `${r.kode_rak} - ${r.nama}` }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input id="stok" label="Stok" type="number" value={form.stok} onChange={set('stok')} min="1" />
            <Input id="stok_minimum" label="Stok Minimum" type="number" value={form.stok_minimum} onChange={set('stok_minimum')} />
            <Input id="halaman" label="Halaman" type="number" value={form.halaman} onChange={set('halaman')} />
          </div>
          <Input id="bahasa" label="Bahasa" value={form.bahasa} onChange={set('bahasa')} />
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Keterangan</label>
            <textarea className="w-full px-3 py-2 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" rows={3} value={form.keterangan} onChange={set('keterangan')} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>Simpan</Button>
            <Link href="/admin/perpustakaan/buku"><Button type="button" variant="secondary">Batal</Button></Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
