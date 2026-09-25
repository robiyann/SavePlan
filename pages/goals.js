import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import AppShell from '../components/AppShell';
import Ring from '../components/Ring';
import { TrashIcon, TargetIcon, SparklesIcon } from '../components/Icons';
import { GoalsTargetIllustration } from '../components/Illustrations';

export default function GoalsManager() {
  const { data: session, status } = useSession({ required: true });

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states untuk tambah target
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
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

  // Fetch daftar goals saat mount/status berubah
  const fetchGoals = () => {
    setLoading(true);
    fetch('/api/summary')
      .then((res) => res.json())
      .then((data) => {
        if (data.goals) {
          setGoals(data.goals);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching goals:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchGoals();
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

  // Handle pembuatan goal baru
  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    const parsedTarget = Number(target);
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      setError('Masukkan nominal target saldo yang valid (harus > 0)');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name: name.trim(),
          target: parsedTarget,
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setSuccess(`Target "${name}" berhasil dibuat!`);
        setName('');
        setTarget('');
        fetchGoals(); // Refresh list
      } else {
        setError(result.error || 'Gagal membuat target baru.');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle penghapusan goal
  const executeDelete = async (goalName) => {
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          name: goalName,
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setSuccess(`Target "${goalName}" berhasil dihapus.`);
        fetchGoals(); // Refresh list
      } else {
        setError(result.error || 'Gagal menghapus target.');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi.');
    }
  };

  const handleDelete = (goalName) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Hapus Target',
      message: `Apakah Anda yakin ingin menghapus target "${goalName}"? Semua kalkulasi tabungan untuk target ini di dashboard akan disesuaikan.`,
      onConfirm: () => executeDelete(goalName),
    });
  };

  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatNumberThousand = (val) => {
    if (!val) return '';
    const clean = val.toString().replace(/\D/g, '');
    if (!clean) return '';
    return Number(clean).toLocaleString('id-ID');
  };

  const handleTargetChange = (e) => {
    const val = e.target.value;
    const numericValue = val.replace(/\D/g, '');
    setTarget(numericValue);
  };

  return (
    <div>
      <Head>
        <title>Kelola Target (Goals) — Couple Saving Planner</title>
        <meta name="description" content="Kelola target tabungan bersama." />
      </Head>

      <AppShell
        activePage="goals"
        crumb="Target"
        title="Kelola Target Tabungan"
        subtitle="Tambahkan target tabungan baru atau hapus rencana yang sudah selesai."
      >
        <div className="animate-fade-in">
          {success && <div className="banner success-banner">{success}</div>}
          {error && <div className="banner error-banner">{error}</div>}

          <div className="goals-grid">
            {/* Daftar target */}
            <section className="card">
              <div className="card-title">
                <h2>Daftar Target Aktif</h2>
                <span className="title-tag">{goals.length} Target</span>
              </div>
              <div className="goal-list">
                {loading ? (
                  <p className="loading-text">Memuat target...</p>
                ) : goals.length === 0 ? (
                  <div className="empty-wrap">
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                      <GoalsTargetIllustration width={220} height={160} />
                    </div>
                    <p className="empty-text">Belum ada target tabungan yang dibuat. Buat target pertama Anda di panel samping!</p>
                  </div>
                ) : (
                  goals.map((goal, idx) => {
                    const goalName = goal[0];
                    const goalTarget = Number(goal[1]) || 0;
                    const goalSaved = Number(goal[2]) || 0;
                    const goalPercent = goalTarget > 0 ? Math.min(100, Math.round((goalSaved / goalTarget) * 100)) : 0;

                    return (
                      <div key={idx} className="goal-row fade-item">
                        <Ring
                          percent={goalPercent}
                          size={72}
                          stroke={7}
                          gradient={idx % 3 === 0 ? 'violet' : idx % 3 === 1 ? 'emerald' : 'rose'}
                          glow
                        >
                          <span className="goal-row-pct">{goalPercent}%</span>
                        </Ring>
                        <div className="goal-row-info">
                          <div className="goal-row-head">
                            <h3>{goalName}</h3>
                            <button
                              onClick={() => handleDelete(goalName)}
                              className="icon-btn danger"
                              title="Hapus Target"
                              aria-label={`Hapus target ${goalName}`}
                            >
                              <TrashIcon size={14} />
                            </button>
                          </div>
                          <div className="goal-nums">
                            <span><strong>{formatIDR(goalSaved)}</strong> terkumpul</span>
                            <span>Sisa {formatIDR(Math.max(0, goalTarget - goalSaved))}</span>
                          </div>
                          <div className="goal-row-track">
                            <div className="goal-row-fill" style={{ width: `${goalPercent}%` }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Form target baru */}
            <section className="card card-pad goal-form">
              <div className="card-heading">Buat Target Baru</div>
              <form onSubmit={handleCreate} className="goal-form-body">
                <div className="input-group">
                  <label className="input-label" htmlFor="goalName">Nama Rencana / Target</label>
                  <input
                    id="goalName"
                    type="text"
                    placeholder="Contoh: DP Rumah, Liburan Bali"
                    className="input-field"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="goalTarget">Nominal Target Saldo (Rp)</label>
                  <input
                    id="goalTarget"
                    type="text"
                    placeholder="Contoh: 50.000.000"
                    className="input-field"
                    value={formatNumberThousand(target)}
                    onChange={handleTargetChange}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="goal-hint">
                  <span className="goal-hint-label">Pratinjau nominal</span>
                  <span className="goal-hint-value">{target ? formatIDR(Number(target) || 0) : 'Rp 0'}</span>
                </div>

                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  <TargetIcon size={16} />
                  {submitting ? 'Membuat Target...' : 'Buat Target'}
                </button>
              </form>
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', opacity: 0.85 }}>
                <GoalsTargetIllustration width={190} height={140} />
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
        .goals-grid {
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
        .goal-list {
          padding: 10px 0;
        }
        .goal-row {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 18px 24px;
          border-bottom: 1px solid var(--border);
          transition: background var(--dur-fast) var(--ease-out);
        }
        .goal-row:last-child {
          border-bottom: none;
        }
        @media (hover: hover) {
          .goal-row:hover {
            background: rgba(255, 255, 255, 0.025);
          }
        }
        .goal-row-pct {
          font-size: 0.72rem;
          font-weight: 800;
        }
        .goal-row-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .goal-row-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .goal-row-head h3 {
          font-size: 1.05rem;
          font-weight: 750;
          letter-spacing: -0.01em;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .goal-nums {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .goal-nums strong {
          color: var(--text-primary);
          font-weight: 700;
        }
        .goal-row-track {
          height: 8px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 99px;
          overflow: hidden;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.35);
        }
        .goal-row-fill {
          height: 100%;
          background: linear-gradient(90deg, #8b5cf6 0%, #ec4899 50%, #f43f5e 100%);
          border-radius: 99px;
          box-shadow: 0 0 10px rgba(236, 72, 153, 0.45);
          transform-origin: left;
          animation: growBar 1s var(--ease-out) 0.1s both;
        }
        @keyframes growBar {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        .goal-form {
          position: sticky;
          top: 20px;
        }
        .card-heading {
          font-size: 0.95rem;
          font-weight: 700;
          margin-bottom: 18px;
        }
        .goal-form-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .goal-hint {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          background: var(--surface-2);
          border: 1px dashed var(--border-strong);
          border-radius: var(--radius-sm);
          padding: 11px 14px;
        }
        .goal-hint-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
        }
        .goal-hint-value {
          font-weight: 800;
          font-size: 0.95rem;
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
          .goals-grid {
            grid-template-columns: minmax(0, 1fr);
          }
          .goal-form {
            position: static;
          }
        }
        @media (max-width: 560px) {
          .goal-row {
            padding: 16px 18px;
            gap: 14px;
          }
        }
      `}</style>
    </div>
  );
}
