import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { HomeIcon, ClockIcon, TargetIcon, UsersIcon, PlusIcon, LogoutIcon, HeartIcon } from './Icons';

const LINKS = [
  { href: '/', label: 'Dashboard', icon: HomeIcon, key: 'dashboard' },
  { href: '/history', label: 'Riwayat', icon: ClockIcon, key: 'history' },
  { href: '/goals', label: 'Target', icon: TargetIcon, key: 'goals' },
  { href: '/users', label: 'Anggota', icon: UsersIcon, key: 'users' },
  { href: '/add', label: 'Catat', icon: PlusIcon, key: 'add' },
];

/**
 * Kerangka aplikasi v3:
 * - Desktop (>=1024px): sidebar tetap di kiri (brand, nav vertikal, blok user)
 * - Mobile: top bar ringkas + tab bar di dasar layar dengan indikator titik
 * Halaman memakai: <AppShell activePage crumb title subtitle action>{konten}</AppShell>
 */
export default function AppShell({ activePage, crumb, title, subtitle, action, children }) {
  const { data: session } = useSession();

  const navLinks = LINKS.map(({ href, label, icon: Icon, key }) => (
    <Link key={key} href={href} className={`side-link ${activePage === key ? 'active' : ''}`}>
      <Icon size={18} />
      <span>{label}</span>
    </Link>
  ));

  const tabs = LINKS.map(({ href, label, icon: Icon, key }) => (
    <Link key={key} href={href} className={`tab ${activePage === key ? 'active' : ''}`}>
      <Icon size={19} />
      <span>{label}</span>
      <i className="tab-dot" aria-hidden="true" />
    </Link>
  ));

  return (
    <div className="app-frame">
      {/* Ambient Glow Background Layer */}
      <div className="ambient-background" aria-hidden="true">
        <div className="ambient-orb orb-1" />
        <div className="ambient-orb orb-2" />
        <div className="ambient-orb orb-3" />
        <div className="ambient-grid-overlay" />
      </div>

      {/* Sidebar desktop */}
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-icon"><HeartIcon size={16} filled /></span>
          <span className="brand-text">
            <strong>Couple Saver</strong>
            <small>Bismillah • Saving Planner</small>
          </span>
        </Link>

        <nav className="side-nav">
          <div className="side-label">Menu</div>
          {navLinks}
        </nav>

        <div className="side-foot">
          <div className="side-user">
            <span className="side-avatar">{session?.user?.name?.charAt(0) || 'C'}</span>
            <div className="side-user-info">
              <strong>{session?.user?.name || 'Couple'}</strong>
              <small>Masuk</small>
            </div>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="side-logout">
            <LogoutIcon size={15} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Area konten */}
      <div className="main-area">
        <header className="mobile-topbar">
          <Link href="/" className="mobile-brand">
            <span className="brand-icon"><HeartIcon size={14} filled /></span>
            <strong>Couple Saver</strong>
            <span className="mobile-brand-tag">بِسْمِ اللَّهِ</span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="icon-ghost"
            title="Keluar"
            aria-label="Keluar"
          >
            <LogoutIcon size={16} />
          </button>
        </header>

        <div className="content">
          <div className="page-head">
            <div className="page-head-text">
              {crumb && <div className="crumb">{crumb}</div>}
              <h1>{title}</h1>
              {subtitle && <p>{subtitle}</p>}
            </div>
            {action && <div className="page-action">{action}</div>}
          </div>
          {children}
        </div>
      </div>

      {/* Tab bar mobile */}
      <nav className="tabbar">{tabs}</nav>
    </div>
  );
}
