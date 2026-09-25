import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../lib/auth';
import { HeartIcon, AlertTriangleIcon, TargetIcon, UsersIcon, CoinsIcon } from '../components/Icons';
import { LoginCoupleHero } from '../components/Illustrations';

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (session) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
  return { props: {} };
}

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        password: password.trim(),
        redirect: false,
      });

      console.log('signIn response:', res);
      if (!res?.ok) {
        setError(res?.error === 'CredentialsSignin' ? 'Password salah! Coba lagi.' : `Error: ${res?.error || 'Login gagal'}`);
        setLoading(false);
      } else {
        router.push('/');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan.');
      setLoading(false);
    }
  };

  return (
    <div className="login-split">
      {/* Ambient Glow Background Layer */}
      <div className="ambient-background" aria-hidden="true">
        <div className="ambient-orb orb-1" />
        <div className="ambient-orb orb-2" />
        <div className="ambient-orb orb-3" />
        <div className="ambient-grid-overlay" />
      </div>

      <Head>
        <title>Login — Couple Saving Planner</title>
        <meta name="description" content="Akses dashboard tabungan bersama berdua." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Panel brand — desktop kiri, mobile atas */}
      <div className="login-brand animate-fade-in">
        <div className="login-brand-inner">
          <div className="login-top-row">
            <div className="login-logo">
              <HeartIcon size={22} filled />
            </div>
            <span className="arabic-tag">بِسْمِ اللَّهِ</span>
          </div>
          <h1>Couple<br />Saver</h1>
          <p>Bismillah, satu tempat untuk mencatat tabungan, target, dan mewujudkan rencana masa depan kita berdua.</p>
          <div style={{ margin: '18px 0 22px', display: 'flex', justifyContent: 'center' }}>
            <LoginCoupleHero width={300} height={190} />
          </div>
          <ul className="login-points">
            <li><CoinsIcon size={17} /><span>Saldo bersama selalu terhitung otomatis</span></li>
            <li><TargetIcon size={17} /><span>Target tabungan dengan progres jelas</span></li>
            <li><UsersIcon size={17} /><span>Catat siapa saja yang menyetor</span></li>
          </ul>
        </div>
      </div>

      {/* Panel form */}
      <div className="login-form-pane">
        <form className="login-box animate-fade-in" onSubmit={handleSubmit}>
          <div className="login-box-head">
            <h2>Selamat datang kembali</h2>
            <p>Masukkan password bersama untuk membuka dashboard.</p>
          </div>

          {error && (
            <div className="error-message">
              <AlertTriangleIcon size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="input-group">
            <label className="input-label" htmlFor="password">Password Akses</label>
            <input
              id="password"
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
            {loading ? 'Memvalidasi...' : 'Masuk ke Dashboard'}
          </button>

          <p className="login-hint">Satu password bersama untuk berdua — tanpa akun, tanpa ribet.</p>
        </form>
      </div>
    </div>
  );
}
