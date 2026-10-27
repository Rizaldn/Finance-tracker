# Finance Tracker — Frontend

Antarmuka web (bahasa Indonesia) untuk [Personal Finance Tracker API](https://github.com/Rizaldn/Finance-tracker).
React + Vite + TypeScript, Tailwind CSS v4, Radix UI (dialog), Lucide, Recharts, React Router, TanStack Query, React Hook Form + Zod.

> **Versi demo.** Backend belum memiliki autentikasi; identitas pengguna dikirim lewat `user_id`.
> Gunakan data uji saja.

## Status verifikasi (jujur)

| Pemeriksaan | Status |
|---|---|
| `npm install` | **Belum dijalankan.** Registry npm diblokir (HTTP 403) di lingkungan tempat kode ini ditulis. |
| `npm run build` / `typecheck` / `lint` | **Belum dijalankan** (bergantung pada `npm install`). Jalankan sendiri dan perbaiki bila ada error. |
| Pemeriksaan statis | Dijalankan: sintaks 58 file `.ts/.tsx` valid, semua import (`@/…` dan relatif) terselesaikan, semua nama yang diimpor memang diekspor, tidak ada import yang tidak terpakai. Ini **bukan** pengganti `tsc`. |
| Pemanggilan ke API live | **Belum dilakukan.** Host `finance-tracker-rizall.vercel.app` tidak dapat dijangkau dari lingkungan pembuatan. Path, query, dan bentuk body diambil dari source code backend, bukan dari uji langsung. |
| Verifikasi pengguna demo `16` | **Belum bisa.** Aplikasi memeriksanya saat dibuka (lihat "Pengguna demo"). |
| Tampilan responsif / browser | **Belum dilihat di browser.** |

Karena `package-lock.json` hanya bisa dibuat oleh `npm install`, file itu **belum ada**. Setelah install pertama, commit `package-lock.json`.

## Menjalankan secara lokal

Prasyarat: Node.js ≥ 20.19 (atau ≥ 22.12) dan npm.

```bash
cd frontend
npm install
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
npm run dev               # http://localhost:5173
```

Perintah lain:

```bash
npm run typecheck   # tsc -b
npm run lint        # eslint
npm run build       # typecheck + build produksi ke dist/
npm run preview     # menyajikan dist/ (dengan proxy /api yang sama)
```

### Environment

| Variabel | Fungsi | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Alamat backend yang dipanggil browser. **Kosongkan** agar memakai proxy same-origin (disarankan, lihat CORS). | kosong |
| `VITE_DEMO_USER_ID` | ID pengguna demo awal. Bisa diganti dari UI tanpa mengubah kode. | `16` |
| `API_PROXY_TARGET` | Target proxy untuk `npm run dev`/`preview` (tidak dibaca browser). | `https://finance-tracker-rizall.vercel.app` |

Tidak ada secret di frontend. Jangan menaruh `DATABASE_URL`, kunci Supabase, atau kredensial apa pun di variabel `VITE_*` karena nilainya terbaca di browser.

Prefix `/api/v1` didefinisikan hanya di `src/lib/env.ts` (`API_PREFIX`) dan digabung satu kali di `src/lib/api-client.ts`. Isi `VITE_API_BASE_URL` **tanpa** `/api/v1`.

### CORS

Pencarian di source backend (`app/`) tidak menemukan konfigurasi CORS (tidak ada `CORSMiddleware`), sehingga browser akan memblokir pemanggilan langsung dari origin lain.
Frontend menghindarinya tanpa mengubah backend: browser memanggil `/api/v1/...` pada origin frontend sendiri, lalu

- saat `dev`/`preview`: Vite meneruskannya ke `API_PROXY_TARGET` (`vite.config.ts`);
- di produksi (Vercel): `rewrites` di `vercel.json` meneruskannya ke backend.

Bila suatu saat Anda ingin memanggil backend langsung, tambahkan `CORSMiddleware` di `app/main.py` dengan `allow_origins` berisi domain frontend, lalu isi `VITE_API_BASE_URL`. Itu perubahan backend yang tidak dilakukan di sini.

## Pengguna demo

Saat dibuka, aplikasi memanggil `GET /api/v1/users/{id}` untuk ID aktif (awal: `VITE_DEMO_USER_ID`).

- Ditemukan → aplikasi berjalan.
- 404 → muncul layar dengan dua pilihan: ganti ID pengguna, atau **buat pengguna demo baru** (`POST /api/v1/users`, menambah satu baris; tidak ada data yang dihapus atau direset).
- Gangguan jaringan/server → pesan error dengan tombol "Coba lagi".

Ganti ID kapan saja dari tombol pengguna di pojok kanan atas (disimpan di `localStorage` browser).

## Fitur

- **Ringkasan** — total saldo, pemasukan/pengeluaran/arus kas bersih bulan terpilih, grafik pemasukan vs pengeluaran 6 bulan, donat pengeluaran per kategori, transaksi terbaru, saldo tiap dompet, pemakaian anggaran, pemilih bulan.
- **Transaksi** — tabel (layar lebar) / kartu (mobile), tambah, edit (PUT), hapus dengan konfirmasi, detail, filter jenis/dompet/kategori/rentang tanggal, paginasi memakai `limit`/`offset`/`meta.total` dari API.
- **Dompet** — daftar dengan saldo per dompet (dari `/summary?wallet_id=`), tambah, edit, hapus.
- **Kategori** — filter pemasukan/pengeluaran, ikon dan warna aksen, tambah/ubah nama/hapus. Kategori bawaan ditandai dan tombol ubah/hapus tidak ditampilkan (backend menolak dengan 409).
- **Anggaran** — per bulan, tambah/ubah batas/hapus, `spent`, `remaining`, `percentage_used` langsung dari backend, status "Hampir habis" (≥ 80%) dan "Melebihi anggaran" (> 100%).
- **Laporan** — ringkasan saldo (opsional per dompet), tren 6 bulan + tabel, rincian pengeluaran per kategori beserta anggaran.
- **Ekspor & Impor** — unduh hasil `GET /export`; impor berkas JSON dengan validasi sisi klien yang menjelaskan tiap masalah, dialog konfirmasi, dan jumlah baris yang diimpor.
- Umum: loading skeleton, empty state, error state dengan "Coba lagi", toast untuk setiap mutasi, dialog konfirmasi seragam, proteksi perubahan form yang belum disimpan, label dan fokus keyboard yang dapat diakses.

## Endpoint yang dipakai

Semua dengan prefix `/api/v1`. Parameter opsional yang kosong tidak dikirim.

| Method | Path | Dipakai untuk |
|---|---|---|
| GET | `/users/{id}` | memeriksa pengguna demo, nama di header |
| POST | `/users` | membuat pengguna demo (hanya atas permintaan pengguna) |
| GET, POST | `/wallets`, `/wallets?user_id=` | daftar, buat dompet |
| PATCH, DELETE | `/wallets/{id}` | ubah, hapus dompet |
| GET | `/categories?user_id=&type=` | daftar kategori |
| POST, PATCH, DELETE | `/categories`, `/categories/{id}` | buat, ubah nama, hapus |
| GET | `/transactions?user_id=&type=&wallet_id=&category_id=&start_date=&end_date=&limit=&offset=` | daftar, paginasi, grafik |
| GET | `/transactions/{id}` | detail |
| POST | `/transactions` | tambah |
| PUT | `/transactions/{id}` | edit (semua field dikirim ulang) |
| DELETE | `/transactions/{id}` | hapus |
| GET | `/budgets?user_id=&month=` | daftar anggaran |
| POST, PATCH, DELETE | `/budgets`, `/budgets/{id}` | buat, ubah batas, hapus |
| GET | `/summary?user_id=&wallet_id=` | saldo |
| GET | `/summary/by-category?user_id=&month=` | pengeluaran per kategori |
| GET | `/export?user_id=` | ekspor |
| POST | `/import` | impor transaksi |

Tidak dipakai: `PATCH /transactions/{id}` (edit memakai PUT), `PATCH/DELETE /users/{id}`, `GET /users`, `GET /wallets/{id}`, `GET /categories/{id}`, `GET /budgets/{id}`, `GET /` dan `/health/db`.

## Keterbatasan dan keputusan

- **Pencarian teks tidak ada.** API tidak punya parameter pencarian pada catatan/kategori, jadi yang tersedia hanya filter yang didukung (jenis, dompet, kategori, tanggal).
- **Semantik saldo.** `current_balance` dari backend = saldo awal semua dompet + semua pemasukan − semua pengeluaran (semua waktu). "Pemasukan/Pengeluaran/Arus kas" pada kartu Ringkasan dihitung dari transaksi pada bulan terpilih (dijumlahkan dalam satuan sen, tiap transaksi sekali); total semua waktu ditampilkan terpisah di keterangan kartu.
- **Grafik tren** mengambil semua transaksi 6 bulan lewat beberapa request (maks. 200 per halaman, batas backend). Untuk data sangat besar, endpoint agregasi per bulan di backend akan lebih efisien.
- **Ringkasan per kategori** di backend tidak mendukung filter dompet, sehingga bagian itu di Laporan selalu mencakup semua dompet.
- **Impor** hanya mendukung format yang diterima backend (JSON berisi `transactions`; CSV tidak didukung). Backend tidak mendeteksi duplikat: mengimpor berkas ekspor akun yang sama akan menggandakan transaksi. Aplikasi memperingatkannya di dialog konfirmasi.
- **Hapus dompet/kategori** tidak dicegah di UI bila terpakai (aplikasi tidak memuat penggunaan tiap item); server menolak dengan 409 dan alasannya ditampilkan. Kategori bawaan tidak ditawarkan untuk diubah/dihapus.
- **Jenis kategori** tidak dapat diubah setelah dibuat (backend hanya menerima perubahan nama).
- Komponen UI memakai Radix + Tailwind secara langsung (gaya shadcn/ui) tanpa CLI shadcn, agar tidak menambah ketergantungan pada langkah generator.

## Deploy ke Vercel (terpisah dari backend)

Backend sudah berjalan di proyek Vercel sendiri dan tidak disentuh. Buat **proyek Vercel baru** untuk frontend:

1. Letakkan folder ini sebagai `frontend/` di repo yang sama (atau repo terpisah). **Jangan** mengubah `vercel.json` di root repo (itu milik backend).
2. Vercel → *Add New… → Project* → pilih repo.
3. Pada **Root Directory**, pilih `frontend` (bila memakai repo yang sama, ini yang menjaga backend tetap terpisah).
4. Pengaturan (otomatis dari `frontend/vercel.json`): Framework **Vite**, Build Command `npm run build`, Output Directory `dist`.
5. Environment Variables (opsional): `VITE_DEMO_USER_ID`. Biarkan `VITE_API_BASE_URL` kosong.
6. Deploy. `vercel.json` sudah berisi:
   - rewrite `/api/*` → `https://finance-tracker-rizall.vercel.app/api/*` (menghindari CORS),
   - fallback SPA `/(.*)` → `/index.html` (agar refresh pada `/transaksi` dll. tidak 404).

Jika URL backend berubah, ubah `destination` di `frontend/vercel.json` dan `API_PROXY_TARGET`.

## Struktur

```
src/
  components/        komponen bersama (ui/, layout/, charts/, dialog, state, paginasi)
  features/          dashboard, transactions, wallets, categories, budgets, reports, data-io
  hooks/             query TanStack, konteks pengguna demo
  lib/               api-client, env, format (IDR/tanggal), agregasi, input uang
  services/          satu modul per resource API
  types/             tipe sesuai skema Pydantic backend
  pages/             halaman 404
```
