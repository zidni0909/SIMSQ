'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { LogOut, User, Bell, KeyRound, ChevronDown, Menu } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';

interface AdminHeaderProps {
  onMenuToggle: () => void;
}

export default function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetch('/api/denda/calculate', { method: 'POST' }).catch(() => {});
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data || []);
        setUnread(data.unread || 0);
      }
    } catch {}
  }

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mark_all_read: true }),
    });
    setUnread(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }

  async function changePassword() {
    if (!passwords.current || !passwords.newPass) { toast('error', 'Isi semua field'); return; }
    if (passwords.newPass !== passwords.confirm) { toast('error', 'Password baru tidak cocok'); return; }
    if (passwords.newPass.length < 6) { toast('error', 'Password minimal 6 karakter'); return; }

    setSaving(true);
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPass }),
    });
    setSaving(false);

    if (res.ok) {
      toast('success', 'Password berhasil diubah');
      setShowPassword(false);
      setPasswords({ current: '', newPass: '', confirm: '' });
    } else {
      const err = await res.json();
      toast('error', err.error || 'Gagal mengubah password');
    }
  }

  const typeColors: Record<string, string> = {
    keterlambatan_buku: 'text-red-600 bg-red-50',
    keterlambatan_barang: 'text-orange-600 bg-orange-50',
    stok_minimum: 'text-yellow-600 bg-yellow-50',
    perawatan_jadwal: 'text-blue-600 bg-blue-50',
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-secondary-200 flex items-center justify-between px-4 sm:px-6">
        {/* Left: hamburger on mobile */}
        <button onClick={onMenuToggle} className="lg:hidden p-2 rounded-lg hover:bg-secondary-100 text-secondary-500">
          <Menu size={20} />
        </button>
        <div className="hidden lg:block" />

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notifications */}
          <div className="relative">
            <button onClick={() => setShowNotif(!showNotif)} className="p-2 rounded-lg hover:bg-secondary-100 text-secondary-500 relative">
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {showNotif && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
                <div className="fixed sm:absolute right-2 sm:right-0 left-2 sm:left-auto top-16 sm:top-12 z-50 sm:w-80 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-96 overflow-hidden">
                  <div className="flex items-center justify-between p-3 border-b border-secondary-100">
                    <span className="text-sm font-semibold text-secondary-900">Notifikasi</span>
                    {unread > 0 && <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline">Tandai semua dibaca</button>}
                  </div>
                  <div className="overflow-y-auto max-h-72">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-secondary-400 text-center py-8">Tidak ada notifikasi</p>
                    ) : notifications.slice(0, 20).map(notif => (
                      <div key={notif.id} className={`px-3 py-2.5 border-b border-secondary-50 ${!notif.is_read ? 'bg-primary-50/50' : ''}`}>
                        <div className="flex items-start gap-2">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${typeColors[notif.type] || 'text-secondary-600 bg-secondary-50'}`}>
                            {notif.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-secondary-800 mt-1">{notif.title}</p>
                        <p className="text-xs text-secondary-500 mt-0.5">{notif.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile dropdown */}
          <div className="relative">
            <button onClick={() => setShowProfile(!showProfile)} className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-secondary-50 transition-colors">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <User size={16} className="text-primary-600" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-secondary-900">{session?.user?.name}</p>
                <StatusBadge status={session?.user?.role || ''} />
              </div>
              <ChevronDown size={14} className="text-secondary-400 hidden sm:block" />
            </button>

            {showProfile && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
                <div className="absolute right-0 top-12 z-50 w-48 bg-white border border-secondary-200 rounded-lg shadow-lg py-1">
                  {/* Show name on mobile */}
                  <div className="sm:hidden px-4 py-2 border-b border-secondary-100">
                    <p className="text-sm font-medium text-secondary-900">{session?.user?.name}</p>
                    <StatusBadge status={session?.user?.role || ''} />
                  </div>
                  <button
                    onClick={() => { setShowProfile(false); setShowPassword(true); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-secondary-700 hover:bg-secondary-50"
                  >
                    <KeyRound size={15} /> Edit Password
                  </button>
                  <div className="border-t border-secondary-100" />
                  <button
                    onClick={() => signOut({ callbackUrl: '/admin/login' })}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      <Modal isOpen={showPassword} onClose={() => setShowPassword(false)} title="Ubah Password">
        <div className="space-y-4">
          <Input id="current" label="Password Saat Ini" type="password" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} />
          <Input id="newPass" label="Password Baru" type="password" value={passwords.newPass} onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))} />
          <Input id="confirm" label="Konfirmasi Password Baru" type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowPassword(false)}>Batal</Button>
            <Button onClick={changePassword} loading={saving}>Simpan</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
