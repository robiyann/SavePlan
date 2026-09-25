import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { getDashboardData } from '../lib/sheets';
import AppShell from '../components/AppShell';
import Ring from '../components/Ring';
import { CoinsIcon, TargetIcon, HourglassIcon, AlertTriangleIcon, PlusIcon, TrendUpIcon, TrendDownIcon, SparklesIcon } from '../components/Icons';
import { CoupleSavingsIllustration, EmptyHistoryIllustration } from '../components/Illustrations';

export async function getStaticProps() {
  try {
    const data = await getDashboardData();
    // Stringify & parse untuk menghindari error serialization Next.js
    return {
      props: {
        initialData: JSON.parse(JSON.stringify(data)),
      },
      revalidate: 300, // Revalidate setiap 5 menit
    };
  } catch (error) {
    console.error('ISR getStaticProps failed:', error);
    return {
      props: {
        initialData: null,
      },
      revalidate: 60,
    };
  }
}

export default function Dashboard({ initialData }) {
  const { data: session, status } = useSession({ required: true });
  const [data, setData] = useState(initialData);
  const [loadingFresh, setLoadingFresh] = useState(false);

  // Ambil data terbaru di client side setelah login
  useEffect(() => {
    if (status === 'authenticated') {
      setLoadingFresh(true);
      fetch('/api/summary')
        .then((res) => res.json())
        .then((freshData) => {
          if (!freshData.error) {
            setData(freshData);
          }
          setLoadingFresh(false);
        })
        .catch((err) => {
          console.error('Gagal mengambil data terbaru:', err);
          setLoadingFresh(false);
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

  // Fallback data jika sheets error
  const totalSavings = data?.totalSavings || 0;
  const savingTarget = data?.savingTarget || 30000000;
  const sisaTarget = Math.max(0, savingTarget - totalSavings);
  const progressPercent = data?.progressPercent || '0%';
  const progressValue = parseFloat(progressPercent) || 0;
  const goals = data?.goals || [];

  // Urutkan terbaru di atas (data di Sheet tersimpan kronologis terlama-di-atas).
  // Tanggal format YYYY-MM-DD jadi perbandingan string sudah benar; tanggal sama
  // dibalik urutan barisnya karena baris yang lebih bawah = input lebih baru.
  const recentTransactions = [...(data?.recentTransactions || [])]
    .map((tx, i) => ({ tx, i }))
    .sort((a, b) => {
      const da = a.tx[0] || '';
      const db = b.tx[0] || '';
      if (da !== db) return da < db ? 1 : -1;
      return b.i - a.i;
    })
    .map(({ tx }) => tx);

  // Format IDR Rupiah
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

  return (
    <div>
      <Head>
        <title>Dashboard — Couple Saving Planner</title>
        <meta name="description" content="Dashboard rencana tabungan bersama." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <AppShell
        activePage="dashboard"
        crumb="Dashboard"
        title={`Halo, ${session?.user?.name || 'Couple'}! 👋`}
        subtitle="Bismillah, berikut perkembangan tabungan bersama kita hari ini."
        action={
          <Link href="/add" className="btn btn-primary head-cta">
            <PlusIcon size={16} />
            <span>Catat Transaksi</span>
          </Link>
        }
      >
        <div className="animate-fade-in">
          {data?.isMock && (
            <div className="warning-banner">
              <AlertTriangleIcon size={18} />
              <span>Menggunakan <strong>Database Lokal (Mode Demo)</strong> karena kredensial Google Sheets belum dikonfigurasi di env.</span>
            </div>
          )}
          {/* Hero Banner Kaca dengan Ilustrasi Pasangan */}
          <div className="hero-glass-card">
            <div className="hero-glass-content">
              <span className="hero-glass-badge">
                <SparklesIcon size={13} />
                <span className="badge-arabic">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>
              </span>
              <h2 className="hero-glass-title">Bismillah, Wujudkan Impian Bersama</h2>
              <p className="hero-glass-desc">
                Setiap rupiah yang disisihkan dengan niat baik membawa berkah dan semakin mendekatkan kita ke target masa depan. Tetap konsisten dan pantau perkembangannya di sini!
              </p>
            </div>
            <div className="hero-glass-art">
              <CoupleSavingsIllustration width={240} height={160} />
            </div>
          </div>

          {/* Baris atas: ring progres + ringkasan */}
          <div className="dash-top">
            <section className="card card-pad ring-card">
              <div className="card-heading">Progres Target Utama</div>
              <div className="ring-center">
                <Ring percent={progressValue} size={168} stroke={13} gradient="emerald" glow>
                  <span className="ring-big">{progressPercent}</span>
                  <span className="ring-small">tercapai</span>
                </Ring>
                <div className="ring-caption">
                  <span className="ring-caption-label">Tabungan Bersama Pasangan</span>
                  <span className="ring-caption-sub">RUMAH</span>
                </div>
              </div>
            </section>

            <section className="card card-pad stat-list-card">
              <div className="card-heading">Ringkasan</div>
              <div className="stat-rows">
                <div className="stat-row">
                  <span className="stat-ic ic-success"><CoinsIcon size={18} /></span>
                  <div className="stat-meta">
                    <span className="stat-label">Saldo Bersama</span>
                    <span className="stat-value">{formatIDR(totalSavings)}</span>
                  </div>
                </div>
                <div className="stat-row">
                  <span className="stat-ic ic-primary"><TargetIcon size={18} /></span>
                  <div className="stat-meta">
                    <span className="stat-label">Target Tabungan</span>
                    <span className="stat-value">{formatIDR(savingTarget)}</span>
                  </div>
                </div>
                <div className="stat-row">
                  <span className="stat-ic ic-warning"><HourglassIcon size={18} /></span>
                  <div className="stat-meta">
                    <span className="stat-label">Sisa Target</span>
                    <span className="stat-value">{formatIDR(sisaTarget)}</span>
                  </div>
                </div>
              </div>
              <div className="mini-progress">
                <div className="mini-progress-track">
                  <div className="mini-progress-fill" style={{ width: progressPercent }}></div>
                </div>
                <div className="mini-progress-caption">
                  <span>{formatIDR(totalSavings)}</span>
                  <span>{formatIDR(savingTarget)}</span>
                </div>
              </div>
            </section>
          </div>

          {/* Baris bawah: aktivitas + target */}
          <div className="dash-bottom">
            <section className="card">
              <div className="card-title">
                <h2>Aktivitas Terakhir</h2>
                <Link href="/history" className="see-all">Lihat semua</Link>
              </div>
              <div className="timeline">
                {recentTransactions.length === 0 ? (
                  <div className="empty-illustration-wrap">
                    <EmptyHistoryIllustration width={180} height={130} />
                    <p>Belum ada riwayat transaksi yang tercatat.</p>
                  </div>
                ) : (
                  recentTransactions.slice(0, 5).map((tx, idx) => {
                    const [date, category, amount, desc, user, goalName] = tx;
                    const amt = Number(amount) || 0;
                    const isExpense = amt < 0;

                    return (
                      <div key={idx} className="tl-item">
                        <span className={`tl-dot ${isExpense ? 'out' : 'in'}`}>
                          {isExpense ? <TrendDownIcon size={11} /> : <TrendUpIcon size={11} />}
                        </span>
                        <div className="tl-body">
                          <span className="tl-title">{desc || category}</span>
                          <span className="tl-meta">{formatDateDMY(date)} • {user} • {goalName || 'Umum'}</span>
                        </div>
                        <span className={`tl-amount ${isExpense ? 'expense-text' : 'income-text'}`}>
                          {isExpense ? '' : '+'}{formatIDR(amt)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <section className="card">
              <div className="card-title">
                <h2>Target (Goals)</h2>
                <Link href="/goals" className="see-all">Kelola</Link>
              </div>
              <div className="goal-rings">
                {goals.length === 0 ? (
                  <p className="empty-text">Belum ada target khusus yang dibuat.</p>
                ) : (
                  goals.map((goal, idx) => {
                    const goalName = goal[0];
                    const goalTarget = Number(goal[1]) || 1;
                    const goalSaved = Number(goal[2]) || 0;
                    const goalPercent = Math.min(100, Math.round((goalSaved / goalTarget) * 100));
                    return (
                      <div key={idx} className="goal-ring-row">
                        <Ring
                          percent={goalPercent}
                          size={54}
                          stroke={6}
                          gradient={idx % 3 === 0 ? 'violet' : idx % 3 === 1 ? 'cyan' : 'rose'}
                          glow={false}
                        >
                          <span className="goal-ring-pct">{goalPercent}%</span>
                        </Ring>
                        <div className="goal-ring-info">
                          <span className="goal-ring-name">{goalName}</span>
                          <span className="goal-ring-ratio">{formatIDR(goalSaved)} / {formatIDR(goalTarget)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        </div>
      </AppShell>
    </div>
  );
}
