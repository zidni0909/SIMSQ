'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { toast } from '@/components/ui/Toast';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({
    nama: '',
    email: '',
    password: '',
    role: 'sarpras',
    is_active: true,
  });

  useEffect(() => {
    async function fetchUser() {
      const res = await fetch(`/api/users/${params.id}`);
      if (res.ok) {
        const user = await res.json();
        setForm({
          nama: user.nama,
          email: user.email,
          password: '',
          role: user.role,
          is_active: user.is_active,
        });
      } else {
        toast('error', 'User tidak ditemukan');
        router.push('/admin/users');
      }
      setFetching(false);
    }
    fetchUser();
  }, [params.id, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nama || !form.email) {
      toast('error', 'Lengkapi semua field wajib');
      return;
    }

    setLoading(true);
    const payload: Record<string, unknown> = { ...form };
    if (!form.password) delete payload.password;

    const res = await fetch(`/api/users/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast('success', 'User berhasil diperbarui');
      router.push('/admin/users');
    } else {
      const err = await res.json();
      toast('error', err.error || 'Gagal memperbarui user');
    }
    setLoading(false);
  }

  if (fetching) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/users">
          <button className="p-2 rounded-lg hover:bg-secondary-100"><ArrowLeft size={20} /></button>
        </Link>
        <h1 className="text-2xl font-bold text-secondary-900">Edit User</h1>
      </div>

      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Lengkap *"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
          />
          <Input
            label="Email *"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Password (kosongkan jika tidak diubah)"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Kosongkan jika tidak diubah"
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
