/**
 * Komponen SVG Ilustrasi bertema keuangan & pasangan (gaya unDraw).
 * Didesain responsif dan harmonis dengan tema dark glass.
 */

export function CoupleSavingsIllustration({ width = 280, height = 200, className = '' }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cs-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="cs-glow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="cs-vault" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#27272a" />
          <stop offset="100%" stopColor="#18181b" />
        </linearGradient>
      </defs>

      {/* Lantai / Soft Glow Shadow */}
      <ellipse cx="200" cy="275" rx="170" ry="18" fill="url(#cs-glow)" />

      {/* Karakter Kiri (Laki-laki / Pasangan 1) */}
      <g transform="translate(60, 90)">
        {/* Kepala & Rambut */}
        <circle cx="45" cy="35" r="18" fill="#fcd34d" />
        <path d="M28 28C30 18 42 16 52 18C58 20 62 25 61 34C55 30 48 30 38 33C33 34 30 31 28 28Z" fill="#3f3f46" />
        {/* Badan / Baju */}
        <path d="M25 65C25 55 35 50 45 50C55 50 65 55 65 65V145H25V65Z" fill="#3b82f6" />
        {/* Tangan Kanan Memegang Koin */}
        <path d="M60 68L86 92L94 86L70 60" fill="#3b82f6" stroke="#2563eb" strokeWidth="2" />
        <circle cx="94" cy="86" r="7" fill="#fcd34d" />
        {/* Celana */}
        <path d="M27 145H43V180H27V145Z" fill="#27272a" />
        <path d="M47 145H63V180H47V145Z" fill="#27272a" />
      </g>

      {/* Brankas / Celengan Bersama di Tengah */}
      <g transform="translate(150, 110)">
        {/* Box Celengan Kaca Futuristik */}
        <rect x="0" y="10" width="100" height="120" rx="20" fill="url(#cs-vault)" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
        <rect x="8" y="18" width="84" height="104" rx="14" fill="rgba(16, 185, 129, 0.08)" stroke="rgba(52, 211, 153, 0.25)" strokeDasharray="3 3" />
        
        {/* Koin bertumpuk di dalam brankas */}
        <ellipse cx="50" cy="105" rx="26" ry="7" fill="#f59e0b" />
        <ellipse cx="50" cy="100" rx="26" ry="7" fill="#fbbf24" />
        <ellipse cx="50" cy="90" rx="22" ry="6" fill="#f59e0b" />
        <ellipse cx="50" cy="85" rx="22" ry="6" fill="#fbbf24" />
        <ellipse cx="50" cy="75" rx="18" ry="5" fill="#f59e0b" />
        <ellipse cx="50" cy="70" rx="18" ry="5" fill="#fbbf24" />

        {/* Simbol Hati Bersama di Celengan */}
        <path
          d="M50 48C46 40 34 40 34 49C34 56 46 63 50 67C54 63 66 56 66 49C66 40 54 40 50 48Z"
          fill="#f43f5e"
        />

        {/* Lubang Masuk Koin Atas */}
        <rect x="35" y="6" width="30" height="5" rx="2.5" fill="#71717a" />
      </g>

      {/* Koin Melayang / Aura */}
      <g transform="translate(190, 48)">
        <circle cx="10" cy="20" r="14" fill="url(#cs-grad1)" />
        <text x="10" y="25" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">Rp</text>
        <path d="M-5 10L-15 5M25 10L35 5M10 -5L10 -15" stroke="rgba(52,211,153,0.6)" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Karakter Kanan (Perempuan / Pasangan 2) */}
      <g transform="translate(255, 90)">
        {/* Kepala & Rambut Panjang */}
        <path d="M22 36C22 18 36 12 48 14C60 16 68 28 68 45C68 62 64 68 62 70L56 50H32L26 70C23 68 22 55 22 36Z" fill="#3f3f46" />
        <circle cx="45" cy="35" r="17" fill="#fcd34d" />
        {/* Badan / Dress */}
        <path d="M30 65C30 55 38 52 46 52C54 52 62 55 62 65L70 145H22L30 65Z" fill="#ec4899" />
        {/* Tangan Kiri Menunjuk ke Celengan */}
        <path d="M32 68L8 90L3 83L25 62" fill="#ec4899" stroke="#db2777" strokeWidth="2" />
        {/* Kaki */}
        <path d="M33 145H45V180H33V145Z" fill="#fbcfe8" />
        <path d="M48 145H60V180H48V145Z" fill="#fbcfe8" />
      </g>
    </svg>
  );
}

export function GoalsTargetIllustration({ width = 240, height = 180, className = '' }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 320 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="gt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>

      {/* Target Dartboard / Dream Target */}
      <ellipse cx="160" cy="220" rx="120" ry="14" fill="rgba(139, 92, 246, 0.15)" />

      {/* Papan Target Lingkaran */}
      <circle cx="160" cy="110" r="85" fill="#18181b" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
      <circle cx="160" cy="110" r="68" fill="rgba(139, 92, 246, 0.12)" stroke="rgba(139, 92, 246, 0.3)" strokeWidth="2" />
      <circle cx="160" cy="110" r="50" fill="#27272a" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
      <circle cx="160" cy="110" r="32" fill="url(#gt-grad)" />
      <circle cx="160" cy="110" r="14" fill="#ffffff" />

      {/* Panah Tertancap Tepat di Tengah (Bulls Eye) */}
      <path d="M225 45L165 105" stroke="#34d399" strokeWidth="5" strokeLinecap="round" />
      <path d="M225 45L232 40L235 48L225 45Z" fill="#34d399" />
      <path d="M218 38L236 44L230 62" stroke="#34d399" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Mini Ikon Impian: Rumah, Liburan, Cincin */}
      <g transform="translate(60, 40)">
        {/* Rumah Kecil Impian */}
        <rect x="0" y="16" width="36" height="24" rx="4" fill="#27272a" stroke="#10b981" strokeWidth="1.5" />
        <path d="M-4 16L18 0L40 16H-4Z" fill="#10b981" />
        <rect x="13" y="24" width="10" height="16" rx="2" fill="#34d399" />
      </g>

      <g transform="translate(230, 130)">
        {/* Bintang / Sukses */}
        <path
          d="M15 0L19 10L30 11L22 18L24 29L15 23L6 29L8 18L0 11L11 10L15 0Z"
          fill="#fbbf24"
        />
      </g>
    </svg>
  );
}

export function EmptyHistoryIllustration({ width = 220, height = 160, className = '' }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 280 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <ellipse cx="140" cy="180" rx="90" ry="12" fill="rgba(255,255,255,0.04)" />

      {/* Buku Catatan / Folder Riwayat Transparan */}
      <g transform="translate(85, 30)">
        <rect x="0" y="0" width="110" height="135" rx="14" fill="#1f1f23" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
        <rect x="12" y="15" width="86" height="105" rx="8" fill="rgba(255,255,255,0.02)" />
        
        {/* Garis-garis buku kosong */}
        <line x1="25" y1="35" x2="85" y2="35" stroke="rgba(255,255,255,0.15)" strokeWidth="3" strokeLinecap="round" />
        <line x1="25" y1="55" x2="70" y2="55" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="25" y1="75" x2="78" y2="75" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="25" y1="95" x2="55" y2="95" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" strokeLinecap="round" />

        {/* Kaca Pembesar Melayang */}
        <circle cx="75" cy="85" r="22" fill="rgba(16, 185, 129, 0.15)" stroke="#34d399" strokeWidth="2.5" />
        <line x1="91" y1="101" x2="108" y2="118" stroke="#34d399" strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function LoginCoupleHero({ width = 360, height = 260, className = '' }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 420 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lh-glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ec4899" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      <ellipse cx="210" cy="270" rx="180" ry="20" fill="url(#lh-glow)" />

      {/* Gembok Kaca / Perlindungan Privasi */}
      <g transform="translate(165, 80)">
        <rect x="0" y="45" width="90" height="95" rx="18" fill="#18181b" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
        <path d="M22 45V30C22 17.5 32 8 45 8C58 8 68 17.5 68 30V45" stroke="#f43f5e" strokeWidth="6" strokeLinecap="round" fill="none" />
        {/* Lubang Kunci Hati */}
        <circle cx="45" cy="85" r="10" fill="#f43f5e" />
        <path d="M42 90L40 108H50L48 90Z" fill="#f43f5e" />
      </g>

      {/* Pasangan Bergandengan */}
      {/* Pasangan Pria */}
      <g transform="translate(75, 110)">
        <circle cx="35" cy="25" r="16" fill="#fcd34d" />
        <path d="M20 20C22 10 32 8 42 10C48 12 50 18 50 24C45 22 40 22 30 25C25 26 22 23 20 20Z" fill="#3f3f46" />
        <rect x="18" y="45" width="34" height="75" rx="10" fill="#3b82f6" />
        <path d="M52 65L82 78" stroke="#3b82f6" strokeWidth="5" strokeLinecap="round" />
        <rect x="20" y="120" width="14" height="40" rx="4" fill="#27272a" />
        <rect x="36" y="120" width="14" height="40" rx="4" fill="#27272a" />
      </g>

      {/* Pasangan Wanita */}
      <g transform="translate(285, 110)">
        <circle cx="25" cy="25" r="16" fill="#fcd34d" />
        <path d="M10 22C12 8 26 6 36 8C44 10 46 16 46 22C46 38 42 42 40 45L34 32H20L14 45C12 42 10 32 10 22Z" fill="#3f3f46" />
        <path d="M12 45L38 45L46 120H4L12 45Z" fill="#ec4899" />
        <path d="M8 65L-22 78" stroke="#ec4899" strokeWidth="5" strokeLinecap="round" />
        <rect x="12" y="120" width="10" height="40" rx="3" fill="#fbcfe8" />
        <rect x="28" y="120" width="10" height="40" rx="3" fill="#fbcfe8" />
      </g>

      {/* Simbol Cinta Bersinar di Atas */}
      <g transform="translate(192, 28)">
        <path
          d="M18 10C15 4 6 4 6 12C6 18 18 25 18 29C18 25 30 18 30 12C30 4 21 4 18 10Z"
          fill="#f43f5e"
        />
        <circle cx="8" cy="8" r="2" fill="#ffffff" opacity="0.6" />
      </g>
    </svg>
  );
}
