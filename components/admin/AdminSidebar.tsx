'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  BookOpen,
  FileText,
  Users,
  Settings,
  ClipboardList,
  Wrench,
  Tag,
  BookMarked,
  UserCheck,
  BookCopy,
  Bookmark,
  ScrollText,
  MapPin,
  CreditCard,
  HardDrive,
  Home,
  X,
} from 'lucide-react';

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const sarprasMenu: MenuItem[] = [
  { label: 'Dashboard Sarpras', href: '/admin/sarpras/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Data Barang', href: '/admin/sarpras/barang', icon: <ClipboardList size={18} /> },
  { label: 'Ruangan', href: '/admin/sarpras/ruangan', icon: <MapPin size={18} /> },
  { label: 'Peminjaman Barang', href: '/admin/sarpras/peminjaman', icon: <BookCopy size={18} /> },
  { label: 'Perawatan Barang', href: '/admin/sarpras/perawatan', icon: <Wrench size={18} /> },
  { label: 'Label QR Barang', href: '/admin/sarpras/label', icon: <Tag size={18} /> },
  { label: 'Laporan Sarpras', href: '/admin/sarpras/laporan', icon: <FileText size={18} /> },
];

const perpusMenu: MenuItem[] = [
  { label: 'Dashboard Perpus', href: '/admin/perpustakaan/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Data Buku', href: '/admin/perpustakaan/buku', icon: <BookMarked size={18} /> },
  { label: 'Anggota', href: '/admin/perpustakaan/anggota', icon: <UserCheck size={18} /> },
  { label: 'Peminjaman Buku', href: '/admin/perpustakaan/peminjaman', icon: <BookCopy size={18} /> },
  { label: 'Kartu Anggota', href: '/admin/perpustakaan/kartu', icon: <CreditCard size={18} /> },
  { label: 'Label Buku', href: '/admin/perpustakaan/label', icon: <Bookmark size={18} /> },
  { label: 'Laporan Perpustakaan', href: '/admin/perpustakaan/laporan', icon: <FileText size={18} /> },
];

const adminMenu: MenuItem[] = [
  { label: 'User Management', href: '/admin/users', icon: <Users size={18} /> },
  { label: 'Backup Data', href: '/admin/backup', icon: <HardDrive size={18} /> },
  { label: 'Settings', href: '/admin/settings', icon: <Settings size={18} /> },
  { label: 'Audit Log', href: '/admin/audit-log', icon: <ScrollText size={18} /> },
];

const kepsekMenu: MenuItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Laporan Sarpras', href: '/admin/sarpras/laporan', icon: <Package size={18} /> },
  { label: 'Laporan Perpustakaan', href: '/admin/perpustakaan/laporan', icon: <BookOpen size={18} /> },
];

function getContext(pathname: string): 'sarpras' | 'perpus' | 'admin' {
  if (pathname.startsWith('/admin/sarpras')) return 'sarpras';
  if (pathname.startsWith('/admin/perpustakaan')) return 'perpus';
  return 'admin';
}

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role || '';
  const context = getContext(pathname);

  let menuItems: MenuItem[] = [];
  let sidebarTitle = 'SIM-SQ';
  let sidebarSubtitle = 'Manajemen Sekolah';

  if (userRole === 'kepala_sekolah') {
    menuItems = kepsekMenu;
    sidebarSubtitle = 'Kepala Sekolah';
  } else if (context === 'sarpras') {
    menuItems = sarprasMenu;
    sidebarTitle = 'E-SARPRAS';
    sidebarSubtitle = 'Sarana & Prasarana';
  } else if (context === 'perpus') {
    menuItems = perpusMenu;
    sidebarTitle = 'E-PERPUS';
    sidebarSubtitle = 'Perpustakaan';
  } else {
    if (userRole === 'admin') {
      menuItems = [
        { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
        ...adminMenu,
      ];
      sidebarSubtitle = 'Admin Panel';
    } else if (userRole === 'sarpras') {
      menuItems = sarprasMenu;
      sidebarTitle = 'E-SARPRAS';
      sidebarSubtitle = 'Sarana & Prasarana';
    } else if (userRole === 'perpus') {
      menuItems = perpusMenu;
      sidebarTitle = 'E-PERPUS';
      sidebarSubtitle = 'Perpustakaan';
    }
  }

  const showAdminBottom = userRole === 'admin' && (context === 'sarpras' || context === 'perpus');

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside className={`fixed left-0 top-0 z-50 h-screen w-64 bg-white border-r border-secondary-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-secondary-200">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              context === 'sarpras' ? 'bg-emerald-600' : context === 'perpus' ? 'bg-purple-600' : 'bg-primary-600'
            }`}>
              <span className="text-white font-bold text-sm">
                {context === 'sarpras' ? 'SP' : context === 'perpus' ? 'PU' : 'SQ'}
              </span>
            </div>
            <div>
              <h1 className="font-bold text-secondary-900 text-sm">{sidebarTitle}</h1>
              <p className="text-[10px] text-secondary-500">{sidebarSubtitle}</p>
            </div>
          </div>
          {/* Close button on mobile */}
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-secondary-100 text-secondary-400">
            <X size={20} />
          </button>
        </div>

        <div className="px-3 pt-3 pb-1">
          <Link
            href="/admin/portal"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-secondary-500 hover:bg-secondary-50 hover:text-secondary-700"
          >
            <Home size={16} />
            <span>Kembali ke Portal</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-3">
          <div className="space-y-0.5">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                    isActive
                      ? 'text-primary-700 bg-primary-50 font-medium'
                      : 'text-secondary-600 hover:bg-secondary-50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {showAdminBottom && (
            <>
              <div className="border-t border-secondary-200 my-3" />
              <p className="px-3 text-[10px] font-semibold text-secondary-400 uppercase tracking-wider mb-1">Admin</p>
              <div className="space-y-0.5">
                {adminMenu.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                        isActive
                          ? 'text-primary-700 bg-primary-50 font-medium'
                          : 'text-secondary-600 hover:bg-secondary-50'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </nav>
      </aside>
    </>
  );
}
