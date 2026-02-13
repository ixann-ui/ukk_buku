'use client';

import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

export default function VisitPage() {
  const { token, user } = useAuth();
  const [purpose, setPurpose] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('http://localhost:5000/api/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ purpose, note }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Kunjungan berhasil direkam. Terima kasih!' });
        setPurpose('');
        setNote('');
      } else {
        setMessage({ type: 'error', text: data.message || 'Gagal merekam kunjungan' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="mb-4 text-2xl font-semibold">Form Kunjungan Perpustakaan</h2>
      <p className="mb-4 text-sm text-gray-600">Hai {user?.name || 'pengunjung'}, silakan isi data kunjungan.</p>

      {message && (
        <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <div>
          <label className="block mb-1 text-sm font-medium">Keperluan</label>
          <input
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Contoh: membaca, pinjam buku, mengerjakan tugas"
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">Catatan (opsional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-2 border rounded"
            rows={4}
            placeholder="Catatan tambahan"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Mencatat...' : 'Kirim Kunjungan'}
          </button>
        </div>
      </form>
    </div>
  );
}
