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

export default function EditPerawatanPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [barangNama, setBarangNama] = useState('');
  const [form, setForm] = useState({
    tanggal_perawatan: '', jenis_perawatan: 'rutin', deskripsi: '', biaya: '', teknisi: '', hasil: 'selesai', catatan: '',
  });

  useEffect(() => {
    fetch(`/api/sarpras/perawatan/${params.id}`).then(r => r.json()).then(d => {
      setBarangNama(d.barang_nama || '');
      setForm({
        tanggal_perawatan: d.tanggal_perawatan?.split('T')[0] || '', jenis_perawatan: d.jenis_perawatan,
        deskripsi: d.deskripsi || '', biaya: String(d.biaya || ''), teknisi: d.teknisi || '', hasil: d.hasil, catatan: d.catatan || '',
      });
      setFetching(false);
    });
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/sarpras/perawatan/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, biaya: Number(form.biaya) || 0 }),
    });
    setLoading(false);
    if (res.ok) { toast('success', 'Data berhasil diupdate'); router.push('/admin/sarpras/perawatan'); }
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  if (fetching) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/sarpras/perawatan"><button className="p-2 rounded-lg hover:bg-secondary-100"><ArrowLeft size={20} /></button></Link>
        <h1 className="text-2xl font-bold text-secondary-900">Edit Perawatan</h1>
      </div>

      <Card className="p-6 max-w-2xl">
        <div className="mb-4 p-3 bg-secondary-50 rounded-lg text-sm">
          <p><strong>Barang:</strong> {barangNama}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="tanggal_perawatan" label="Tanggal" type="date" value={form.tanggal_perawatan} onChange={set('tanggal_perawatan')} />
            <Select id="jenis_perawatan" label="Jenis" value={form.jenis_perawatan} onChange={set('jenis_perawatan')} options={[
              { value: 'rutin', label: 'Rutin' }, { value: 'perbaikan', label: 'Perbaikan' }, { value: 'penggantian_komponen', label: 'Penggantian Komponen' },
            ]} />
          </div>
          <Input id="deskripsi" label="Deskripsi" value={form.deskripsi} onChange={set('deskripsi')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="biaya" label="Biaya (Rp)" type="number" value={form.biaya} onChange={set('biaya')} />
            <Input id="teknisi" label="Teknisi" value={form.teknisi} onChange={set('teknisi')} />
          </div>
          <Select id="hasil" label="Hasil" value={form.hasil} onChange={set('hasil')} options={[
            { value: 'selesai', label: 'Selesai' }, { value: 'dalam_proses', label: 'Dalam Proses' }, { value: 'perlu_tindak_lanjut', label: 'Perlu Tindak Lanjut' },
          ]} />
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Catatan</label>
            <textarea className="w-full px-3 py-2 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" rows={3} value={form.catatan} onChange={set('catatan')} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>Simpan</Button>
            <Link href="/admin/sarpras/perawatan"><Button type="button" variant="secondary">Batal</Button></Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
