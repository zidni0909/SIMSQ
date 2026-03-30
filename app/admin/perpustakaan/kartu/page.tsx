'use client';

import { useEffect, useState, useCallback } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SearchFilter from '@/components/ui/SearchFilter';
import EmptyState from '@/components/ui/EmptyState';
import { toast } from '@/components/ui/Toast';
import { Printer, Download, Tag, CreditCard } from 'lucide-react';

interface AnggotaKartu {
  id: number;
  kode_anggota: string;
  nama: string;
  jenis: string;
  kelas: string | null;
  foto_url: string | null;
}

export default function KartuAnggotaPage() {
  const [items, setItems] = useState<AnggotaKartu[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [jenis, setJenis] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ search, jenis });
    const res = await fetch(`/api/perpustakaan/anggota/kartu?${params}`);
    const json = await res.json();
    setItems(json.data || []);
    setLoading(false);
  }, [search, jenis]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function toggleSelect(id: number) {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  function selectAll() {
    setSelected(selected.length === items.length ? [] : items.map(i => i.id));
  }

  async function generatePDF() {
    if (selected.length === 0) { toast('error', 'Pilih minimal 1 anggota'); return; }
    setGenerating(true);

    try {
      const res = await fetch(`/api/perpustakaan/anggota/kartu?ids=${selected.join(',')}`);
      const json = await res.json();
      const selectedItems: AnggotaKartu[] = json.data;

      const { jsPDF } = await import('jspdf');
      const QRCode = (await import('qrcode')).default;

      // Card size: 85.6mm x 54mm (credit card)
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const cardW = 85.6;
      const cardH = 54;
      const marginX = 12;
      const marginY = 12;
      const gapX = 6;
      const gapY = 6;
      const cols = 3;
      const rowsPerPage = 3;

      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        const pageIndex = Math.floor(i / (cols * rowsPerPage));
        const indexOnPage = i % (cols * rowsPerPage);
        const col = indexOnPage % cols;
        const row = Math.floor(indexOnPage / cols);

        if (pageIndex > 0 && indexOnPage === 0) doc.addPage();

        const x = marginX + col * (cardW + gapX);
        const y = marginY + row * (cardH + gapY);

        // Card border with rounded corners
        doc.setDrawColor(100);
        doc.setLineWidth(0.4);
        doc.roundedRect(x, y, cardW, cardH, 3, 3);

        // Header bar
        doc.setFillColor(79, 70, 229); // indigo
        doc.rect(x, y, cardW, 14, 'F');

        // Header text
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('PERPUSTAKAAN SEKOLAHSQ', x + cardW / 2, y + 6, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text('KARTU ANGGOTA', x + cardW / 2, y + 11, { align: 'center' });

        // QR Code
        doc.setTextColor(0, 0, 0);
        try {
          const qrDataUrl = await QRCode.toDataURL(item.kode_anggota, { width: 200, margin: 0 });
          doc.addImage(qrDataUrl, 'PNG', x + 5, y + 18, 20, 20);
        } catch {
          doc.setFontSize(6);
          doc.text('QR Error', x + 15, y + 28, { align: 'center' });
        }

        // Info
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(item.nama, x + 30, y + 23);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`ID: ${item.kode_anggota}`, x + 30, y + 28);

        const jenisLabel = item.jenis === 'siswa' ? 'Siswa' : item.jenis === 'guru' ? 'Guru' : 'Karyawan';
        doc.text(`${jenisLabel}${item.kelas ? ` - ${item.kelas}` : ''}`, x + 30, y + 33);

        // Footer line
        doc.setDrawColor(79, 70, 229);
        doc.setLineWidth(0.5);
        doc.line(x + 5, y + cardH - 8, x + cardW - 5, y + cardH - 8);

        doc.setFontSize(6);
        doc.setTextColor(120, 120, 120);
        doc.text('Kartu ini adalah milik perpustakaan SekolahSQ', x + cardW / 2, y + cardH - 4, { align: 'center' });
        doc.setTextColor(0, 0, 0);
      }

      doc.save('kartu-anggota-perpustakaan.pdf');
      toast('success', `${selectedItems.length} kartu berhasil di-generate`);
    } catch (err) {
      console.error(err);
      toast('error', 'Gagal generate PDF');
    }
    setGenerating(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Kartu Anggota</h1>
        <Button onClick={generatePDF} disabled={selected.length === 0} loading={generating}>
          <Download size={16} className="mr-2" /> Download PDF
        </Button>
      </div>

      <Card className="p-5">
        <div className="mb-4">
          <SearchFilter
            search={search}
            onSearchChange={setSearch}
            placeholder="Cari nama atau kode anggota..."
            filters={[
              {
                label: 'Semua Jenis',
                value: jenis,
                onChange: setJenis,
                options: [
                  { value: 'siswa', label: 'Siswa' },
                  { value: 'guru', label: 'Guru' },
                  { value: 'karyawan', label: 'Karyawan' },
                ],
              },
            ]}
          />
        </div>

        {selected.length > 0 && (
          <div className="mb-4 p-3 bg-primary-50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-primary-700 font-medium">
              <CreditCard size={14} className="inline mr-1" /> {selected.length} anggota dipilih
            </span>
            <button onClick={() => setSelected([])} className="text-sm text-primary-600 hover:underline">Batal pilih</button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
        ) : items.length === 0 ? (
          <EmptyState description="Belum ada data anggota." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-secondary-200">
                  <th className="py-3 px-4 text-left">
                    <input type="checkbox" checked={selected.length === items.length && items.length > 0} onChange={selectAll} className="rounded border-secondary-300" />
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-500">Kode</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-500">Nama</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-500">Jenis</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-500">Kelas</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className={`border-b border-secondary-100 hover:bg-secondary-50 cursor-pointer ${selected.includes(item.id) ? 'bg-primary-50' : ''}`} onClick={() => toggleSelect(item.id)}>
                    <td className="py-3 px-4"><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelect(item.id)} className="rounded border-secondary-300" /></td>
                    <td className="py-3 px-4 font-mono text-xs">{item.kode_anggota}</td>
                    <td className="py-3 px-4 font-medium">{item.nama}</td>
                    <td className="py-3 px-4 capitalize">{item.jenis}</td>
                    <td className="py-3 px-4">{item.kelas || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
