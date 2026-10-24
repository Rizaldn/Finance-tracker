-- Skema PostgreSQL: Personal Finance Tracker (5 tabel berelasi)
-- Aman dijalankan berulang (IF NOT EXISTS). Tidak ada DROP TABLE.

CREATE TABLE IF NOT EXISTS users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallets (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    initial_balance NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (initial_balance >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, name)
);

-- user_id NULL + is_default TRUE  => kategori bawaan (global)
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (is_default = FALSE OR user_id IS NULL)
);

-- Mencegah duplikat kategori (termasuk seed yang dijalankan berulang)
CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_default
    ON categories(name, type) WHERE user_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_user
    ON categories(user_id, name, type) WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id BIGINT NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budgets (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    amount_limit NUMERIC(14,2) NOT NULL CHECK (amount_limit > 0),
    budget_month DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (EXTRACT(DAY FROM budget_month) = 1),
    UNIQUE (user_id, category_id, budget_month)
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date
    ON transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category
    ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet
    ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month
    ON budgets(user_id, budget_month);

-- Supabase: tabel di schema public otomatis bisa diakses lewat Data API
-- (PostgREST) memakai anon key. Aktifkan RLS tanpa policy agar akses lewat
-- API itu ditolak. Backend ini terhubung langsung sebagai role 'postgres'
-- (BYPASSRLS), jadi tidak terpengaruh.
ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets      ENABLE ROW LEVEL SECURITY;
