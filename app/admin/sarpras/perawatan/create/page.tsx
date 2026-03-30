'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { toast } from '@/components/ui/Toast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreatePerawatanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [barangList, setBarangList] = useState<any[]>([]);
  const [form, setForm] = useState({
    barang_id: '', tanggal_perawatan: new Date().toISOString().split('T')[0],
    jenis_perawatan: 'rutin', deskripsi: '', biaya: '', teknisi: '', hasil: 'selesai', catatan: '',
  });

  useEffect(() => {
    fetch('/api/sarpras/barang?limit=100').then(r => r.json()).then(d => setBarangList(d.data || []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.barang_id) { toast('error', 'Pilih barang'); return; }
    setLoading(true);
    const res = await fetch('/api/sarpras/perawatan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, biaya: Number(form.biaya) || 0 }),
    });
    setLoading(false);
    if (res.ok) { toast('success', 'Data perawatan berhasil ditambahkan'); router.push('/admin/sarpras/perawatan'); }
    else toast('error', 'Gagal menambahkan data');
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/sarpras/perawatan"><button className="p-2 rounded-lg hover:bg-secondary-100"><ArrowLeft size={20} /></button></Link>
        <h1 className="text-2xl font-bold text-secondary-900">Tambah Perawatan</h1>
      </div>

      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select id="barang_id" label="Barang *" value={form.barang_id} onChange={set('barang_id')} placeholder="Pilih barang"
            options={barangList.map((b: any) => ({ value: String(b.id), label: `${b.kode_barang} - ${b.nama}` }))} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="tanggal_perawatan" label="Tanggal Perawatan *" type="date" value={form.tanggal_perawatan} onChange={set('tanggal_perawatan')} required />
            <Select id="jenis_perawatan" label="Jenis Perawatan *" value={form.jenis_perawatan} onChange={set('jenis_perawatan')} options={[
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
