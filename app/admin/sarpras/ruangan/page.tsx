'use client';

import { useEffect, useState, useCallback } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import SearchFilter from '@/components/ui/SearchFilter';
import EmptyState from '@/components/ui/EmptyState';
import { toast } from '@/components/ui/Toast';
import { Plus, Edit2, Trash2, MapPin } from 'lucide-react';

interface Ruangan {
  id: number;
  nama: string;
  keterangan: string | null;
  jumlah_barang: number;
}

export default function RuanganPage() {
  const [items, setItems] = useState<Ruangan[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Ruangan | null>(null);
  const [form, setForm] = useState({ nama: '', keterangan: '' });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '10', search });
    const res = await fetch(`/api/sarpras/ruangan?${params}`);
    const json = await res.json();
    setItems(json.data || []);
    setTotal(json.total || 0);
    setTotalPages(json.totalPages || 1);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openAdd() {
    setEditItem(null);
    setForm({ nama: '', keterangan: '' });
    setShowModal(true);
  }

  function openEdit(item: Ruangan) {
    setEditItem(item);
    setForm({ nama: item.nama, keterangan: item.keterangan || '' });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.nama) { toast('error', 'Nama ruangan wajib diisi'); return; }
    setSaving(true);
    const url = editItem ? `/api/sarpras/ruangan/${editItem.id}` : '/api/sarpras/ruangan';
    const method = editItem ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setSaving(false);
    if (res.ok) {
      toast('success', editItem ? 'Ruangan berhasil diupdate' : 'Ruangan berhasil ditambahkan');
      setShowModal(false);
      fetchData();
    } else {
      const err = await res.json();
      toast('error', err.error || 'Gagal menyimpan');
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    const res = await fetch(`/api/sarpras/ruangan/${deleteId}`, { method: 'DELETE' });
    if (res.ok) {
      toast('success', 'Ruangan berhasil dihapus');
      setDeleteId(null);
      fetchData();
    } else {
      const err = await res.json();
      toast('error', err.error || 'Gagal menghapus');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Manajemen Ruangan</h1>
        <Button onClick={openAdd}><Plus size={16} className="mr-2" /> Tambah Ruangan</Button>
      </div>

      <Card className="p-5">
        <div className="mb-4">
          <SearchFilter search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} placeholder="Cari ruangan..." />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
        ) : items.length === 0 ? (
          <EmptyState description="Belum ada data ruangan." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-secondary-200">
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Nama Ruangan</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-500">Keterangan</th>
                    <th className="text-center py-3 px-4 font-medium text-secondary-500">Jumlah Barang</th>
                    <th className="text-right py-3 px-4 font-medium text-secondary-500">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                      <td className="py-3 px-4 font-medium flex items-center gap-2"><MapPin size={14} className="text-secondary-400" /> {item.nama}</td>
                      <td className="py-3 px-4 text-secondary-600">{item.keterangan || '-'}</td>
                      <td className="py-3 px-4 text-center">{item.jumlah_barang}</td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-secondary-100 text-secondary-600"><Edit2 size={15} /></button>
                        <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500 ml-1"><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
          </>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Ruangan' : 'Tambah Ruangan'}>
        <div className="space-y-4">
          <Input id="nama" label="Nama Ruangan *" value={form.nama} onChange={e => setForm(p => ({ ...p, nama: e.target.value }))} required />
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Keterangan</label>
            <textarea className="w-full px-3 py-2 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" rows={3} value={form.keterangan} onChange={e => setForm(p => ({ ...p, keterangan: e.target.value }))} />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
            <Button onClick={handleSave} loading={saving}>Simpan</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Hapus Ruangan">
        <p className="text-sm text-secondary-600 mb-4">Apakah Anda yakin ingin menghapus ruangan ini?</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Batal</Button>
          <Button variant="danger" onClick={handleDelete}>Hapus</Button>
        </div>
      </Modal>
    </div>
  );
}
