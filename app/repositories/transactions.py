from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Transaction


def get(db: Session, transaction_id: int) -> Transaction | None:
    return db.get(Transaction, transaction_id)


def search(
    db: Session,
    *,
    user_id: int,
    category_id: int | None = None,
    tx_type: str | None = None,
    wallet_id: int | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[Transaction], int]:
    """Daftar transaksi (terbaru dulu) beserta total baris sebelum pagination."""
    stmt = select(Transaction).where(Transaction.user_id == user_id)
    if category_id is not None:
        stmt = stmt.where(Transaction.category_id == category_id)
    if tx_type is not None:
        stmt = stmt.where(Transaction.type == tx_type)
    if wallet_id is not None:
        stmt = stmt.where(Transaction.wallet_id == wallet_id)
    if start_date is not None:
        stmt = stmt.where(Transaction.transaction_date >= start_date)
    if end_date is not None:
        stmt = stmt.where(Transaction.transaction_date <= end_date)

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.scalars(
        stmt.order_by(Transaction.transaction_date.desc(), Transaction.id.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(rows), total


def list_all_by_user(db: Session, user_id: int) -> list[Transaction]:
    stmt = (
        select(Transaction)
        .where(Transaction.user_id == user_id)
        .order_by(Transaction.transaction_date, Transaction.id)
    )
    return list(db.scalars(stmt))
