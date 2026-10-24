from typing import Annotated

from fastapi import APIRouter, Query

from app.deps import DbDep, OptionalIdQuery, UserIdQuery
from app.schemas import CategorySummaryOut, Envelope, SummaryOut
from app.services import summary as service

router = APIRouter(prefix="/api/v1/summary", tags=["Summary"])


@router.get("", response_model=Envelope[SummaryOut])
def hitung_total_saldo(
    user_id: UserIdQuery, db: DbDep, wallet_id: OptionalIdQuery = None
):
    """Saldo awal, total pemasukan, total pengeluaran, dan saldo saat ini.
    Isi `wallet_id` untuk menghitung satu dompet saja."""
    return {
        "message": "Ringkasan berhasil dihitung",
        "data": service.hitung_total_saldo(db, user_id, wallet_id),
    }


@router.get("/by-category", response_model=Envelope[CategorySummaryOut])
def ringkasan_per_kategori(
    user_id: UserIdQuery,
    db: DbDep,
    month: Annotated[
        str | None, Query(description="Format YYYY-MM; default bulan berjalan")
    ] = None,
):
    return {
        "message": "Ringkasan berhasil dihitung",
        "data": service.ringkasan_per_kategori(db, user_id, month),
    }
