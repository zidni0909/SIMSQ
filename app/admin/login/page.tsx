'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Email atau password salah');
    } else {
      router.push('/admin/portal');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <div className="w-full max-w-md px-4">
        <div className="bg-white rounded-2xl shadow-soft-lg p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <img src="/logo-sekolahsq.png" alt="SekolahSQ" className="h-20 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-secondary-900">SIMSQ</h1>
            <p className="text-sm text-secondary-500 mt-1">Sistem Informasi Manajemen Sekolah</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Input
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukan Email"
              required
            />

            <Input
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
            />

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Masuk
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-secondary-400 mt-6">
          SIMSQ - Sistem Informasi Manajemen SekolahSQ
        </p>
      </div>
    </div>
  );
}
