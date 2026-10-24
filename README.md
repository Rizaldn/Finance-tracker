# Personal Finance Tracker API

REST API pencatatan keuangan pribadi: **Python + FastAPI + PostgreSQL di Supabase + Vercel**.
Tugas akhir Backend Development. Dokumen ERD ada di [`docs/erd.md`](docs/erd.md), checklist uji di [`tests/api-test-checklist.md`](tests/api-test-checklist.md).

> **Versi demo.** Belum ada autentikasi: identitas pengguna dikirim lewat `user_id`, sehingga siapa pun yang tahu URL bisa membaca/mengubah data. Pakai **data uji saja**; tambahkan autentikasi sebelum dipakai untuk data nyata.

## Fitur dan pemetaan fungsi awal

| Fungsi proyek awal | Di API |
|---|---|
| `tambahTransaksi()` | `POST /api/v1/transactions` |
| `getSemuaTransaksi()` | `GET /api/v1/transactions?user_id=1` |
| `getTransaksiByKategori()` | `GET /api/v1/transactions?user_id=1&category_id=3` |
| `hitungTotalSaldo()` | `GET /api/v1/summary?user_id=1` |
| `hapusTransaksi()` | `DELETE /api/v1/transactions/{id}` |
| `simpanDataKeJson()` | `GET /api/v1/export?user_id=1` (cadangan JSON, bukan file lokal) |
| `muatDataDariJson()` | `POST /api/v1/import` |

Penyimpanan utama adalah PostgreSQL. Filesystem Vercel tidak permanen, jadi simpan/muat JSON dijadikan fitur ekspor/impor lewat API. Bila dosen mewajibkan file JSON lokal, konfirmasikan dulu caranya.

## Arsitektur

```
Thunder Client / Postman → Vercel → FastAPI
   routers (HTTP) → services (aturan bisnis) → repositories (query) → PostgreSQL
```

```
api/index.py            entry point Vercel
app/main.py             FastAPI, error handler terpusat
app/routers/            endpoint per resource
app/services/           aturan bisnis & validasi relasi
app/repositories/       query SQLAlchemy (parameter terikat)
app/schemas.py          validasi request/response (Pydantic)
app/models.py           pemetaan tabel
database/schema.sql     DDL 5 tabel  |  seed.sql  kategori bawaan
```

## Menjalankan lokal

```bash
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item env.example .env
```

### Menyiapkan Supabase

1. Buat project di https://supabase.com dan simpan password database-nya.
2. Buka **SQL Editor**, jalankan isi `database/schema.sql`, lalu `database/seed.sql`. Keduanya aman diulang dan tidak memakai `DROP TABLE`. Schema ini juga mengaktifkan Row Level Security supaya tabel tidak terbuka lewat Data API Supabase.
3. Klik tombol **Connect** di dashboard, pilih **Transaction pooler**, salin connection string ke `DATABASE_URL` di `.env`.
   - Port **6543** (Transaction pooler) dipakai karena Vercel serverless hanya IPv4, sedangkan *Direct connection* Supabase memakai IPv6.
   - Username berbentuk `postgres.<project-ref>`, bukan `postgres`.
   - Password dengan karakter khusus (`@ : / # ? %`) harus di-URL-encode, mis. `@` menjadi `%40`.
4. Cek koneksi: jalankan API lalu buka `GET /health/db`.

> Jangan memakai `anon key`/`service_role key` Supabase di proyek ini; backend hanya memakai connection string database.

```bash
uvicorn app.main:app --reload
```

Dokumentasi interaktif: http://127.0.0.1:8000/docs

### Contoh alur uji cepat

```http
POST /api/v1/users         {"name":"Demo","email":"demo@example.com"}
POST /api/v1/wallets       {"user_id":1,"name":"Cash","initial_balance":250000}
GET  /api/v1/categories?user_id=1&type=expense          # catat id "Makanan"
POST /api/v1/transactions  {"user_id":1,"wallet_id":1,"category_id":3,"type":"expense",
                            "amount":18000,"transaction_date":"2026-10-23","note":"Makan siang"}
GET  /api/v1/summary?user_id=1
```

## Endpoint

Prefix `/api/v1`. Body dan response berupa JSON.

| Resource | Endpoint |
|---|---|
| Users | `GET/POST /users`, `GET/PATCH/DELETE /users/{id}` |
| Wallets | `GET /wallets?user_id=`, `POST /wallets`, `GET/PATCH/DELETE /wallets/{id}` |
| Categories | `GET /categories?user_id=&type=`, `POST /categories`, `GET/PATCH/DELETE /categories/{id}` |
| **Transactions** | `GET /transactions?user_id=` (filter: `category_id`, `type`, `wallet_id`, `start_date`, `end_date`, `limit`, `offset`), `POST`, `GET/PUT/PATCH/DELETE /transactions/{id}` |
| Budgets | `GET /budgets?user_id=&month=YYYY-MM`, `POST /budgets`, `GET/PATCH/DELETE /budgets/{id}` |
| Summary | `GET /summary?user_id=[&wallet_id=]`, `GET /summary/by-category?user_id=&month=YYYY-MM` |
| JSON | `GET /export?user_id=`, `POST /import` |
| Health | `GET /`, `GET /health/db` |

### Aturan bisnis yang ditegakkan

- `amount` > 0 dengan maksimal 2 desimal; jenis transaksi dibedakan oleh `type` (`income` / `expense`).
- Dompet harus milik `user_id` yang sama; kategori harus bawaan atau milik pengguna itu, dan **tipenya harus sama dengan tipe transaksi**.
- Saldo = saldo awal semua dompet + pemasukan − pengeluaran, selalu dihitung dari database.
- Anggaran hanya untuk kategori `expense`, `budget_month` harus tanggal 1, satu per (kategori, bulan). Respons memuat `spent`, `remaining`, `percentage_used`.
- Dompet/kategori yang dipakai transaksi tidak bisa dihapus (409); kategori bawaan tidak bisa diubah/dihapus.
- `PUT` mengganti semua field yang bisa diedit; `PATCH` sebagian. `user_id` tidak bisa diubah.

### Format response

Sukses: `{"message": "...", "data": ...}` (daftar transaksi menambah `meta: {total, limit, offset}`).
Nilai uang berupa **string 2 desimal** (`"18000.00"`) agar presisi terjaga.

Error selalu `{"error": "..."}`: `400` input tidak valid, `404` tidak ditemukan, `409` duplikasi/relasi, `500` kesalahan server (detail teknis hanya di log).

## Deploy ke Vercel

1. Push ke GitHub (pastikan `.env` tidak ikut; sudah ada di `.gitignore`).
2. Import repository di Vercel.
3. Tambah Environment Variable `DATABASE_URL` berisi connection string **Transaction pooler** Supabase (port 6543).
4. Deploy, lalu uji `GET https://<project>.vercel.app/` dan `/health/db`, kemudian ulangi checklist di URL Vercel.

`vercel.json` meneruskan semua path ke `api/index.py`. Cara Vercel mendeteksi FastAPI bisa berubah; bila build gagal, cek panduan resmi: https://vercel.com/docs/frameworks/backend/fastapi

## Tes

Aktifkan virtual environment dan pasang dependensi pengujian:

```powershell
pip install -r requirements-dev.txt
```

Jalankan pengujian API lokal:

```powershell
pytest -v test_api.py
```

Hasil pengujian terakhir: **13 tes lulus**.

Pengujian API menggunakan konfigurasi aplikasi yang terhubung ke database. Gunakan database dan data uji, bukan data keuangan nyata.

File `tests/test_api.py` dan `tests/test_schemas.py` merupakan file terpisah; jangan menganggap hasil pengujiannya lulus sebelum benar-benar dijalankan.


## Status Verifikasi

| Bagian | Status |
|---|---|
| Koneksi database Supabase | Berhasil diverifikasi melalui endpoint `/health/db` |
| Struktur database | Lima tabel terdeteksi di Supabase |
| API FastAPI lokal | 13 tes pada `test_api.py` lulus |
| Ringkasan saldo | Telah diuji menggunakan data contoh |
| Deployment Vercel | Belum terkonfirmasi; perlu diuji setelah deployment |
| Autentikasi | Belum tersedia; API masih berupa demo dan menggunakan `user_id` |

