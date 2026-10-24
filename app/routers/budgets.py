from typing import Annotated

from fastapi import APIRouter, Query

from app.deps import DbDep, IdPath, UserIdQuery
from app.schemas import (
    BudgetCreate,
    BudgetOut,
    BudgetPatch,
    DeletedOut,
    Envelope,
)
from app.services import budgets as service

router = APIRouter(prefix="/api/v1/budgets", tags=["Budgets"])


@router.get("", response_model=Envelope[list[BudgetOut]])
def list_budgets(
    user_id: UserIdQuery,
    db: DbDep,
    month: Annotated[str | None, Query(description="Format YYYY-MM")] = None,
):
    return {
        "message": "Data berhasil diambil",
        "data": service.list_budgets(db, user_id, month),
    }


@router.get("/{budget_id}", response_model=Envelope[BudgetOut])
def get_budget(budget_id: IdPath, db: DbDep):
    return {
        "message": "Data berhasil diambil",
        "data": service.get_budget(db, budget_id),
    }


@router.post("", status_code=201, response_model=Envelope[BudgetOut])
def create_budget(body: BudgetCreate, db: DbDep):
    return {
        "message": "Anggaran berhasil dibuat",
        "data": service.create_budget(db, body),
    }


@router.patch("/{budget_id}", response_model=Envelope[BudgetOut])
def update_budget(budget_id: IdPath, body: BudgetPatch, db: DbDep):
    return {
        "message": "Anggaran berhasil diubah",
        "data": service.update_budget(db, budget_id, body),
    }


@router.delete("/{budget_id}", response_model=Envelope[DeletedOut])
def delete_budget(budget_id: IdPath, db: DbDep):
    service.delete_budget(db, budget_id)
    return {"message": "Anggaran berhasil dihapus", "data": {"id": budget_id}}
