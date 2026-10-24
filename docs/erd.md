# ERD — Personal Finance Tracker

Sumber kebenaran: `database/schema.sql`.

```mermaid
erDiagram
    USERS ||--o{ WALLETS : memiliki
    USERS ||--o{ CATEGORIES : membuat
    USERS ||--o{ TRANSACTIONS : mencatat
    WALLETS ||--o{ TRANSACTIONS : digunakan
    CATEGORIES ||--o{ TRANSACTIONS : mengelompokkan
    USERS ||--o{ BUDGETS : mengatur
    CATEGORIES ||--o{ BUDGETS : memiliki

    USERS {
        BIGINT id PK
        VARCHAR name
        VARCHAR email UK
        TIMESTAMPTZ created_at
    }
    WALLETS {
        BIGINT id PK
        BIGINT user_id FK
        VARCHAR name
        NUMERIC initial_balance
        TIMESTAMPTZ created_at
    }
    CATEGORIES {
        BIGINT id PK
        BIGINT user_id FK "NULL = kategori bawaan"
        VARCHAR name
        VARCHAR type
        BOOLEAN is_default
        TIMESTAMPTZ created_at
    }
    TRANSACTIONS {
        BIGINT id PK
        BIGINT user_id FK
        BIGINT wallet_id FK
        BIGINT category_id FK
        VARCHAR type
        NUMERIC amount
        DATE transaction_date
        TEXT note
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }
    BUDGETS {
        BIGINT id PK
        BIGINT user_id FK
        BIGINT category_id FK
        NUMERIC amount_limit
        DATE budget_month
        TIMESTAMPTZ created_at
    }
```

## Aturan penghapusan (foreign key)

| Relasi | Aksi |
|---|---|
| users → wallets / categories / transactions / budgets | `CASCADE` (hapus pengguna = hapus semua datanya) |
| wallets → transactions | `RESTRICT` (dompet terpakai tidak bisa dihapus) |
| categories → transactions / budgets | `RESTRICT` (kategori terpakai tidak bisa dihapus) |

## Constraint penting

- `transactions.amount > 0`; jenis pemasukan/pengeluaran dibedakan oleh kolom `type`.
- `wallets.initial_balance >= 0`, nama dompet unik per pengguna.
- `categories`: nama + tipe unik per pengguna, dan unik juga untuk kategori bawaan (partial unique index).
- `budgets.budget_month` selalu tanggal 1; satu anggaran per (pengguna, kategori, bulan).
