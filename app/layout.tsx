'use client';

import './globals.css';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-plus-jakarta',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={plusJakarta.variable}>
      <head>
        <title>SIMSQ - Sistem Informasi Manajemen SekolahSQ</title>
        <meta name="description" content="Sistem Informasi Manajemen Sekolah - Sarpras & Perpustakaan" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className={plusJakarta.className}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
