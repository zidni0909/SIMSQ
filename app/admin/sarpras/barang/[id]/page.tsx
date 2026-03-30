'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import { ArrowLeft, Edit, Package, MapPin, User, Phone, Briefcase, Calendar, Wrench, BookCopy } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/format';

const kondisiLabel: Record<string, { text: string; color: string }> = {
  baik: { text: 'Baik', color: 'bg-green-100 text-green-700' },
  rusak_ringan: { text: 'Rusak Ringan', color: 'bg-yellow-100 text-yellow-700' },
  rusak_berat: { text: 'Rusak Berat', color: 'bg-red-100 text-red-700' },
  hilang: { text: 'Hilang', color: 'bg-secondary-100 text-secondary-700' },
};

const statusLabel: Record<string, { text: string; color: string }> = {
  tersedia: { text: 'Tersedia', color: 'bg-green-100 text-green-700' },
  dipinjam: { text: 'Dipinjam', color: 'bg-blue-100 text-blue-700' },
  dalam_perawatan: { text: 'Dalam Perawatan', color: 'bg-yellow-100 text-yellow-700' },
  dihapuskan: { text: 'Dihapuskan', color: 'bg-red-100 text-red-700' },
};

export default function DetailBarangPage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/sarpras/barang/${params.id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  if (!data) return <div className="text-center py-12 text-secondary-500">Barang tidak ditemukan</div>;

  const kondisi = kondisiLabel[data.kondisi] || { text: data.kondisi, color: 'bg-secondary-100 text-secondary-700' };
  const status = statusLabel[data.status] || { text: data.status, color: 'bg-secondary-100 text-secondary-700' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/sarpras/barang"><button className="p-2 rounded-lg hover:bg-secondary-100"><ArrowLeft size={20} /></button></Link>
          <h1 className="text-2xl font-bold text-secondary-900">Detail Barang</h1>
        </div>
        <Link href={`/admin/sarpras/barang/${params.id}/edit`}>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
            <Edit size={16} /> Edit
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Foto + Info Utama */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-5">
            {data.foto_url ? (
              <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-4">
                <Image src={data.foto_url} alt={data.nama} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-full aspect-square rounded-lg bg-secondary-100 flex items-center justify-center mb-4">
                <Package size={48} className="text-secondary-300" />
              </div>
            )}
            <h2 className="font-bold text-lg text-secondary-900">{data.nama}</h2>
            <p className="text-sm text-secondary-500 font-mono mt-1">{data.kode_barang}</p>
            <div className="flex gap-2 mt-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${kondisi.color}`}>{kondisi.text}</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>{status.text}</span>
            </div>
          </Card>

          {/* Penanggung Jawab */}
          {data.penanggung_jawab && (
            <Card className="p-5">
              <h3 className="font-semibold text-secondary-900 mb-3 flex items-center gap-2"><User size={16} /> Penanggung Jawab</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><User size={14} className="text-secondary-400" /><span>{data.penanggung_jawab}</span></div>
                {data.jabatan_pj && <div className="flex items-center gap-2"><Briefcase size={14} className="text-secondary-400" /><span>{data.jabatan_pj}</span></div>}
                {data.kontak_pj && <div className="flex items-center gap-2"><Phone size={14} className="text-secondary-400" /><span>{data.kontak_pj}</span></div>}
              </div>
            </Card>
          )}
        </div>

        {/* Right: Detail Info + History */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5">
            <h3 className="font-semibold text-secondary-900 mb-4">Informasi Detail</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <InfoRow label="Kategori" value={data.kategori_nama || '-'} />
              <InfoRow label="Lokasi" value={data.lokasi_nama || '-'} icon={<MapPin size={14} />} />
              <InfoRow label="Merk" value={data.merk || '-'} />
              <InfoRow label="Tahun Pengadaan" value={data.tahun_pengadaan || '-'} icon={<Calendar size={14} />} />
              <InfoRow label="Sumber Dana" value={data.sumber_dana || '-'} />
              <InfoRow label="Harga Perolehan" value={formatCurrency(data.harga_perolehan || 0)} />
              <InfoRow label="Jumlah" value={data.jumlah} />
              <InfoRow label="Tanggal Input" value={data.created_at ? formatDate(data.created_at) : '-'} />
            </div>
            {data.keterangan && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-secondary-500 font-medium mb-1">Keterangan</p>
                <p className="text-sm text-secondary-700">{data.keterangan}</p>
              </div>
            )}
          </Card>

          {/* Riwayat Peminjaman */}
          <Card className="p-5">
            <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2"><BookCopy size={16} /> Riwayat Peminjaman</h3>
            {data.peminjaman?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 px-3 font-medium text-secondary-500">Kode</th>
                      <th className="py-2 px-3 font-medium text-secondary-500">Peminjam</th>
                      <th className="py-2 px-3 font-medium text-secondary-500">Tanggal Pinjam</th>
                      <th className="py-2 px-3 font-medium text-secondary-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.peminjaman.map((p: any) => (
                      <tr key={p.id} className="border-b border-secondary-100">
                        <td className="py-2 px-3 font-mono text-xs">{p.kode_peminjaman}</td>
                        <td className="py-2 px-3">{p.peminjam}</td>
                        <td className="py-2 px-3">{formatDate(p.tanggal_pinjam)}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'dikembalikan' ? 'bg-green-100 text-green-700' : p.status === 'terlambat' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-secondary-400">Belum ada riwayat peminjaman</p>
            )}
          </Card>

          {/* Riwayat Perawatan */}
          <Card className="p-5">
            <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2"><Wrench size={16} /> Riwayat Perawatan</h3>
            {data.perawatan?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 px-3 font-medium text-secondary-500">Tanggal</th>
                      <th className="py-2 px-3 font-medium text-secondary-500">Jenis</th>
                      <th className="py-2 px-3 font-medium text-secondary-500">Deskripsi</th>
                      <th className="py-2 px-3 font-medium text-secondary-500">Hasil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.perawatan.map((p: any) => (
                      <tr key={p.id} className="border-b border-secondary-100">
                        <td className="py-2 px-3">{formatDate(p.tanggal_perawatan)}</td>
                        <td className="py-2 px-3 capitalize">{p.jenis_perawatan?.replace(/_/g, ' ')}</td>
                        <td className="py-2 px-3 max-w-[200px] truncate">{p.deskripsi || '-'}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.hasil === 'selesai' ? 'bg-green-100 text-green-700' : p.hasil === 'dalam_proses' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {p.hasil?.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-secondary-400">Belum ada riwayat perawatan</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-secondary-500 text-xs mb-0.5">{label}</p>
      <p className="text-secondary-900 font-medium flex items-center gap-1">
        {icon && <span className="text-secondary-400">{icon}</span>}
        {value}
      </p>
    </div>
  );
}
