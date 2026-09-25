# Couple Saving Planner 💑💰

> **Aplikasi PWA Perencana & Pencatat Keuangan Bersama untuk Pasangan**  
> Dibangun dengan **Next.js 14 (Pages Router)**, terintegrasi langsung dengan **Google Sheets** sebagai database cloud (lengkap dengan mode demo offline lokal `db.json`), diproteksi kata sandi bersama via **NextAuth.js**, dan didesain dengan antarmuka **Dark Glassmorphism** modern.

---

## 📑 Daftar Isi
1. [Fitur Utama](#-fitur-utama)
2. [Arsitektur & Free Tier Vercel Hobby](#-arsitektur--free-tier-vercel-hobby)
3. [Panduan Lengkap Mendapatkan Kredensial (Environment Variables)](#-panduan-lengkap-mendapatkan-kredensial-environment-variables)
   - [A. Google Sheets API & Service Account](#a-google-sheets-api--service-account)
   - [B. Menyiapkan Spreadsheet & Hak Akses](#b-menyiapkan-spreadsheet--hak-akses)
   - [C. NextAuth Secret & App Password](#c-nextauth-secret--app-password)
4. [Instalasi & Menjalankan di Komputer Lokal](#-instalasi--menjalankan-di-komputer-lokal)
5. [Panduan Lengkap Deploy ke Vercel](#-panduan-lengkap-deploy-ke-vercel)
6. [Struktur Folder & Komponen](#-struktur-folder--komponen)
7. [Panduan Instalasi PWA (Mobile / HP)](#-panduan-instalasi-pwa-mobile--hp)

---

## ✨ Fitur Utama

- **Pencatatan Keuangan Real-Time**: Catat pemasukan (menabung) maupun pengeluaran bersama dengan kategori dinamis.
- **Monitoring Target Impian (Goals)**: Pantau progres tabungan spesifik (misal: Rumah, Pernikahan, Liburan) dengan progress bar berkilau (*neon glow*).
- **Format Tabel Riwayat High-Density**: Tampilan desktop rapi dan mode mobile hemat ruang (~52px per transaksi) ala aplikasi mobile banking modern.
- **PWA (Progressive Web App)**: Dapat di-*install* langsung ke layar utama smartphone tanpa lewat Play Store / App Store.
- **Dual Mode (Cloud & Local Fallback)**: Jika kuota API Google habis atau offline, sistem otomatis membaca dan menulis ke `db.json` lokal tanpa membuat aplikasi crash.
- **Satu Password Bersama**: Pasangan tidak perlu membuat akun masing-masing; cukup satu password bersama untuk login berdua.

---

## ⚡ Arsitektur & Free Tier Vercel Hobby

Aplikasi ini dirancang khusus agar **100% selamanya gratis** di Vercel Hobby Plan melalui 3 lapisan perlindungan:

1. **ISR (Incremental Static Regeneration)**: Halaman utama (`pages/index.js`) di-cache di CDN Vercel selama 300 detik (5 menit). Kunjungan berulang tidak memicu eksekusi serverless.
2. **In-Memory Cache (NodeCache)**: API endpoint (`/api/summary` & `/api/transactions`) menyimpan data di memori selama 60–300 detik.
3. **Single `batchGet`**: Pembacaan data Google Sheet hanya menggunakan **1 panggilan API** untuk seluruh rentang sel sekaligus (`F6`, `H6`, `K6`, `A10:C10`, `A21:F`, `I21:K`, `N21:N`).

---

## 🔑 Panduan Lengkap Mendapatkan Kredensial (Environment Variables)

Berikut adalah daftar variabel lingkungan yang dibutuhkan:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
GOOGLE_SHEET_ID=...
APP_PASSWORD=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
```

---

### A. Google Sheets API & Service Account

Aplikasi ini menggunakan **Service Account Google Cloud** agar server Vercel dapat membaca dan menulis ke Google Spreadsheet tanpa meminta login akun Google secara manual.

#### Langkah 1: Buat Proyek Google Cloud
1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Login dengan akun Google Anda.
3. Di pojok kiri atas, klik dropdown project > klik **New Project** (*Proyek Baru*).
4. Beri nama proyek, misalnya: `couple-saving-app` > klik **Create**.

#### Langkah 2: Aktifkan Google Sheets API
1. Pastikan proyek yang baru dibuat sedang aktif.
2. Di menu navigasi samping kiri, pilih **APIs & Services** > **Library**.
3. Di kolom pencarian, ketik `Google Sheets API`.
4. Klik **Google Sheets API** > klik tombol **Enable** (*Aktifkan*).

#### Langkah 3: Buat Service Account (Akun Layanan)
1. Buka menu **APIs & Services** > **Credentials** (*Kredensial*).
2. Klik **+ CREATE CREDENTIALS** di bagian atas > pilih **Service account**.
3. Isi informasi:
   - **Service account name**: `couple-bot` (bebas)
   - **Service account ID**: akan terisi otomatis
4. Klik **Create and Continue**.
5. Pada bagian role (*Peran*), pilih **Editor** (atau Project > Editor).
6. Klik **Continue** lalu klik **Done**.

#### Langkah 4: Buat Kunci Privat (Private Key JSON)
1. Pada daftar **Service Accounts**, klik email akun layanan yang baru Anda buat (contoh: `couple-bot@couple-saving-app.iam.gserviceaccount.com`).
2. Masuk ke tab **Keys** (*Kunci*).
3. Klik tombol **Add Key** > **Create new key**.
4. Pilih format **JSON** > klik **Create**.
5. File `.json` akan otomatis terunduh ke komputer Anda. Buka file tersebut dengan text editor (Notepad / VS Code).

#### Langkah 5: Salin ke Variabel Environment
- **`GOOGLE_SERVICE_ACCOUNT_EMAIL`**: Ambil nilai dari field `"client_email"` pada file JSON tadi.  
  *Contoh:* `couple-bot@couple-saving-app.iam.gserviceaccount.com`
- **`GOOGLE_PRIVATE_KEY`**: Ambil nilai dari field `"private_key"`.  
  *Catatan Penting:* Salin lengkap mulai dari `-----BEGIN PRIVATE KEY-----\n...` sampai `\n-----END PRIVATE KEY-----\n`. Bungkus nilainya dengan tanda kutip ganda (`"`).

---

### B. Menyiapkan Spreadsheet & Hak Akses

#### Langkah 1: Buat Google Sheet
1. Buka [Google Sheets](https://sheets.new) untuk membuat spreadsheet baru.
2. Beri nama spreadsheet Anda, misalnya `Couple Savings`.

#### Langkah 2: Ambil Spreadsheet ID
Perhatikan URL spreadsheet di browser Anda:
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit
                                       └──────────────────┬──────────────────┘
                                                    SPREADSHEET ID
```
Salin string panjang di antara `/d/` dan `/edit` sebagai **`GOOGLE_SHEET_ID`**.

#### Langkah 3: Bagikan Hak Akses ke Service Account (KRUSIAL ⚠️)
1. Di halaman Google Sheet Anda, klik tombol **Bagikan** (*Share*) di pojok kanan atas.
2. Tempelkan email Service Account Anda (dari `GOOGLE_SERVICE_ACCOUNT_EMAIL`).
3. Pastikan perannya disetel sebagai **Editor**.
4. Hilangkan centang "Notify people" (karena ini akun bot) > klik **Share** / **Kirim**.

#### Langkah 4: Format Tata Letak Sel Spreadsheet
Aplikasi membaca dan menulis data pada range sel tetap:
- **Baris 21 ke bawah kolom A–F (`A21:F`)**: Data Transaksi  
  *(Kolom: A: Tanggal, B: Kategori, C: Jumlah Nominal, D: Catatan, E: Oleh Siapa, F: Target Goal)*
- **Baris 21 ke bawah kolom I–K (`I21:K`)**: Data Target / Goals  
  *(Kolom: I: Nama Target, J: Nominal Target, K: Terkumpul)*
- **Baris 21 ke bawah kolom N (`N21:N`)**: Data Nama Anggota / Pasangan  
- **F6, H6, K6**: Statistik ringkasan utama (Saldo Bersama, Target Total, Persentase).

*(Jika spreadsheet masih kosong, Anda bisa langsung mengisi transaksi baru lewat aplikasi, atau biarkan sistem menggunakan fallback lokal `db.json`).*

---

### C. NextAuth Secret & App Password

1. **`APP_PASSWORD`**:
   Tentukan kata sandi rahasia yang akan digunakan berdua untuk membuka dashboard aplikasi.
   *Contoh:* `cintakita2026`

2. **`NEXTAUTH_SECRET`**:
   Kunci enkripsi acak untuk sesi login JWT NextAuth. Anda bisa membuatnya melalui terminal dengan perintah:
   ```bash
   openssl rand -base64 32
   ```
   Atau buat kombinasi huruf dan angka acak minimal 32 karakter.

3. **`NEXTAUTH_URL`**:
   - Untuk testing lokal: `http://localhost:3000`
   - Untuk produksi di Vercel: URL domain produksi Vercel Anda (contoh: `https://couple-saver-app.vercel.app`).

---

## 💻 Instalasi & Menjalankan di Komputer Lokal

1. **Clone repository atau buka folder project**:
   ```bash
   cd "namel plan"
   ```

2. **Install dependensi**:
   ```bash
   npm install
   ```

3. **Buat file `.env`**:
   Salin template dari `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Buka file `.env` lalu masukkan kredensial yang sudah Anda siapkan di atas.

4. **Jalankan development server**:
   ```bash
   npm run dev
   ```
   Buka browser di **`http://localhost:3000`**. Masukkan `APP_PASSWORD` yang telah Anda tentukan di `.env`.

5. **Uji coba Build Produksi**:
   ```bash
   npm run build
   npm start
   ```

---

## 🚀 Panduan Lengkap Deploy ke Vercel

### ⚠️ Peringatan Penting Penamaan Domain
> **Jangan gunakan nama proyek `couple-saving-planner` di Vercel!** Domain publik `.vercel.app` dengan nama tersebut sedang terblokir/tersuspensi oleh akun lama sehingga akan menghasilkan halaman 404. Gunakan nama alternatif, misalnya **`couple-saver-app`**.

---

### Opsi 1: Deploy Lewat GitHub (Direkomendasikan)

1. **Inisialisasi Git dan Push ke GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit couple saving planner"
   git branch -M main
   git remote add origin https://github.com/<username-anda>/<nama-repo>.git
   git push -u origin main
   ```
   *(Pastikan file `.env` tidak ikut ter-push; file `.gitignore` bawaan project sudah melindunginya).*

2. **Hubungkan ke Vercel**:
   - Buka [Vercel Dashboard](https://vercel.com/dashboard).
   - Klik tombol **Add New...** > **Project**.
   - Pilih repository GitHub Anda > klik **Import**.

3. **Konfigurasi Project di Vercel**:
   - **Project Name**: Masukkan `couple-saver-app` (atau nama lain yang unik).
   - **Framework Preset**: Next.js (otomatis terdeteksi).
   - **Root Directory**: `./`

4. **Masukkan Environment Variables**:
   Buka accordion **Environment Variables** lalu tambahkan semua variabel berikut satu per satu:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY` (pastikan tanda kutip dan `\n` terbaca dengan benar)
   - `GOOGLE_SHEET_ID`
   - `APP_PASSWORD`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` *(set ke URL produksi Vercel, misalnya `https://couple-saver-app.vercel.app`)*

5. **Klik Deploy**:
   Tunggu proses build selesai (~1-2 menit). Aplikasi Anda kini online dan dapat diakses publik!

---

### Opsi 2: Deploy Cepat Lewat Vercel CLI

1. Pasang Vercel CLI jika belum ada:
   ```bash
   npm install -g vercel
   ```
2. Login ke akun Vercel Anda:
   ```bash
   vercel login
   ```
3. Deploy ke lingkungan produksi:
   ```bash
   vercel --prod
   ```
4. Tambahkan Environment Variables melalui dashboard Vercel di menu **Settings** > **Environment Variables**, lalu lakukan *Redeploy*.

---

## 📂 Struktur Folder & Komponen

```
├── components/
│   ├── AppShell.js       # Shell layout: sidebar desktop & mobile bottom bar
│   ├── Icons.js          # Kumpulan ikon SVG outline custom
│   ├── Illustrations.js  # Kumpulan ilustrasi SVG estetik bergaya unDraw
│   └── Ring.js           # Komponen SVG progress ring melingkar dengan neon glow
├── lib/
│   ├── auth.js           # Konfigurasi NextAuth (Credentials Provider)
│   ├── cache.js          # Singleton NodeCache (in-memory caching)
│   └── sheets.js         # Layer tunggal data Google Sheets & fallback db.json
├── pages/
│   ├── api/              # API Routes Next.js (transactions, summary, goals, users)
│   ├── _app.js           # Root Next.js wrapper dengan SessionProvider
│   ├── _document.js      # Head HTML dengan meta tag PWA & Manifest
│   ├── add.js            # Halaman input transaksi (pemasukan/pengeluaran)
│   ├── goals.js          # Halaman kelola target tabungan
│   ├── history.js        # Halaman riwayat transaksi & filter
│   ├── index.js          # Dashboard utama (dengan ISR 300 detik)
│   ├── login.js          # Halaman autentikasi password bersama
│   └── users.js          # Halaman manajemen anggota
├── public/
│   ├── icon-192.png      # Ikon aplikasi PWA
│   └── manifest.json     # Konfigurasi PWA Manifest
├── styles/
│   └── globals.css       # Design System v3 Dark Glassmorphism tokens
├── .env.example          # Template konfigurasi environment
├── .gitignore            # Aturan pencegahan commit rahasia & build junk
└── db.json               # Database lokal runtime untuk mode offline/fallback
```

---

## 📱 Panduan Instalasi PWA (Mobile / HP)

Aplikasi ini mendukung mode **PWA Standalone**, terasa seperti aplikasi native tanpa address bar browser:

### Di Android (Google Chrome):
1. Buka URL website aplikasi Anda (misal `https://couple-saver-app.vercel.app`).
2. Login menggunakan password bersama.
3. Ketuk ikon titik tiga (⋮) di pojok kanan atas browser.
4. Pilih **Tambahkan ke Layar Utama** (*Add to Home screen*) atau **Install Aplikasi**.
5. Ikon **Couple Saver** akan muncul di home screen ponsel Anda.

### Di iPhone / iOS (Safari):
1. Buka URL website aplikasi Anda menggunakan browser **Safari**.
2. Ketuk tombol **Share** (ikon kotak dengan panah ke atas di bagian bawah layar).
3. Gulir ke bawah lalu pilih **Tambah ke Layar Utama** (*Add to Home Screen*).
4. Ketuk **Tambah** (*Add*) di pojok kanan atas.
5. Aplikasi siap dibuka langsung dari home screen iPhone Anda.

---

## 📄 Lisensi
Project ini dibuat secara personal untuk pasangan mengelola keuangan bersama. Bebas dimodifikasi dan dikembangkan sesuai kebutuhan keluarga Anda!
