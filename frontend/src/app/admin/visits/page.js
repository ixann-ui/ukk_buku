'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import Table from '../../../components/Table';

export default function AdminVisitsPage() {
  const { token, user } = useAuth();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [newVisit, setNewVisit] = useState({ user_id: '', name: '', purpose: '', note: '' });
  const [students, setStudents] = useState([]);

  const fetchAll = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const visRes = await fetch('http://localhost:5000/api/visits', { headers: { Authorization: `Bearer ${token}` } });
      if (!visRes.ok) throw new Error('Gagal mengambil daftar kunjungan');
      const visData = await visRes.json();
      setVisits(visData.visits || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [token, user]);

  // Fetch students when opening the add modal
  useEffect(() => {
    if (!showAdd || !token) return;

    const fetchStudents = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/users?role=student&limit=1000', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Gagal mengambil daftar siswa');
        const data = await res.json();
        setStudents(data.users || []);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Gagal memuat siswa');
      }
    };

    fetchStudents();
  }, [showAdd, token]);

  if (!user || user.role !== 'admin') {
    return <div className="p-6">Hanya admin yang dapat melihat halaman ini.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Daftar Kunjungan & Statistik</h2>

      <div className="flex items-center justify-between">
        <div />
        <button onClick={() => setShowAdd(true)} className="px-3 py-2 text-white bg-green-600 rounded hover:bg-green-700">Tambah Kunjungan</button>
      </div>

      {error && <div className="p-3 text-red-700 bg-red-50 rounded">{error}</div>}

      
      {/* Add Visit Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="w-full max-w-md p-6 bg-white rounded">
            <h3 className="mb-4 text-lg font-medium">Tambah Kunjungan</h3>
            <div className="space-y-3">
              <div>
                <label className="block mb-1 text-sm">Pilih Siswa</label>
                <select
                  value={newVisit.user_id}
                  onChange={(e) => {
                    const uid = e.target.value;
                    const sel = students.find(s => String(s.id) === String(uid));
                    setNewVisit({...newVisit, user_id: uid, name: sel ? sel.name : ''});
                  }}
                  className="w-full p-2 border rounded"
                >
                  <option value="">-- Pilih siswa --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name}{s.nisn ? ` (${s.nisn})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm">Keperluan</label>
                <input value={newVisit.purpose} onChange={(e) => setNewVisit({...newVisit, purpose: e.target.value})} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block mb-1 text-sm">Catatan</label>
                <textarea value={newVisit.note} onChange={(e) => setNewVisit({...newVisit, note: e.target.value})} className="w-full p-2 border rounded" rows={3} />
              </div>

              <div className="flex justify-end space-x-2">
                <button onClick={() => setShowAdd(false)} className="px-3 py-2 border rounded">Batal</button>
                <button
                  onClick={async () => {
                    if (!newVisit.user_id) {
                      setError('Pilih siswa terlebih dahulu');
                      return;
                    }
                    setAddLoading(true);
                    try {
                      const payload = {
                        user_id: newVisit.user_id,
                        name: newVisit.name,
                        role: 'student',
                        purpose: newVisit.purpose,
                        note: newVisit.note,
                      };

                      const res = await fetch('http://localhost:5000/api/visits/admin', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(payload),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.message || 'Gagal menambah kunjungan');
                      // refresh
                      setShowAdd(false);
                      setNewVisit({ user_id: '', name: '', purpose: '', note: '' });
                      await fetchAll();
                    } catch (err) {
                      console.error(err);
                      setError(err.message || 'Terjadi kesalahan');
                    } finally {
                      setAddLoading(false);
                    }
                  }}
                  className="px-3 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-60"
                  disabled={addLoading}
                >
                  {addLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-lg font-medium">Daftar Kunjungan</h3>
        <Table
          columns={[
            { header: 'Waktu', key: 'created_at', render: (val) => new Date(val).toLocaleString('id-ID') },
            { header: 'Nama', key: 'name' },
            { header: 'Peran', key: 'role' },
            { header: 'Keperluan', key: 'purpose' },
            { header: 'Catatan', key: 'note' },
          ]}
          data={visits}
        />
      </div>
    </div>
  );
}
