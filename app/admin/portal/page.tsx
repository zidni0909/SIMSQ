'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

function SarprasIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Gear outer */}
      <path d="M32 8C30.5 8 29.2 9.1 29 10.6L28.4 14.2C27 14.7 25.7 15.4 24.5 16.2L21.2 14.8C19.8 14.2 18.2 14.7 17.4 15.9L13.4 22.8C12.7 24 12.9 25.6 14 26.5L16.8 28.7C16.7 29.5 16.6 30.2 16.6 31C16.6 31.8 16.7 32.5 16.8 33.3L14 35.5C12.9 36.4 12.7 38 13.4 39.2L17.4 46.1C18.2 47.3 19.8 47.8 21.2 47.2L24.5 45.8C25.7 46.6 27 47.3 28.4 47.8L29 51.4C29.2 52.9 30.5 54 32 54C33.5 54 34.8 52.9 35 51.4L35.6 47.8C37 47.3 38.3 46.6 39.5 45.8L42.8 47.2C44.2 47.8 45.8 47.3 46.6 46.1L50.6 39.2C51.3 38 51.1 36.4 50 35.5L47.2 33.3C47.3 32.5 47.4 31.8 47.4 31C47.4 30.2 47.3 29.5 47.2 28.7L50 26.5C51.1 25.6 51.3 24 50.6 22.8L46.6 15.9C45.8 14.7 44.2 14.2 42.8 14.8L39.5 16.2C38.3 15.4 37 14.7 35.6 14.2L35 10.6C34.8 9.1 33.5 8 32 8Z"
        fill="#2563EB" />
      {/* Gear inner circle */}
      <circle cx="32" cy="31" r="9" fill="white" />
      {/* Leaf */}
      <path d="M28 27C28 27 32 23 38 23C38 29 34 33 28 33C28 33 28 29 30 27" fill="#22C55E" stroke="#16A34A" strokeWidth="1.5" />
    </svg>
  );
}

function PerpusIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Open book left */}
      <path d="M12 18C12 16 14 14 16 14H28C30 14 32 16 32 18V48C32 46 30 44 28 44H16C14 44 12 42 12 40V18Z"
        fill="#F97316" opacity="0.9" />
      {/* Open book right */}
      <path d="M52 18C52 16 50 14 48 14H36C34 14 32 16 32 18V48C32 46 34 44 36 44H48C50 44 52 42 52 40V18Z"
        fill="#EA580C" opacity="0.9" />
      {/* Book spine line */}
      <line x1="32" y1="16" x2="32" y2="48" stroke="#C2410C" strokeWidth="1.5" />
      {/* Page lines left */}
      <line x1="17" y1="22" x2="27" y2="22" stroke="white" strokeWidth="1.5" opacity="0.6" />
      <line x1="17" y1="27" x2="27" y2="27" stroke="white" strokeWidth="1.5" opacity="0.6" />
      <line x1="17" y1="32" x2="27" y2="32" stroke="white" strokeWidth="1.5" opacity="0.6" />
      {/* Page lines right */}
      <line x1="37" y1="22" x2="47" y2="22" stroke="white" strokeWidth="1.5" opacity="0.6" />
      <line x1="37" y1="27" x2="47" y2="27" stroke="white" strokeWidth="1.5" opacity="0.6" />
      <line x1="37" y1="32" x2="47" y2="32" stroke="white" strokeWidth="1.5" opacity="0.6" />
    </svg>
  );
}

interface AppCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  roles: string[];
}

const apps: AppCard[] = [
  {
    title: 'E-Sarpras',
    description: 'Sistem Manajemen Sarana dan Prasarana',
    icon: <SarprasIcon />,
    href: '/admin/sarpras/dashboard',
    roles: ['admin', 'sarpras'],
  },
  {
    title: 'E-Perpus',
    description: 'Sistem Manajemen Perpustakaan',
    icon: <PerpusIcon />,
    href: '/admin/perpustakaan/dashboard',
    roles: ['admin', 'perpus'],
  },
];

export default function PortalPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const userRole = session?.user?.role || '';

  // Kepala sekolah goes directly to dashboard
  if (userRole === 'kepala_sekolah') {
    router.push('/admin/dashboard');
    return null;
  }

  // Single-role users go directly to their module
  if (userRole === 'sarpras') {
    router.push('/admin/sarpras/dashboard');
    return null;
  }
  if (userRole === 'perpus') {
    router.push('/admin/perpustakaan/dashboard');
    return null;
  }

  const filteredApps = apps.filter((app) => app.roles.includes(userRole));

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="flex flex-wrap justify-center gap-8 px-4">
        {filteredApps.map((app) => (
          <button
            key={app.href}
            onClick={() => router.push(app.href)}
            className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 p-8 w-[300px] flex items-start gap-5 text-left"
          >
            <div className="flex-shrink-0">{app.icon}</div>
            <div>
              <h3 className="font-bold text-secondary-800 text-xl">{app.title}</h3>
              <p className="text-secondary-500 text-sm mt-1 leading-relaxed">{app.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
