from typing import Annotated

from fastapi import APIRouter, Query

from app.deps import DbDep, IdPath, OptionalIdQuery
from app.schemas import (
    CategoryCreate,
    CategoryOut,
    CategoryPatch,
    DeletedOut,
    Envelope,
    TxType,
)
from app.services import categories as service

router = APIRouter(prefix="/api/v1/categories", tags=["Categories"])


@router.get("", response_model=Envelope[list[CategoryOut]])
def list_categories(
    db: DbDep,
    user_id: OptionalIdQuery = None,
    tx_type: Annotated[TxType | None, Query(alias="type")] = None,
):
    """Kategori bawaan + milik pengguna. Tanpa user_id: hanya kategori bawaan."""
    return {
        "message": "Data berhasil diambil",
        "data": service.list_categories(db, user_id, tx_type),
    }


@router.get("/{category_id}", response_model=Envelope[CategoryOut])
def get_category(category_id: IdPath, db: DbDep):
    return {
        "message": "Data berhasil diambil",
        "data": service.get_category(db, category_id),
    }


@router.post("", status_code=201, response_model=Envelope[CategoryOut])
def create_category(body: CategoryCreate, db: DbDep):
    return {
        "message": "Kategori berhasil dibuat",
        "data": service.create_category(db, body),
    }


@router.patch("/{category_id}", response_model=Envelope[CategoryOut])
def update_category(category_id: IdPath, body: CategoryPatch, db: DbDep):
    return {
        "message": "Kategori berhasil diubah",
        "data": service.update_category(db, category_id, body),
    }


@router.delete("/{category_id}", response_model=Envelope[DeletedOut])
def delete_category(category_id: IdPath, db: DbDep):
    """Ditolak (409) untuk kategori bawaan atau yang masih dipakai."""
    service.delete_category(db, category_id)
    return {"message": "Kategori berhasil dihapus", "data": {"id": category_id}}
