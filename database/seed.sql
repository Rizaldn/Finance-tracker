-- Data awal: kategori bawaan global. Aman dijalankan berulang
-- berkat unique index uq_categories_default.
INSERT INTO categories (name, type, is_default)
VALUES
    ('Gaji / Uang Saku', 'income',  TRUE),
    ('Pendapatan Lain',  'income',  TRUE),
    ('Makanan',          'expense', TRUE),
    ('Transportasi',     'expense', TRUE),
    ('Kuliah',           'expense', TRUE),
    ('Hiburan',          'expense', TRUE)
ON CONFLICT DO NOTHING;
