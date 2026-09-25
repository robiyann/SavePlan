import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import AppShell from '../components/AppShell';
import { useRouter } from 'next/router';
import { TrendUpIcon, TrendDownIcon, SparklesIcon, AlertTriangleIcon } from '../components/Icons';
import { CoupleSavingsIllustration } from '../components/Illustrations';

export default function AddTransaction() {
  const { data: session, status } = useSession({ required: true });
  const router = useRouter();

  // Form states
  const [date, setDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [type, setType] = useState('income'); // income = + (tabungan), expense = -
  const [category, setCategory] = useState('Tabungan');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [saverName, setSaverName] = useState('');
  const [goals, setGoals] = useState([]);
  const [goalName, setGoalName] = useState('');
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Ambil daftar goals dan users dari API summary
  useEffect(() => {
    if (status === 'authenticated') {
      setGoalsLoading(true);
      setUsersLoading(true);
      fetch('/api/summary')
        .then((res) => res.json())
        .then((data) => {
          if (data.goals) {
            setGoals(data.goals);
            if (data.goals.length > 0) {
              setGoalName(data.goals[0][0]); // Default ke Goal pertama
            }
          }
          if (data.users) {
            setUsers(data.users);
            if (data.users.length > 0) {
              setSaverName(data.users[0]); // Default ke User pertama
            }
          }
          setGoalsLoading(false);
          setUsersLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching data:', err);
          setGoalsLoading(false);
          setUsersLoading(false);
        });
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

  // Ubah kategori default saat tipe diubah
  const handleTypeChange = (newType) => {
    setType(newType);
    if (newType === 'income') {
      setCategory('Tabungan');
    } else {
      setCategory('Makanan');
    }
  };

  const formatNumberThousand = (val) => {
    if (!val) return '';
    const clean = val.toString().replace(/\D/g, '');
    if (!clean) return '';
    return Number(clean).toLocaleString('id-ID');
  };

  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const handleAmountChange = (e) => {
    const val = e.target.value;
    const numericValue = val.replace(/\D/g, '');
    setAmount(numericValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    setSuccess(false);

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Masukkan jumlah nominal yang valid (harus lebih besar dari 0).');
      setSaving(false);
      return;
    }

    // Jika pengeluaran, ubah nominal menjadi negatif
    const finalAmount = type === 'expense' ? parsedAmount * -1 : parsedAmount;

    try {
      const res = await fetch('/api/add-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          category,
          amount: finalAmount,
          description: description.trim(),
          saverName,
          goalName,
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setSuccess(true);
        setAmount('');
        setDescription('');
        // Redirect ke dashboard setelah 1.5 detik
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        setError(result.error || 'Gagal menyimpan transaksi ke database.');
      }
    } catch (err) {
      setError('Terjadi masalah koneksi ke server.');
    } finally {
      setSaving(false);
    }
  };

  // Nilai pratinjau live (hanya menampilkan state yang sudah ada)
  const previewAmount = Number(amount) || 0;
  const previewIsExpense = type === 'expense';
  const previewDate = (() => {
    const parts = date.split('-');
    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0].slice(-2)}` : date;
  })();

  return (
    <div>
      <Head>
        <title>Tambah Transaksi — Couple Saving Planner</title>
        <meta name="description" content="Catat aktivitas keuangan baru kita." />
      </Head>

      <AppShell
        activePage="add"
        crumb="Transaksi Baru"
        title="Catat Transaksi"
        subtitle="Masukkan rincian tabungan atau pengeluaran bersama."
      >
        <div className="animate-fade-in">
          {success && (
            <div className="success-banner">
              <SparklesIcon size={18} />
              <span>Transaksi berhasil disimpan! Mengarahkan Anda ke dashboard...</span>
            </div>
          )}

          {error && (
            <div className="error-banner">
              <AlertTriangleIcon size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="add-grid">
            {/* Panel kiri: form */}
            <div className="card card-pad">
              <form onSubmit={handleSubmit}>
                <div className="type-toggle">
                  <button
                    type="button"
                    className={`toggle-btn income ${type === 'income' ? 'active' : ''}`}
                    onClick={() => handleTypeChange('income')}
                    disabled={saving}
                  >
                    <TrendUpIcon size={16} />
                    Menabung / Pemasukan
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn expense ${type === 'expense' ? 'active' : ''}`}
                    onClick={() => handleTypeChange('expense')}
                    disabled={saving}
                  >
                    <TrendDownIcon size={16} />
                    Pengeluaran Bersama
                  </button>
                </div>

                <div className="form-stack">
                  <div className="form-row">
                    <div className="input-group">
                      <label className="input-label" htmlFor="date">Tanggal</label>
                      <input
                        id="date"
                        type="date"
                        className="input-field"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                        required
                        disabled={saving}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label" htmlFor="amount">Jumlah Nominal (Rp)</label>
                      <input
                        id="amount"
                        type="text"
                        placeholder="Contoh: 500.000"
                        className="input-field"
                        value={formatNumberThousand(amount)}
                        onChange={handleAmountChange}
                        required
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="input-group">
                      <label className="input-label" htmlFor="saverName">Oleh Siapa</label>
                      {usersLoading ? (
                        <input type="text" className="input-field" value="Memuat anggota..." disabled />
                      ) : (
                        <select
                          id="saverName"
                          className="input-field select-field"
                          value={saverName}
                          onChange={(e) => setSaverName(e.target.value)}
                          disabled={saving}
                        >
                          {users.map((usr, idx) => (
                            <option key={idx} value={usr}>{usr}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="input-group">
                      <label className="input-label" htmlFor="goalName">Untuk Target (Goal)</label>
                      {goalsLoading ? (
                        <input type="text" className="input-field" value="Memuat target..." disabled />
                      ) : (
                        <select
                          id="goalName"
                          className="input-field select-field"
                          value={goalName}
                          onChange={(e) => setGoalName(e.target.value)}
                          disabled={saving}
                        >
                          {goals.map((g, idx) => (
                            <option key={idx} value={g[0]}>{g[0]}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="category">Kategori</label>
                    <select
                      id="category"
                      className="input-field select-field"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      disabled={saving}
                    >
                      {type === 'income' ? (
                        <>
                          <option value="Tabungan">Tabungan Utama</option>
                          <option value="Investasi">Investasi / Reksa Dana</option>
                          <option value="Pemasukan Lain">Pemasukan Lain</option>
                        </>
                      ) : (
                        <>
                          <option value="Makanan">Makanan & Minuman</option>
                          <option value="Belanja">Belanja Rumah Tangga</option>
                          <option value="Transportasi">Transportasi</option>
                          <option value="Hiburan">Hiburan & Kencan</option>
                          <option value="Tagihan">Tagihan & Cicilan</option>
                          <option value="Lainnya">Lainnya</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="description">Catatan / Deskripsi</label>
                    <input
                      id="description"
                      type="text"
                      placeholder="Contoh: Top-up tabungan nikah Juni"
                      className="input-field"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={saving}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary submit-btn" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
              </form>
            </div>

            {/* Panel kanan: pratinjau live */}
            <aside className={`card card-pad preview-card ${previewIsExpense ? 'is-expense' : 'is-income'}`}>
              <div className="preview-head">Pratinjau</div>
              <div className={`preview-amount ${previewIsExpense ? 'expense-text' : 'income-text'}`}>
                {previewAmount > 0 ? (previewIsExpense ? '−' : '+') : ''}{formatIDR(previewAmount)}
              </div>
              <div className="preview-desc">{description.trim() || (previewIsExpense ? 'Pengeluaran bersama' : 'Setoran tabungan')}</div>

              <div className="preview-rows">
                <div className="preview-row">
                  <span className="preview-label">Tanggal</span>
                  <span className="preview-value">{previewDate}</span>
                </div>
                <div className="preview-row">
                  <span className="preview-label">Oleh</span>
                  <span className="preview-value">{saverName || '—'}</span>
                </div>
                <div className="preview-row">
                  <span className="preview-label">Target</span>
                  <span className="preview-value">{goalName || '—'}</span>
                </div>
                <div className="preview-row">
                  <span className="preview-label">Kategori</span>
                  <span className="preview-value">{category}</span>
                </div>
              </div>

              <div className="preview-note">
                <span className={`preview-badge ${previewIsExpense ? 'out' : 'in'}`}>
                  {previewIsExpense ? 'Pengeluaran' : 'Pemasukan'}
                </span>
              </div>

              <div style={{ marginTop: '22px', display: 'flex', justifyContent: 'center' }}>
                <CoupleSavingsIllustration width={220} height={150} />
              </div>
            </aside>
          </div>
        </div>
      </AppShell>

      <style jsx>{`
        .add-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
          gap: 16px;
          align-items: start;
        }
        .form-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 16px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .submit-btn {
          width: 100%;
          margin-top: 20px;
        }

        /* Panel pratinjau */
        .preview-card {
          position: sticky;
          top: 20px;
          border-top: 3px solid var(--success);
        }
        .preview-card.is-expense {
          border-top-color: var(--danger);
        }
        .preview-head {
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--text-muted);
          margin-bottom: 14px;
        }
        .preview-amount {
          font-size: 2.1rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.1;
        }
        .preview-desc {
          color: var(--text-secondary);
          font-size: 0.88rem;
          margin: 8px 0 20px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .preview-rows {
          border-top: 1px solid var(--border);
        }
        .preview-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid var(--border);
        }
        .preview-label {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
        }
        .preview-value {
          font-size: 0.9rem;
          font-weight: 600;
          text-align: right;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .preview-note {
          margin-top: 18px;
        }
        .preview-badge {
          display: inline-flex;
          align-items: center;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 99px;
        }
        .preview-badge.in {
          color: var(--success);
          background: rgba(52, 211, 153, 0.1);
          border: 1px solid rgba(52, 211, 153, 0.3);
        }
        .preview-badge.out {
          color: var(--danger);
          background: rgba(251, 113, 133, 0.1);
          border: 1px solid rgba(251, 113, 133, 0.3);
        }

        @media (max-width: 900px) {
          .add-grid {
            grid-template-columns: minmax(0, 1fr);
          }
          .preview-card {
            position: static;
            border-top-width: 3px;
          }
        }
        @media (max-width: 560px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
