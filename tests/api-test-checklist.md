# Checklist uji endpoint (Thunder Client / Postman)

Ganti `{{base}}` dengan `http://127.0.0.1:8000` (lokal) lalu `https://<project>.vercel.app` (deploy).
Isi kolom "Hasil" dan simpan screenshot request/response sebagai bukti.

| # | Skenario | Request | Harapan | Hasil |
|---|---|---|---|---|
| 1 | Health check | `GET {{base}}/` | 200 | |
| 2 | Koneksi database | `GET {{base}}/health/db` | 200 | |
| 3 | Buat pengguna | `POST /api/v1/users` `{"name":"Demo","email":"demo@example.com"}` | 201 | |
| 4 | Email duplikat | ulangi #3 | 409 | |
| 5 | Buat dompet | `POST /api/v1/wallets` `{"user_id":1,"name":"Cash","initial_balance":250000}` | 201 | |
| 6 | Daftar kategori | `GET /api/v1/categories?user_id=1&type=expense` | 200, ada kategori bawaan | |
| 7 | POST transaksi valid | `POST /api/v1/transactions` (lihat README) | 201, `amount` "18000.00" | |
| 8 | Nominal 0 / negatif | `amount: 0` lalu `amount: -5` | 400 | |
| 9 | Tipe kategori tidak cocok | `type: income` + kategori expense | 400 | |
| 10 | GET daftar transaksi | `GET /api/v1/transactions?user_id=1` | 200 | |
| 11 | GET ID tidak ada | `GET /api/v1/transactions/999999` | 404 | |
| 12 | PATCH transaksi | `PATCH /api/v1/transactions/1` `{"note":"Revisi"}` | 200, data berubah | |
| 13 | PUT transaksi | `PUT /api/v1/transactions/1` (semua field) | 200 | |
| 14 | Filter kategori | `GET /api/v1/transactions?user_id=1&category_id=3` | 200, hanya kategori itu | |
| 15 | Filter tanggal | `...&start_date=2026-10-01&end_date=2026-10-31` | 200 | |
| 16 | Ringkasan saldo | `GET /api/v1/summary?user_id=1` | 200, sesuai hitungan manual | |
| 17 | Ringkasan per kategori | `GET /api/v1/summary/by-category?user_id=1&month=2026-10` | 200 | |
| 18 | Buat anggaran | `POST /api/v1/budgets` | 201, ada `percentage_used` | |
| 19 | Anggaran duplikat | ulangi #18 | 409 | |
| 20 | Hapus dompet terpakai | `DELETE /api/v1/wallets/1` | 409 | |
| 21 | Hapus kategori bawaan | `DELETE /api/v1/categories/1` | 409 | |
| 22 | Ekspor JSON | `GET /api/v1/export?user_id=1` | 200 | |
| 23 | Impor JSON | `POST /api/v1/import` | 201 | |
| 24 | DELETE transaksi | `DELETE /api/v1/transactions/1` | 200 | |
| 25 | Endpoint tidak ada | `GET /api/v1/xyz` | 404 `{"error": ...}` | |
| 26 | Semua di atas pada URL Vercel | — | sama | |
