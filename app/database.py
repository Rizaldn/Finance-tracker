"""Koneksi PostgreSQL (SQLAlchemy + psycopg 3). Engine dibuat lazy agar
endpoint "/" tetap bisa jalan walaupun DATABASE_URL belum diatur."""

import os
from collections.abc import Iterator
from functools import lru_cache

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import NullPool

load_dotenv(
    dotenv_path=os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        ".env"
    ),
    override=True
)


def normalize_database_url(url: str) -> str:
    """Supabase memberi URL 'postgresql://...'. SQLAlchemy butuh nama
    driver, jadi ubah ke 'postgresql+psycopg://...'."""
    url = url.strip()
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


@lru_cache(maxsize=1)
def get_engine() -> Engine:
    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL belum diatur")

    kwargs: dict = {
        "pool_pre_ping": True,
        # Matikan prepared statement otomatis psycopg 3 agar aman dipakai lewat
        # Supabase pooler (Supavisor, mode transaction, port 6543).
        "connect_args": {"prepare_threshold": None},
    }
    if os.getenv("VERCEL"):
        # Serverless: jangan menahan koneksi antar-invokasi. Gunakan
        # Transaction pooler Supabase (port 6543) agar koneksi tidak membengkak.
        kwargs["poolclass"] = NullPool
    else:
        kwargs.update(pool_size=5, max_overflow=5)
    return create_engine(normalize_database_url(url), **kwargs)


def get_db() -> Iterator[Session]:
    """Dependency FastAPI: satu session per request. Perubahan yang belum
    di-commit otomatis di-rollback saat session ditutup."""
    with Session(get_engine(), expire_on_commit=False) as db:
        yield db
