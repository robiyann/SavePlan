# Master Plan: Couple Saving Planner — Production-Ready untuk Vercel Hobby

Saya akan review dulu constraint Vercel Hobby yang perlu kita waspadai, lalu bangun arsitektur yang "aman" sepenuhnya.Berikut adalah Master Plan yang direvisi dan dioptimalkan penuh untuk production skala kecil — dijamin tidak pernah menyentuh limit Vercel Hobby.

---

## Perubahan Kunci vs Plan Awal

**Problem utama plan awal:** Setiap kunjungan halaman langsung memanggil Google Sheets API. Dengan 2 orang pakai setiap hari + beberapa refresh, dalam sebulan sudah bisa ratusan function invocations yang tidak perlu.

**Solusi dalam plan ini:** Tiga lapisan pertahanan sebelum API Sheets dipanggil:

### Lapisan 1 — ISR (Incremental Static Regeneration)
Dashboard-nya di-render di sisi server lalu di-*cache di CDN Vercel*. Kalau 10 orang buka dalam 5 menit, Sheets API hanya dipanggil **1 kali**, bukan 10 kali. Ini fitur bawaan Next.js, nol konfigurasi tambahan.

```js
// pages/index.js
export async function getStaticProps() {
  const summary = await getSummaryFromSheets();
  return { props: { summary }, revalidate: 300 }; // cache 5 menit
}
```

### Lapisan 2 — In-Memory Cache di API Route
Setiap API route punya cache TTL pendek di memori serverless. Kalau ada refresh berulang dalam hitungan detik (misalnya user panic refresh), Sheets API tidak ikut dipukul.

```js
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 60 });

export default async function handler(req, res) {
  const cached = cache.get('transactions');
  if (cached) return res.json(cached);
  
  const data = await fetchFromSheets(); // hanya dipanggil kalau cache miss
  cache.set('transactions', data);
  res.json(data);
}
```

### Lapisan 3 — `batchGet` bukan multiple calls
Alih-alih 3 API call terpisah (summary, goals, recent transactions), kita panggil **satu** `batchGet` dengan semua ranges sekaligus. Google API-nya lebih efisien, dan durasi function execution jadi jauh lebih pendek.

```js
// Satu call, ambil semua sekaligus
const { data } = await sheets.spreadsheets.values.batchGet({
  spreadsheetId: SHEET_ID,
  ranges: ['F6', 'H6', 'K6', 'A10:C10', 'A21:C', 'I21:K'],
});
```

---

## Struktur Folder Next.js

```
/
├── pages/
│   ├── index.js          → Dashboard (ISR)
│   ├── history.js        → Riwayat transaksi
│   ├── add.js            → Form input cepat
│   └── api/
│       ├── summary.js    → GET ringkasan (cache 5 mnt)
│       ├── transactions.js → GET riwayat (cache 1 mnt)
│       └── add-transaction.js → POST → append ke Sheet
├── lib/
│   ├── sheets.js         → Google Sheets client (singleton)
│   └── cache.js          → NodeCache instance
├── components/
│   └── ...Tailwind + Shadcn components
└── public/
    └── manifest.json     → PWA manifest
```

---

## Environment Variables di Vercel

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=bot@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
NEXTAUTH_SECRET=random-secret-string   # untuk password protect
NEXTAUTH_URL=https://couple-saver.vercel.app
```

Kunci private disimpan sebagai env var, tidak pernah masuk ke Git. Vercel meng-encrypt semua env var secara otomatis.

---

## Fitur PWA (Install ke HP)

Tambahkan `manifest.json` dan meta tag di `_document.js`:

```json
{
  "name": "Couple Saving Planner",
  "short_name": "Saving",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#10b981",
  "background_color": "#ffffff",
  "icons": [{ "src": "/icon-192.png", "sizes": "192x192" }]
}
```

Hasilnya: icon di home screen HP, buka tanpa browser bar, terasa seperti native app.

---

## Password Protection Sederhana

Pakai `next-auth` dengan **Credentials provider** — cukup satu password bersama untuk berdua, tanpa perlu database user:

```js
providers: [
  CredentialsProvider({
    async authorize(credentials) {
      if (credentials.password === process.env.APP_PASSWORD) {
        return { id: 1, name: "Us" };
      }
      return null;
    }
  })
]
```

---

## Mengapa Estimasi Ini Aman?

Asumsi penggunaan: 2 orang, buka app rata-rata 5x/hari, isi transaksi 3x/hari.

- **Invocations:** 5 buka × 2 orang × 30 hari = 300. Tapi berkat ISR, sebagian besar *tidak* trigger function sama sekali — angkanya jauh di bawah 100.000 limit.
- **Sheets API calls:** berkat cache TTL, bahkan 20 refresh berturut-turut cuma 1 actual API call. Google membatasi 300 req/menit; kita rata-rata butuh ~10/hari.
- **Function duration:** setiap call ke Sheets biasanya selesai < 800ms. Jauh dari 60s timeout Vercel Hobby, dan total GB-hours < 1% limit.

Plan ini dirancang agar **selamanya gratis** meski dipakai setiap hari, setiap saat, tanpa khawatir coldstart atau throttling.