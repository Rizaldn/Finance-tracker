import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, OperationalError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.deps import DbDep
from app.exceptions import AppError
from app.routers import (
    budgets,
    categories,
    data_io,
    summary,
    transactions,
    users,
    wallets,
)

logger = logging.getLogger("finance")

app = FastAPI(
    title="Personal Finance Tracker API",
    description=(
        "REST API pencatatan keuangan pribadi (FastAPI + PostgreSQL). "
        "Versi demo: identitas pengguna dikirim lewat `user_id`, belum ada "
        "autentikasi, jadi gunakan hanya data uji."
    ),
    version="1.0.0",
)

for module in (users, wallets, categories, transactions, budgets, summary, data_io):
    app.include_router(module.router)


# --------------------------------------------------------------------------
# Health check
# --------------------------------------------------------------------------
@app.get("/", tags=["Health"])
def root():
    return {
        "message": "Personal Finance Tracker API berjalan",
        "docs": "/docs",
        "version": app.version,
    }


@app.get("/health/db", tags=["Health"])
def health_db(db: DbDep):
    """Cek koneksi ke PostgreSQL."""
    db.execute(text("SELECT 1"))
    return {"message": "Koneksi database OK"}


# --------------------------------------------------------------------------
# Penanganan error terpusat. Bentuk response selalu {"error": "..."}.
# Detail teknis (query, stack trace, connection string) hanya masuk log.
# --------------------------------------------------------------------------
def _error(status_code: int, message: str, headers: dict | None = None) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"error": message}, headers=headers)


def _format_validation_error(err: dict) -> str:
    location = ".".join(
        str(part) for part in err["loc"] if part not in ("body", "query", "path")
    )
    message = err["msg"].removeprefix("Value error, ")
    return f"{location}: {message}" if location else message


@app.exception_handler(AppError)
async def handle_app_error(request: Request, exc: AppError):
    return _error(exc.status_code, exc.message)


@app.exception_handler(RequestValidationError)
async def handle_validation_error(request: Request, exc: RequestValidationError):
    messages = [_format_validation_error(e) for e in exc.errors()[:3]]
    return _error(400, "; ".join(messages))


@app.exception_handler(StarletteHTTPException)
async def handle_http_exception(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404 and exc.detail == "Not Found":
        message = "Endpoint tidak ditemukan"
    elif exc.status_code == 405:
        message = "Method tidak diizinkan untuk endpoint ini"
    else:
        message = str(exc.detail)
    return _error(exc.status_code, message, getattr(exc, "headers", None))


@app.exception_handler(IntegrityError)
async def handle_integrity_error(request: Request, exc: IntegrityError):
    # Jaring pengaman (mis. dua request bersamaan membuat data yang sama).
    logger.warning("IntegrityError: %s", exc.orig)
    return _error(409, "Data melanggar aturan duplikasi atau relasi")


@app.exception_handler(OperationalError)
async def handle_operational_error(request: Request, exc: OperationalError):
    logger.error("Database tidak dapat dihubungi: %s", exc.orig)
    return _error(503, "Database tidak dapat dihubungi")


@app.exception_handler(Exception)
async def handle_unexpected_error(request: Request, exc: Exception):
    logger.exception("Kesalahan tak terduga pada %s %s", request.method, request.url.path)
    return _error(500, "Terjadi kesalahan pada server")
