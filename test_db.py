from sqlalchemy import text
from app.database import get_engine

try:
    with get_engine().connect() as conn:
        result = conn.execute(text("SELECT 1")).scalar()
        print("Koneksi Supabase berhasil!")
        print("Hasil tes:", result)

except Exception as e:
    print("Koneksi Supabase gagal!")
    print(type(e).__name__, e)

    from sqlalchemy import text
from app.database import get_engine

try:
    with get_engine().connect() as conn:
        result = conn.execute(text("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """))

        tables = [row[0] for row in result]

        print("Koneksi Supabase berhasil!")
        print("Tabel yang ditemukan:")

        for table in tables:
            print("-", table)

        expected = {
            "users",
            "wallets",
            "categories",
            "transactions",
            "budgets",
        }

        missing = expected - set(tables)

        if missing:
            print("Tabel belum ada:", sorted(missing))
        else:
            print("Semua 5 tabel berhasil ditemukan!")

except Exception as e:
    print("Pemeriksaan gagal:")
    print(type(e).__name__, e)