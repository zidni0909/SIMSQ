'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { Save, Settings } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nama_sekolah: '',
    alamat_sekolah: '',
    telepon_sekolah: '',
    email_sekolah: '',
    kepala_sekolah: '',
    nip_kepala_sekolah: '',
    denda_per_hari: '1000',
    max_pinjam_buku: '3',
    max_hari_pinjam_buku: '7',
    max_pinjam_barang: '2',
    max_hari_pinjam_barang: '3',
  });

  useEffect(() => {
    async function fetchSettings() {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setForm(prev => ({ ...prev, ...data }));
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      toast('success', 'Settings berhasil disimpan');
    } else {
      toast('error', 'Gagal menyimpan settings');
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Settings size={28} className="text-secondary-700" />
        <h1 className="text-2xl font-bold text-secondary-900">Pengaturan</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* Informasi Sekolah */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-secondary-800 mb-4">Informasi Sekolah</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nama Sekolah"
              value={form.nama_sekolah}
              onChange={(e) => setForm({ ...form, nama_sekolah: e.target.value })}
              placeholder="Nama sekolah"
            />
            <Input
              label="Telepon"
              value={form.telepon_sekolah}
              onChange={(e) => setForm({ ...form, telepon_sekolah: e.target.value })}
              placeholder="No. telepon"
            />
            <Input
              label="Email"
              type="email"
              value={form.email_sekolah}
              onChange={(e) => setForm({ ...form, email_sekolah: e.target.value })}
              placeholder="Email sekolah"
            />
            <Input
              label="Kepala Sekolah"
              value={form.kepala_sekolah}
              onChange={(e) => setForm({ ...form, kepala_sekolah: e.target.value })}
              placeholder="Nama kepala sekolah"
            />
            <Input
              label="NIP Kepala Sekolah"
              value={form.nip_kepala_sekolah}
              onChange={(e) => setForm({ ...form, nip_kepala_sekolah: e.target.value })}
              placeholder="NIP"
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-secondary-700 mb-1">Alamat Sekolah</label>
            <textarea
              value={form.alamat_sekolah}
              onChange={(e) => setForm({ ...form, alamat_sekolah: e.target.value })}
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
              placeholder="Alamat lengkap sekolah"
            />
          </div>
        </Card>

        {/* Pengaturan Perpustakaan */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-secondary-800 mb-4">Pengaturan Perpustakaan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Denda per Hari (Rp)"
              type="number"
              value={form.denda_per_hari}
              onChange={(e) => setForm({ ...form, denda_per_hari: e.target.value })}
            />
            <Input
              label="Maks. Pinjam Buku"
              type="number"
              value={form.max_pinjam_buku}
              onChange={(e) => setForm({ ...form, max_pinjam_buku: e.target.value })}
            />
            <Input
              label="Maks. Hari Pinjam Buku"
              type="number"
              value={form.max_hari_pinjam_buku}
              onChange={(e) => setForm({ ...form, max_hari_pinjam_buku: e.target.value })}
            />
          </div>
        </Card>

        {/* Pengaturan Sarpras */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-secondary-800 mb-4">Pengaturan Sarpras</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Maks. Pinjam Barang"
              type="number"
              value={form.max_pinjam_barang}
              onChange={(e) => setForm({ ...form, max_pinjam_barang: e.target.value })}
            />
            <Input
              label="Maks. Hari Pinjam Barang"
              type="number"
              value={form.max_hari_pinjam_barang}
              onChange={(e) => setForm({ ...form, max_hari_pinjam_barang: e.target.value })}
            />
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={saving}>
            <Save size={16} className="mr-2" /> Simpan Pengaturan
          </Button>
        </div>
      </form>
    </div>
  );
}
