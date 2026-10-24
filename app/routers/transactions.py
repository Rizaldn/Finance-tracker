from datetime import date
from typing import Annotated

from fastapi import APIRouter, Query

from app.deps import DbDep, IdPath, OptionalIdQuery, UserIdQuery
from app.schemas import (
    DeletedOut,
    Envelope,
    PagedEnvelope,
    TransactionCreate,
    TransactionOut,
    TransactionPatch,
    TransactionReplace,
    TxType,
)
from app.services import transactions as service

router = APIRouter(prefix="/api/v1/transactions", tags=["Transactions"])


@router.get("", response_model=PagedEnvelope[TransactionOut])
def get_semua_transaksi(
    user_id: UserIdQuery,
    db: DbDep,
    category_id: OptionalIdQuery = None,
    wallet_id: OptionalIdQuery = None,
    tx_type: Annotated[TxType | None, Query(alias="type")] = None,
    start_date: date | None = None,
    end_date: date | None = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    """Daftar transaksi. Isi `category_id` untuk memfilter per kategori."""
    rows, total = service.get_semua_transaksi(
        db,
        user_id=user_id,
        category_id=category_id,
        tx_type=tx_type,
        wallet_id=wallet_id,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
    )
    return {
        "message": "Data berhasil diambil",
        "data": rows,
        "meta": {"total": total, "limit": limit, "offset": offset},
    }


@router.get("/{transaction_id}", response_model=Envelope[TransactionOut])
def get_transaksi(transaction_id: IdPath, db: DbDep):
    return {
        "message": "Data berhasil diambil",
        "data": service.get_transaksi(db, transaction_id),
    }


@router.post("", status_code=201, response_model=Envelope[TransactionOut])
def tambah_transaksi(body: TransactionCreate, db: DbDep):
    return {
        "message": "Transaksi berhasil ditambahkan",
        "data": service.tambah_transaksi(db, body),
    }


@router.put("/{transaction_id}", response_model=Envelope[TransactionOut])
def replace_transaksi(transaction_id: IdPath, body: TransactionReplace, db: DbDep):
    """Ganti seluruh field yang bisa diedit (user_id tidak bisa diubah)."""
    return {
        "message": "Transaksi berhasil diperbarui",
        "data": service.ubah_transaksi(db, transaction_id, body.model_dump()),
    }


@router.patch("/{transaction_id}", response_model=Envelope[TransactionOut])
def patch_transaksi(transaction_id: IdPath, body: TransactionPatch, db: DbDep):
    return {
        "message": "Transaksi berhasil diubah",
        "data": service.ubah_transaksi(
            db, transaction_id, body.model_dump(exclude_unset=True)
        ),
    }


@router.delete("/{transaction_id}", response_model=Envelope[DeletedOut])
def hapus_transaksi(transaction_id: IdPath, db: DbDep):
    service.hapus_transaksi(db, transaction_id)
    return {"message": "Transaksi berhasil dihapus", "data": {"id": transaction_id}}
