'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { toast } from '@/components/ui/Toast';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nama: '',
    email: '',
    password: '',
    role: 'sarpras',
    is_active: true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nama || !form.email || !form.password) {
      toast('error', 'Lengkapi semua field wajib');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      toast('success', 'User berhasil ditambahkan');
      router.push('/admin/users');
    } else {
      const err = await res.json();
      toast('error', err.error || 'Gagal menambahkan user');
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/users">
          <button className="p-2 rounded-lg hover:bg-secondary-100"><ArrowLeft size={20} /></button>
        </Link>
        <h1 className="text-2xl font-bold text-secondary-900">Tambah User</h1>
      </div>

      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Lengkap *"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            placeholder="Masukkan nama lengkap"
          />
          <Input
            label="Email *"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Masukkan email"
          />
          <Input
            label="Password *"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Masukkan password"
          />
          <Select
            label="Role *"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            options={[
              { value: 'admin', label: 'Admin' },
              { value: 'sarpras', label: 'Petugas Sarpras' },
              { value: 'perpus', label: 'Petugas Perpustakaan' },
              { value: 'kepala_sekolah', label: 'Kepala Sekolah' },
            ]}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="rounded border-secondary-300"
            />
            <label htmlFor="is_active" className="text-sm text-secondary-700">Aktif</label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={loading}>
              <Save size={16} className="mr-2" /> Simpan
            </Button>
            <Link href="/admin/users">
              <Button variant="secondary">Batal</Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
