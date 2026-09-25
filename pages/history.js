import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import AppShell from '../components/AppShell';
import { PencilIcon, TrashIcon, TrendUpIcon, TrendDownIcon } from '../components/Icons';
import { EmptyHistoryIllustration } from '../components/Illustrations';

const PER_PAGE = 10; // pagination: 10 transaksi per halaman

export default function History() {
  const { data: session, status } = useSession({ required: true });
  const [transactions, setTransactions] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [registeredGoals, setRegisteredGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // States untuk filter
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [filterUser, setFilterUser] = useState('Semua');
  const [filterGoal, setFilterGoal] = useState('Semua');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [page, setPage] = useState(1);

  // States untuk edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(-1);
  const [editDate, setEditDate] = useState('');
  const [editType, setEditType] = useState('income');
  const [editCategory, setEditCategory] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSaverName, setEditSaverName] = useState('');
  const [editGoalName, setEditGoalName] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // State untuk custom confirm modal
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  const refreshTransactions = () => {
    setLoading(true);
    fetch('/api/transactions')
      .then((res) => res.json())
      .then((data) => {
        if (data.transactions) {
          setTransactions(data.transactions);
        }
        if (data.users) {
          setRegisteredUsers(data.users);
        }
        if (data.goals) {
          setRegisteredGoals(data.goals);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching transactions:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (status === 'authenticated') {
      refreshTransactions();
    }
  }, [status]);

  // Kembali ke halaman 1 setiap kali filter berubah
  useEffect(() => {
    setPage(1);
  }, [filterCategory, filterUser, filterGoal, searchTerm]);

  const handleEditTypeChange = (newType) => {
    setEditType(newType);
    if (newType === 'income') {
      setEditCategory('Tabungan');
    } else {
      setEditCategory('Makanan');
    }
  };

  const openEditModal = (tx, originalIndex) => {
    const [date, category, amount, desc, user, goalName] = tx;
    const numericAmount = Number(amount) || 0;

    setEditIndex(originalIndex);
    setEditDate(date);
    setEditType(numericAmount >= 0 ? 'income' : 'expense');
    setEditCategory(category);
    setEditAmount(Math.abs(numericAmount).toString());
    setEditDescription(desc || '');
    setEditSaverName(user);
    setEditGoalName(goalName || 'Umum');
    setIsEditOpen(true);
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    setSubmittingEdit(true);

    const parsedAmount = Number(editAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setEditError('Masukkan jumlah nominal yang valid (harus lebih besar dari 0).');
      setSubmittingEdit(false);
      return;
    }

    const finalAmount = editType === 'expense' ? parsedAmount * -1 : parsedAmount;

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          index: editIndex,
          transaction: {
            date: editDate,
            category: editCategory,
            amount: finalAmount,
            description: editDescription.trim(),
            saverName: editSaverName,
            goalName: editGoalName === 'Umum' ? '' : editGoalName,
          },
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setIsEditOpen(false);
        refreshTransactions();
      } else {
        setEditError(result.error || 'Gagal mengubah transaksi.');
      }
    } catch (err) {
      setEditError('Terjadi kesalahan koneksi.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const executeDelete = async (originalIndex) => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          index: originalIndex,
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        refreshTransactions();
      } else {
        alert(result.error || 'Gagal menghapus transaksi.');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi.');
    }
  };

  const handleDelete = async (originalIndex, desc, amount) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Hapus Transaksi',
      message: `Apakah Anda yakin ingin menghapus transaksi "${desc || 'Tanpa deskripsi'}" (Rp ${Math.abs(amount).toLocaleString('id-ID')})? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: () => executeDelete(originalIndex),
    });
  };

  if (status === 'loading') {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Memverifikasi sesi...</p>
      </div>
    );
  }

  // Cari kategori, user & goal unik untuk opsi filter dropdown
  const categories = ['Semua', ...new Set(transactions.map((tx) => tx[1]))];
  const users = ['Semua', ...new Set([...registeredUsers, ...transactions.map((tx) => tx[4]).filter(Boolean)])];
  const goals = ['Semua', ...new Set([...registeredGoals.map((g) => g[0]), ...transactions.map((tx) => tx[5]).filter(Boolean)])];

  // Jalankan filtering + urutkan terbaru di atas.
  // originalIndex tetap merujuk baris asli di Sheet (urutan simpan tidak diubah)
  // sehingga edit/hapus tetap akurat. Tanggal YYYY-MM-DD: string compare valid;
  // tanggal sama → baris sheet lebih bawah (input lebih baru) tampil lebih dulu.
  const filteredTransactions = transactions
    .map((tx, originalIndex) => ({ tx, originalIndex }))
    .filter(({ tx }) => {
      const [date, category, amount, desc, user, goalName] = tx;

      const matchesCategory = filterCategory === 'Semua' || category === filterCategory;
      const matchesUser = filterUser === 'Semua' || user === filterUser;
      const matchesGoal = filterGoal === 'Semua' || goalName === filterGoal;

      const searchString = `${desc} ${category} ${user} ${goalName || ''}`.toLowerCase();
      const matchesSearch = searchString.includes(searchTerm.toLowerCase());

      return matchesCategory && matchesUser && matchesGoal && matchesSearch;
    })
    .sort((a, b) => {
      const da = a.tx[0] || '';
      const db = b.tx[0] || '';
      if (da !== db) return da < db ? 1 : -1;
      return b.originalIndex - a.originalIndex;
    });

  // Hitung total ringkasan dari transaksi ter-filter
  let totalIncome = 0;
  let totalExpense = 0;

  filteredTransactions.forEach(({ tx }) => {
    const amount = Number(tx[2]) || 0;
    if (amount > 0) {
      totalIncome += amount;
    } else {
      totalExpense += amount;
    }
  });

  // Pagination helpers
  const totalItems = filteredTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PER_PAGE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIdx = (safePage - 1) * PER_PAGE;
  const pageRows = filteredTransactions.slice(startIdx, startIdx + PER_PAGE);

  // Daftar tombol nomor halaman gaya explorer: awal, jendela di sekitar halaman aktif, akhir
  const pageButtons = (() => {
    const nums = new Set([1, totalPages, safePage - 1, safePage, safePage + 1].filter((n) => n >= 1 && n <= totalPages));
    const sorted = [...nums].sort((a, b) => a - b);
    const out = [];
    let prev = 0;
    for (const n of sorted) {
      if (n - prev > 1) out.push('…');
      out.push(n);
      prev = n;
    }
    return out;
  })();

  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDateDMY = (dateStr) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      const shortYear = year.slice(-2);
      return `${day}-${month}-${shortYear}`;
    }
    return dateStr;
  };

  const formatNumberThousand = (val) => {
    if (!val) return '';
    const clean = val.toString().replace(/\D/g, '');
    if (!clean) return '';
    return Number(clean).toLocaleString('id-ID');
  };

  const handleEditAmountChange = (e) => {
    const val = e.target.value;
    const numericValue = val.replace(/\D/g, '');
    setEditAmount(numericValue);
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
        <title>Riwayat Transaksi — Couple Saving Planner</title>
        <meta name="description" content="Riwayat lengkap pemasukan dan pengeluaran bersama." />
      </Head>

      <AppShell
        activePage="history"
        crumb="Riwayat"
        title="Riwayat Transaksi"
        subtitle="Seluruh catatan tabungan dan pengeluaran kita berdua."
      >
        <div className="animate-fade-in">
          {/* Satu kartu ala explorer: toolbar → ringkasan → tabel → pagination */}
          <div className="card explorer">
            {/* Toolbar ringkas: Search + Filter dropdowns */}
            <div className="ex-toolbar">
              <div className="search-wrap">
                <input
                  type="text"
                  placeholder="Cari transaksi..."
                  className="input-field ex-search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="search-clear"
                    onClick={() => setSearchTerm('')}
                    title="Hapus pencarian"
                  >
                    &times;
                  </button>
                )}
              </div>
              <div className="filters-group">
                <select
                  className="input-field select-field ex-select"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  aria-label="Filter Kategori"
                >
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat === 'Semua' ? 'Semua Kategori' : cat}</option>
                  ))}
                </select>
                <select
                  className="input-field select-field ex-select"
                  value={filterGoal}
                  onChange={(e) => setFilterGoal(e.target.value)}
                  aria-label="Filter Target"
                >
                  {goals.map((g, idx) => (
                    <option key={idx} value={g}>{g === 'Semua' ? 'Semua Target' : g}</option>
                  ))}
                </select>
                <select
                  className="input-field select-field ex-select"
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                  aria-label="Filter Anggota"
                >
                  {users.map((usr, idx) => (
                    <option key={idx} value={usr}>{usr === 'Semua' ? 'Semua Anggota' : usr}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Baris Ringkasan Cepat (Tally) */}
            <div className="ex-tally">
              <div className="tally-chips">
                <span className="tally-chip income">
                  <TrendUpIcon size={12} />
                  <span>Masuk:</span>
                  <strong className="income-text">{formatIDR(totalIncome)}</strong>
                </span>
                <span className="tally-chip expense">
                  <TrendDownIcon size={12} />
                  <span>Keluar:</span>
                  <strong className="expense-text">{formatIDR(Math.abs(totalExpense))}</strong>
                </span>
                <span className="tally-chip net">
                  <span>Net:</span>
                  <strong>{formatIDR(totalIncome + totalExpense)}</strong>
                </span>
              </div>
              <span className="tally-count">{totalItems} transaksi</span>
            </div>

            <div className="table-scroll">
              {loading ? (
                <p className="loading-text">Memuat transaksi...</p>
              ) : pageRows.length === 0 ? (
                <div className="empty-illustration-wrap">
                  <EmptyHistoryIllustration width={200} height={140} />
                  <p className="empty-text">
                    {totalItems === 0
                      ? 'Tidak ada transaksi yang cocok dengan filter saat ini.'
                      : `Halaman ${safePage} kosong — kembali ke halaman 1.`}
                  </p>
                </div>
              ) : (
                <table className="tx-table">
                  <thead>
                    <tr>
                      <th className="th-main">Transaksi</th>
                      <th className="th-user-date desktop-only">Oleh & Tanggal</th>
                      <th className="th-goal desktop-only">Target</th>
                      <th className="th-amount text-right">Nominal</th>
                      <th className="th-actions text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map(({ tx, originalIndex }, idx) => {
                      const [date, category, amount, desc, user, goalName] = tx;
                      const amt = Number(amount) || 0;
                      const isExpense = amt < 0;

                      return (
                        <tr key={idx} className="tx-row">
                          {/* Kolom 1: Ikon + Deskripsi/Kategori + Subline di mobile */}
                          <td className="col-main">
                            <span className={`type-dot ${isExpense ? 'out' : 'in'}`}>
                              {isExpense ? <TrendDownIcon size={12} /> : <TrendUpIcon size={12} />}
                            </span>
                            <div className="tx-info">
                              <span className="tx-title">{desc || category}</span>
                              {/* Sub info untuk mobile */}
                              <div className="tx-sub mobile-only">
                                <span>{formatDateDMY(date)}</span>
                                <span className="dot-sep">•</span>
                                <span>{user}</span>
                                {goalName && (
                                  <>
                                    <span className="dot-sep">•</span>
                                    <span className="goal-subtag">{goalName}</span>
                                  </>
                                )}
                              </div>
                              {/* Kategori tag untuk desktop */}
                              <div className="desktop-only tx-cat-badge">
                                <span className={`tag cat-${category.toLowerCase()}`}>{category}</span>
                              </div>
                            </div>
                          </td>

                          {/* Kolom 2: Oleh & Tanggal (Desktop) */}
                          <td className="col-user-date desktop-only">
                            <div className="user-date-wrap">
                              <span className="who">
                                <span className="avatar" style={{ backgroundColor: getUserColor(user) }}>
                                  {user?.charAt(0) || 'C'}
                                </span>
                                <span className="user-name">{user}</span>
                              </span>
                              <span className="tx-date">{formatDateDMY(date)}</span>
                            </div>
                          </td>

                          {/* Kolom 3: Target Goal (Desktop) */}
                          <td className="col-goal desktop-only">
                            <span className="tag goal">{goalName || 'Umum'}</span>
                          </td>

                          {/* Kolom 4: Nominal (di mobile berisi nominal + tombol aksi di bawahnya) */}
                          <td className="col-amount text-right">
                            <div className="amount-cell-inner">
                              <span className={`tx-amount ${isExpense ? 'expense-text' : 'income-text'}`}>
                                {isExpense ? '−' : '+'}{formatIDR(amt)}
                              </span>
                              <div className="row-actions mobile-only">
                                <button
                                  onClick={() => openEditModal(tx, originalIndex)}
                                  className="icon-btn edit-btn"
                                  title="Edit Transaksi"
                                  aria-label="Edit Transaksi"
                                >
                                  <PencilIcon size={12} />
                                </button>
                                <button
                                  onClick={() => handleDelete(originalIndex, desc, amt)}
                                  className="icon-btn danger delete-btn"
                                  title="Hapus Transaksi"
                                  aria-label="Hapus Transaksi"
                                >
                                  <TrashIcon size={12} />
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* Kolom 5: Aksi (khusus Desktop) */}
                          <td className="col-actions text-right desktop-only">
                            <div className="row-actions">
                              <button
                                onClick={() => openEditModal(tx, originalIndex)}
                                className="icon-btn edit-btn"
                                title="Edit Transaksi"
                                aria-label="Edit Transaksi"
                              >
                                <PencilIcon size={13} />
                              </button>
                              <button
                                onClick={() => handleDelete(originalIndex, desc, amt)}
                                className="icon-btn danger delete-btn"
                                title="Hapus Transaksi"
                                aria-label="Hapus Transaksi"
                              >
                                <TrashIcon size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer pagination gaya explorer */}
            <div className="ex-foot">
              <span className="ex-count">
                {totalItems === 0
                  ? 'Tidak ada data'
                  : `Menampilkan ${startIdx + 1}–${Math.min(totalItems, startIdx + PER_PAGE)} dari ${totalItems} transaksi`}
              </span>
              <div className="paging">
                <button
                  className="page-btn"
                  onClick={() => setPage(1)}
                  disabled={safePage === 1}
                  title="Halaman pertama"
                  aria-label="Halaman pertama"
                >
                  «
                </button>
                <button
                  className="page-btn"
                  onClick={() => setPage(safePage - 1)}
                  disabled={safePage === 1}
                  title="Halaman sebelumnya"
                  aria-label="Halaman sebelumnya"
                >
                  ‹
                </button>
                {pageButtons.map((p, idx) =>
                  p === '…' ? (
                    <span key={`e${idx}`} className="page-ellipsis">…</span>
                  ) : (
                    <button
                      key={p}
                      className={`page-btn ${p === safePage ? 'active' : ''}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  className="page-btn"
                  onClick={() => setPage(safePage + 1)}
                  disabled={safePage === totalPages}
                  title="Halaman berikutnya"
                  aria-label="Halaman berikutnya"
                >
                  ›
                </button>
                <button
                  className="page-btn"
                  onClick={() => setPage(totalPages)}
                  disabled={safePage === totalPages}
                  title="Halaman terakhir"
                  aria-label="Halaman terakhir"
                >
                  »
                </button>
              </div>
            </div>
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

      {/* Modal Edit Transaksi */}
      {isEditOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Edit Transaksi</h2>
              <button className="icon-btn" onClick={() => setIsEditOpen(false)} aria-label="Tutup">&times;</button>
            </div>

            {editError && <div className="banner error-banner">{editError}</div>}

            <form onSubmit={handleEditSubmit}>
              <div className="type-toggle">
                <button
                  type="button"
                  className={`toggle-btn income ${editType === 'income' ? 'active' : ''}`}
                  onClick={() => handleEditTypeChange('income')}
                  disabled={submittingEdit}
                >
                  <TrendUpIcon size={16} />
                  Menabung
                </button>
                <button
                  type="button"
                  className={`toggle-btn expense ${editType === 'expense' ? 'active' : ''}`}
                  onClick={() => handleEditTypeChange('expense')}
                  disabled={submittingEdit}
                >
                  <TrendDownIcon size={16} />
                  Pengeluaran
                </button>
              </div>

              <div className="form-stack">
                <div className="input-group">
                  <label className="input-label" htmlFor="editDateInput">Tanggal</label>
                  <input
                    id="editDateInput"
                    type="date"
                    className="input-field"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                    required
                    disabled={submittingEdit}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="editSaverInput">Oleh Siapa</label>
                  <select
                    id="editSaverInput"
                    className="input-field select-field"
                    value={editSaverName}
                    onChange={(e) => setEditSaverName(e.target.value)}
                    disabled={submittingEdit}
                    required
                  >
                    {registeredUsers.map((usr, idx) => (
                      <option key={idx} value={usr}>{usr}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="editGoalInput">Untuk Target (Goal)</label>
                  <select
                    id="editGoalInput"
                    className="input-field select-field"
                    value={editGoalName}
                    onChange={(e) => setEditGoalName(e.target.value)}
                    disabled={submittingEdit}
                    required
                  >
                    <option value="Umum">Umum</option>
                    {registeredGoals.map((g, idx) => (
                      <option key={idx} value={g[0]}>{g[0]}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="editCategoryInput">Kategori</label>
                  <select
                    id="editCategoryInput"
                    className="input-field select-field"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    disabled={submittingEdit}
                    required
                  >
                    {editType === 'income' ? (
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
                  <label className="input-label" htmlFor="editAmountInput">Jumlah Nominal (Rp)</label>
                  <input
                    id="editAmountInput"
                    type="text"
                    placeholder="Contoh: 500.000"
                    className="input-field"
                    value={formatNumberThousand(editAmount)}
                    onChange={handleEditAmountChange}
                    required
                    disabled={submittingEdit}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="editDescInput">Catatan / Deskripsi</label>
                  <input
                    id="editDescInput"
                    type="text"
                    placeholder="Deskripsi transaksi"
                    className="input-field"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    disabled={submittingEdit}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditOpen(false)} disabled={submittingEdit}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingEdit}>
                  {submittingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Kartu explorer: compact toolbar, dense table, mobile native row */
        .ex-toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-glass);
          flex-wrap: wrap;
        }
        .search-wrap {
          position: relative;
          flex: 1.3;
          min-width: 180px;
        }
        .ex-search {
          padding: 8px 30px 8px 12px;
          font-size: 0.85rem;
          height: 38px;
        }
        .search-clear {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 1.1rem;
          cursor: pointer;
          line-height: 1;
        }
        .filters-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 2;
          min-width: 280px;
        }
        .ex-select {
          flex: 1;
          min-width: 0;
          padding: 8px 28px 8px 10px;
          font-size: 0.82rem;
          height: 38px;
        }

        .ex-tally {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 8px 16px;
          border-bottom: 1px solid var(--border-glass);
          background: rgba(255, 255, 255, 0.015);
          font-size: 0.78rem;
          flex-wrap: wrap;
        }
        .tally-chips {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .tally-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border);
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        .tally-chip.income {
          background: rgba(52, 211, 153, 0.06);
          border-color: rgba(52, 211, 153, 0.2);
        }
        .tally-chip.expense {
          background: rgba(251, 113, 133, 0.06);
          border-color: rgba(251, 113, 133, 0.2);
        }
        .tally-chip strong {
          font-weight: 750;
        }
        .tally-count {
          color: var(--text-muted);
          font-size: 0.75rem;
        }

        .table-scroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .tx-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        .tx-table th {
          text-align: left;
          padding: 9px 14px;
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border-glass);
          background: rgba(255, 255, 255, 0.01);
          white-space: nowrap;
        }
        .tx-table td {
          padding: 9px 14px;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }
        .tx-table tbody tr {
          transition: background var(--dur-fast) var(--ease-out);
        }
        .tx-table tbody tr:last-child td {
          border-bottom: none;
        }
        @media (hover: hover) {
          .tx-table tbody tr:hover {
            background: rgba(255, 255, 255, 0.035);
          }
        }

        .col-main {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 200px;
        }
        .type-dot {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .type-dot.in {
          background: rgba(52, 211, 153, 0.12);
          color: #34d399;
          border: 1px solid rgba(52, 211, 153, 0.28);
        }
        .type-dot.out {
          background: rgba(251, 113, 133, 0.12);
          color: #fb7185;
          border: 1px solid rgba(251, 113, 133, 0.28);
        }

        .tx-info {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          flex: 1;
        }
        .tx-title {
          font-weight: 650;
          font-size: 0.88rem;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .tx-cat-badge {
          flex-shrink: 0;
        }

        .user-date-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          white-space: nowrap;
        }
        .who {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-weight: 600;
          font-size: 0.82rem;
        }
        .who .avatar {
          width: 22px;
          height: 22px;
          font-size: 0.65rem;
          border-radius: 6px;
        }
        .tx-date {
          font-size: 0.78rem;
          color: var(--text-muted);
        }

        .col-amount {
          white-space: nowrap;
        }
        .tx-amount {
          font-weight: 750;
          font-size: 0.92rem;
          letter-spacing: -0.01em;
        }

        .row-actions {
          display: inline-flex;
          gap: 5px;
        }
        .row-actions .icon-btn {
          width: 28px;
          height: 28px;
          border-radius: 7px;
        }

        .desktop-only {
          display: table-cell;
        }
        div.desktop-only {
          display: block;
        }
        .mobile-only {
          display: none !important;
        }

        /* Footer pagination */
        .ex-foot {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          padding: 10px 16px;
          border-top: 1px solid var(--border-glass);
        }
        .ex-count {
          font-size: 0.78rem;
          color: var(--text-secondary);
        }
        .paging {
          display: flex;
          align-items: center;
          gap: 5px;
          flex-wrap: wrap;
        }
        .page-btn {
          min-width: 28px;
          height: 28px;
          padding: 0 6px;
          border-radius: 7px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-secondary);
          font-family: inherit;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition);
        }
        @media (hover: hover) {
          .page-btn:hover:not(:disabled):not(.active) {
            background: rgba(255, 255, 255, 0.06);
            color: var(--text-primary);
            border-color: var(--border-strong);
          }
        }
        .page-btn.active {
          background: var(--primary);
          color: var(--primary-fg);
          border-color: var(--primary);
        }
        .page-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .page-ellipsis {
          color: var(--text-muted);
          padding: 0 2px;
          font-size: 0.78rem;
        }
        .modal-body {
          margin: 14px 0;
          font-size: 0.93rem;
          color: var(--text-secondary);
          line-height: 1.65;
        }
        .form-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 16px;
        }
        .banner.error-banner {
          background: rgba(251, 113, 133, 0.12);
          border: 1px solid rgba(251, 113, 133, 0.3);
          color: #fda4af;
        }

        /* Mobile View: High density single row layout */
        @media (max-width: 768px) {
          .desktop-only {
            display: none !important;
          }
          .mobile-only {
            display: flex !important;
          }
          .ex-toolbar {
            padding: 12px 14px;
            gap: 10px;
            flex-direction: column;
          }
          .search-wrap {
            width: 100%;
            flex: none;
          }
          .filters-group {
            width: 100%;
            display: flex;
            gap: 8px;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 4px;
            scrollbar-width: none;
          }
          .filters-group::-webkit-scrollbar {
            display: none;
          }
          .ex-select {
            flex: 0 0 auto;
            width: auto;
            min-width: 135px;
            font-size: 0.8rem;
            padding: 6px 26px 6px 10px;
            height: 34px;
          }

          .ex-tally {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 6px;
            padding: 10px 12px;
          }
          .tally-chips {
            display: contents;
          }
          .tally-chip {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 6px 4px;
            border-radius: 10px;
            font-size: 0.68rem;
            gap: 2px;
            text-align: center;
          }
          .tally-chip span {
            font-size: 0.65rem;
            opacity: 0.8;
          }
          .tally-chip strong {
            font-size: 0.76rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }
          .tally-count {
            display: none;
          }

          .tx-table,
          .tx-table tbody {
            display: block !important;
            width: 100% !important;
          }
          .tx-table thead {
            display: none !important;
          }
          .tx-table tbody tr.tx-row {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
            padding: 12px 14px !important;
            gap: 12px !important;
            border-bottom: 1px solid var(--border-glass) !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .tx-table tbody tr.tx-row:last-child {
            border-bottom: none !important;
          }
          .tx-table tbody tr.tx-row td.col-main {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            flex: 1 1 auto !important;
            min-width: 0 !important;
            padding: 0 !important;
            border: none !important;
          }
          .type-dot {
            width: 32px;
            height: 32px;
            border-radius: 9px;
            flex-shrink: 0;
          }
          .table-scroll {
            overflow-x: hidden;
          }
          .tx-info {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 2px;
            min-width: 0;
            flex: 1;
            width: 100%;
          }
          .tx-title {
            font-size: 0.88rem;
            font-weight: 700;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            max-width: none;
            line-height: 1.25;
          }
          .tx-sub {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 0.7rem;
            color: var(--text-muted);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            max-width: none;
          }
          .dot-sep {
            color: var(--border-strong);
            font-size: 0.65rem;
          }
          .goal-subtag {
            color: #34d399;
            font-weight: 600;
          }

          .tx-table tbody tr.tx-row td.col-amount {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-end !important;
            justify-content: center !important;
            flex: 0 0 auto !important;
            padding: 0 !important;
            border: none !important;
            text-align: right !important;
          }
          .amount-cell-inner {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 4px;
          }
          .tx-amount {
            font-size: 0.92rem;
            font-weight: 800;
            letter-spacing: -0.01em;
            line-height: 1.2;
            white-space: nowrap;
          }
          .row-actions.mobile-only {
            display: flex;
            gap: 4px;
          }
          .row-actions.mobile-only .icon-btn {
            width: 24px;
            height: 24px;
            border-radius: 6px;
          }

          .ex-foot {
            padding: 12px 14px;
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
}
