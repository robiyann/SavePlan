import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import AppShell from '../components/AppShell';
import { TrashIcon, UsersIcon, PlusIcon } from '../components/Icons';
import { LoginCoupleHero } from '../components/Illustrations';

export default function UsersManager() {
  const { data: session, status } = useSession({ required: true });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states untuk tambah anggota
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // State untuk custom confirm modal
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  // Fetch daftar users saat mount/status berubah
  const fetchUsers = () => {
    setLoading(true);
    fetch('/api/summary')
      .then((res) => res.json())
      .then((data) => {
        if (data.users) {
          setUsers(data.users);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching users:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchUsers();
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Memverifikasi sesi...</p>
      </div>
    );
  }

  // Handle pembuatan user baru
  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    if (!name.trim()) {
      setError('Nama anggota tidak boleh kosong');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name: name.trim(),
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setSuccess(`Anggota "${name}" berhasil ditambahkan!`);
        setName('');
        fetchUsers(); // Refresh list
      } else {
        setError(result.error || 'Gagal menambahkan anggota.');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle penghapusan user
  const executeDelete = async (userName) => {
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          name: userName,
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setSuccess(`Anggota "${userName}" berhasil dihapus.`);
        fetchUsers(); // Refresh list
      } else {
        setError(result.error || 'Gagal menghapus anggota.');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi.');
    }
  };

  const handleDelete = (userName) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Hapus Anggota',
      message: `Apakah Anda yakin ingin menghapus anggota "${userName}"? Nama ini tidak akan lagi muncul di pilihan transaksi baru.`,
      onConfirm: () => executeDelete(userName),
    });
  };

  const colors = ['#3b82f6', '#ec4899', '#34d399', '#fbbf24', '#a1a1aa', '#fb7185'];
  const getUserColor = (name) => {
    if (!name) return '#71717a';
    if (name === 'Budi') return '#3b82f6';
    if (name === 'Siti') return '#ec4899';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <div>
      <Head>
        <title>Kelola Anggota (Members) — Couple Saving Planner</title>
        <meta name="description" content="Kelola nama anggota / saver planner." />
      </Head>

      <AppShell
        activePage="users"
        crumb="Anggota"
        title="Kelola Anggota Tabungan"
        subtitle="Daftarkan nama Anda dan pasangan untuk mulai mencatat keuangan berdua."
      >
        <div className="animate-fade-in">
          {success && <div className="banner success-banner">{success}</div>}
          {error && <div className="banner error-banner">{error}</div>}

          <div className="users-grid">
            {/* Daftar anggota */}
            <section className="card">
              <div className="card-title">
                <h2>Daftar Anggota Aktif</h2>
                <span className="title-tag">{users.length} Orang</span>
              </div>
              <div className="member-list">
                {loading ? (
                  <p className="loading-text">Memuat anggota...</p>
                ) : users.length === 0 ? (
                  <div className="empty-wrap">
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                      <LoginCoupleHero width={200} height={140} />
                    </div>
                    <p className="empty-text">Belum ada anggota yang terdaftar. Tambahkan anggota pertama di panel samping!</p>
                  </div>
                ) : (
                  users.map((userName, idx) => (
                    <div key={idx} className="member-row fade-item">
                      <div className="member-info">
                        <span className="avatar member-avatar" style={{ backgroundColor: getUserColor(userName) }}>
                          {userName?.charAt(0) || 'C'}
                        </span>
                        <div className="member-meta">
                          <strong>{userName}</strong>
                          <small>{idx === 0 ? 'Anggota pertama' : `Urutan #${idx + 1}`}</small>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(userName)}
                        className="icon-btn danger"
                        title="Hapus Anggota"
                        aria-label={`Hapus anggota ${userName}`}
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Form tambah anggota */}
            <section className="card card-pad member-form">
              <div className="card-heading">Daftarkan Anggota</div>
              <form onSubmit={handleCreate} className="member-form-body">
                <div className="input-group">
                  <label className="input-label" htmlFor="userNameInput">Nama Lengkap / Panggilan</label>
                  <input
                    id="userNameInput"
                    type="text"
                    placeholder="Contoh: Agus, Rina"
                    className="input-field"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={submitting}
                    maxLength={30}
                  />
                </div>

                <div className="member-hint">
                  <span className="member-hint-avatar">{name.trim() ? name.trim().charAt(0).toUpperCase() : '?'}</span>
                  <span className="member-hint-text">
                    {name.trim() ? `"${name.trim()}" akan muncul di pilihan "Oleh Siapa"` : 'Nama akan muncul di pilihan transaksi baru'}
                  </span>
                </div>

                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  <PlusIcon size={16} />
                  {submitting ? 'Mendaftarkan...' : 'Tambah Anggota'}
                </button>
              </form>
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', opacity: 0.85 }}>
                <LoginCoupleHero width={220} height={150} />
              </div>
            </section>
          </div>
        </div>
      </AppShell>

      {/* Custom Confirm Modal */}
      {deleteConfirm.isOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>{deleteConfirm.title}</h2>
              <button
                className="icon-btn"
                onClick={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
                aria-label="Tutup"
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>{deleteConfirm.message}</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  deleteConfirm.onConfirm();
                  setDeleteConfirm({ ...deleteConfirm, isOpen: false });
                }}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .users-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
          gap: 16px;
          align-items: start;
        }
        .banner.success-banner {
          background: rgba(52, 211, 153, 0.09);
          border: 1px solid rgba(52, 211, 153, 0.25);
          color: var(--success);
        }
        .banner.error-banner {
          background: rgba(251, 113, 133, 0.09);
          border: 1px solid rgba(251, 113, 133, 0.25);
          color: #fda4af;
        }
        .member-list {
          padding: 6px 0;
        }
        .member-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          padding: 14px 24px;
          border-bottom: 1px solid var(--border);
          transition: background var(--dur-fast) var(--ease-out);
        }
        .member-row:last-child {
          border-bottom: none;
        }
        @media (hover: hover) {
          .member-row:hover {
            background: rgba(255, 255, 255, 0.025);
          }
        }
        .member-info {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }
        .member-avatar {
          width: 42px;
          height: 42px;
          font-size: 1.05rem;
        }
        .member-meta {
          display: flex;
          flex-direction: column;
          line-height: 1.35;
          min-width: 0;
        }
        .member-meta strong {
          font-size: 0.98rem;
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .member-meta small {
          font-size: 0.72rem;
          color: var(--text-muted);
        }
        .member-form {
          position: sticky;
          top: 20px;
        }
        .card-heading {
          font-size: 0.95rem;
          font-weight: 700;
          margin-bottom: 18px;
        }
        .member-form-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .member-hint {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--surface-2);
          border: 1px dashed var(--border-strong);
          border-radius: var(--radius-sm);
          padding: 12px 14px;
        }
        .member-hint-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--surface-3);
          border: 1px solid var(--border-strong);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          flex-shrink: 0;
        }
        .member-hint-text {
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.45;
        }
        .empty-wrap {
          padding: 20px 0;
        }
        .empty-icon {
          display: flex;
          justify-content: center;
          margin-bottom: 10px;
          color: var(--text-muted);
        }
        .empty-text {
          padding: 0;
        }
        @media (max-width: 900px) {
          .users-grid {
            grid-template-columns: minmax(0, 1fr);
          }
          .member-form {
            position: static;
          }
        }
        @media (max-width: 560px) {
          .member-row {
            padding: 13px 18px;
          }
        }
      `}</style>
    </div>
  );
}
