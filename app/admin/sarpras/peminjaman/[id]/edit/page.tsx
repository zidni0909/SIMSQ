'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditPeminjamanBarangPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [data, setData] = useState<any>(null);
  const [form, setForm] = useState({ peminjam: '', jabatan: '', keperluan: '', tanggal_kembali_rencana: '', catatan: '' });

  useEffect(() => {
    fetch(`/api/sarpras/peminjaman/${params.id}`).then(r => r.json()).then(d => {
      setData(d);
      setForm({
        peminjam: d.peminjam || '', jabatan: d.jabatan || '', keperluan: d.keperluan || '',
        tanggal_kembali_rencana: d.tanggal_kembali_rencana?.split('T')[0] || '', catatan: d.catatan || '',
      });
      setFetching(false);
    });
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/sarpras/peminjaman/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      toast('success', 'Data berhasil diupdate');
      router.push('/admin/sarpras/peminjaman');
    }
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  if (fetching) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/sarpras/peminjaman"><button className="p-2 rounded-lg hover:bg-secondary-100"><ArrowLeft size={20} /></button></Link>
        <h1 className="text-2xl font-bold text-secondary-900">Edit Peminjaman</h1>
      </div>

      <Card className="p-6 max-w-2xl">
        <div className="mb-4 p-3 bg-secondary-50 rounded-lg text-sm">
          <p><strong>Kode:</strong> {data?.kode_peminjaman}</p>
          <p><strong>Barang:</strong> {data?.barang_nama}</p>
          <p><strong>Status:</strong> {data?.status}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="peminjam" label="Peminjam" value={form.peminjam} onChange={set('peminjam')} />
            <Input id="jabatan" label="Jabatan" value={form.jabatan} onChange={set('jabatan')} />
          </div>
          <Input id="keperluan" label="Keperluan" value={form.keperluan} onChange={set('keperluan')} />
          <Input id="tanggal_kembali_rencana" label="Tgl Kembali Rencana" type="date" value={form.tanggal_kembali_rencana} onChange={set('tanggal_kembali_rencana')} />
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
