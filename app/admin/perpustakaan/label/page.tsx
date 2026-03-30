'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SearchFilter from '@/components/ui/SearchFilter';
import EmptyState from '@/components/ui/EmptyState';
import { toast } from '@/components/ui/Toast';
import { Printer, Download, Tag } from 'lucide-react';

interface BukuLabel {
  id: number;
  kode_buku: string;
  judul: string;
  pengarang: string | null;
  isbn: string | null;
  rak_kode: string | null;
  rak_nama: string | null;
  kategori_nama: string | null;
}

export default function LabelBukuPage() {
  const [items, setItems] = useState<BukuLabel[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [kategori, setKategori] = useState('');
  const [filters, setFilters] = useState<{ kategoriList: any[] }>({ kategoriList: [] });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ search, kategori });
    const res = await fetch(`/api/perpustakaan/buku/label?${params}`);
    const json = await res.json();
    setItems(json.data || []);
    setFilters(json.filters || { kategoriList: [] });
    setLoading(false);
  }, [search, kategori]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function toggleSelect(id: number) {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  function selectAll() {
    if (selected.length === items.length) {
      setSelected([]);
    } else {
      setSelected(items.map(i => i.id));
    }
  }

  async function generatePDF() {
    if (selected.length === 0) {
      toast('error', 'Pilih minimal 1 buku');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch(`/api/perpustakaan/buku/label?ids=${selected.join(',')}`);
      const json = await res.json();
      const selectedItems: BukuLabel[] = json.data;

      const { jsPDF } = await import('jspdf');
      const QRCode = (await import('qrcode')).default;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const baseUrl = window.location.origin;

      const labelWidth = 62;
      const labelHeight = 30;
      const marginX = 10;
      const marginY = 10;
      const gapX = 3;
      const gapY = 3;
      const cols = 3;
      const rowsPerPage = 8;
      const qrSize = 18;

      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        const pageIndex = Math.floor(i / (cols * rowsPerPage));
        const indexOnPage = i % (cols * rowsPerPage);
        const col = indexOnPage % cols;
        const row = Math.floor(indexOnPage / cols);

        if (pageIndex > 0 && indexOnPage === 0) {
          doc.addPage();
        }

        const x = marginX + col * (labelWidth + gapX);
        const y = marginY + row * (labelHeight + gapY);

        // Border with rounded corners
        doc.setDrawColor(180);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, labelWidth, labelHeight, 2, 2);

        // Text area (left side)
        const textX = x + 3;
        const textMaxW = labelWidth - qrSize - 8;

        // Kode buku
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(item.kode_buku, textX, y + 7);

        // Judul (wrap if needed)
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        const judulLines = doc.splitTextToSize(item.judul, textMaxW);
        doc.text(judulLines.slice(0, 2), textX, y + 12);

        // Rak info
        if (item.rak_kode) {
          doc.setFontSize(5.5);
          doc.setTextColor(100);
          doc.text(`Rak: ${item.rak_kode}`, textX, y + 21);
          doc.setTextColor(0);
        }

        // ISBN
        if (item.isbn) {
          doc.setFontSize(5);
          doc.setTextColor(120);
          doc.text(`ISBN: ${item.isbn}`, textX, y + 25);
          doc.setTextColor(0);
        }

        // QR Code (right side)
        try {
          const qrUrl = `${baseUrl}/admin/perpustakaan/buku/${item.id}`;
          const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 256, margin: 0 });
          doc.addImage(qrDataUrl, 'PNG', x + labelWidth - qrSize - 3, y + (labelHeight - qrSize) / 2, qrSize, qrSize);
        } catch {
          doc.setFontSize(5);
          doc.text('QR Error', x + labelWidth - qrSize / 2 - 3, y + labelHeight / 2, { align: 'center' });
        }
      }

      doc.save('label-buku-perpustakaan.pdf');
      toast('success', `${selectedItems.length} label berhasil di-generate`);
    } catch (err) {
      console.error(err);
      toast('error', 'Gagal generate PDF');
    }
    setGenerating(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Label QR Code Buku</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={generatePDF} disabled={selected.length === 0 || generating}>
            <Printer size={16} className="mr-2" /> Print Label
          </Button>
          <Button onClick={generatePDF} disabled={selected.length === 0} loading={generating}>
            <Download size={16} className="mr-2" /> Download PDF
          </Button>
        </div>
      </div>

      <Card className="p-5">
        <div className="mb-4">
          <SearchFilter
            search={search}
            onSearchChange={setSearch}
            placeholder="Cari judul, kode, atau ISBN..."
            filters={[
              {
                label: 'Semua Kategori',
                value: kategori,
                onChange: setKategori,
                options: (filters.kategoriList || []).map((k: any) => ({ value: String(k.id), label: k.nama })),
              },
            ]}
          />
        </div>

        {selected.length > 0 && (
          <div className="mb-4 p-3 bg-primary-50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-primary-700 font-medium">
              <Tag size={14} className="inline mr-1" /> {selected.length} buku dipilih
            </span>
            <button onClick={() => setSelected([])} className="text-sm text-primary-600 hover:underline">
              Batal pilih
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState description="Belum ada data buku." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-secondary-200">
                  <th className="py-3 px-4 text-left">
                    <input
                      type="checkbox"
                      checked={selected.length === items.length && items.length > 0}
                      onChange={selectAll}
                      className="rounded border-secondary-300"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-500">Kode</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-500">Judul</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-500">Pengarang</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-500">Kategori</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-500">Rak</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-500">ISBN</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className={`border-b border-secondary-100 hover:bg-secondary-50 cursor-pointer ${selected.includes(item.id) ? 'bg-primary-50' : ''}`} onClick={() => toggleSelect(item.id)}>
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selected.includes(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="rounded border-secondary-300"
                      />
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{item.kode_buku}</td>
                    <td className="py-3 px-4 font-medium">{item.judul}</td>
                    <td className="py-3 px-4 text-secondary-600">{item.pengarang || '-'}</td>
                    <td className="py-3 px-4 text-secondary-600">{item.kategori_nama || '-'}</td>
                    <td className="py-3 px-4 text-secondary-600">{item.rak_kode || '-'}</td>
                    <td className="py-3 px-4 text-secondary-600 font-mono text-xs">{item.isbn || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div ref={printRef} className="hidden" />
    </div>
  );
}
