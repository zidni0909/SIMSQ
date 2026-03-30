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

export default function EditAnggotaPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({ nama: '', jenis: 'siswa', kelas: '', no_hp: '', alamat: '', is_active: 'true' });

  useEffect(() => {
    fetch(`/api/perpustakaan/anggota/${params.id}`).then(r => r.json()).then(d => {
      setForm({ nama: d.nama || '', jenis: d.jenis, kelas: d.kelas || '', no_hp: d.no_hp || '', alamat: d.alamat || '', is_active: String(d.is_active) });
      setFetching(false);
    });
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/perpustakaan/anggota/${params.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, is_active: form.is_active === 'true' }),
    });
    setLoading(false);
    if (res.ok) { toast('success', 'Anggota berhasil diupdate'); router.push('/admin/perpustakaan/anggota'); }
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  if (fetching) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/perpustakaan/anggota"><button className="p-2 rounded-lg hover:bg-secondary-100"><ArrowLeft size={20} /></button></Link>
        <h1 className="text-2xl font-bold text-secondary-900">Edit Anggota</h1>
      </div>

      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input id="nama" label="Nama *" value={form.nama} onChange={set('nama')} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select id="jenis" label="Jenis" value={form.jenis} onChange={set('jenis')} options={[
              { value: 'siswa', label: 'Siswa' }, { value: 'guru', label: 'Guru' }, { value: 'karyawan', label: 'Karyawan' },
            ]} />
            <Input id="kelas" label="Kelas" value={form.kelas} onChange={set('kelas')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="no_hp" label="No HP" value={form.no_hp} onChange={set('no_hp')} />
            <Select id="is_active" label="Status" value={form.is_active} onChange={set('is_active')} options={[
              { value: 'true', label: 'Aktif' }, { value: 'false', label: 'Tidak Aktif' },
            ]} />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Alamat</label>
            <textarea className="w-full px-3 py-2 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" rows={3} value={form.alamat} onChange={set('alamat')} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>Simpan</Button>
            <Link href="/admin/perpustakaan/anggota"><Button type="button" variant="secondary">Batal</Button></Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
