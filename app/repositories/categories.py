from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models import Budget, Category, Transaction


def get(db: Session, category_id: int) -> Category | None:
    return db.get(Category, category_id)


def list_visible(
    db: Session, user_id: int | None, tx_type: str | None
) -> list[Category]:
    """Kategori yang terlihat oleh pengguna: bawaan + miliknya.
    Tanpa user_id hanya kategori bawaan."""
    if user_id is None:
        scope = Category.user_id.is_(None)
    else:
        scope = or_(Category.user_id.is_(None), Category.user_id == user_id)
    stmt = select(Category).where(scope)
    if tx_type:
        stmt = stmt.where(Category.type == tx_type)
    return list(db.scalars(stmt.order_by(Category.type, Category.name, Category.id)))


def find_duplicate(
    db: Session,
    user_id: int | None,
    name: str,
    tx_type: str,
    exclude_id: int | None = None,
) -> Category | None:
    """Nama + tipe yang sama pada lingkup pengguna (bawaan ikut dihitung)."""
    if user_id is None:
        scope = Category.user_id.is_(None)
    else:
        scope = or_(Category.user_id.is_(None), Category.user_id == user_id)
    stmt = select(Category).where(
        scope, func.lower(Category.name) == name.lower(), Category.type == tx_type
    )
    if exclude_id is not None:
        stmt = stmt.where(Category.id != exclude_id)
    return db.scalar(stmt)


def count_usage(db: Session, category_id: int) -> int:
    """Jumlah transaksi + anggaran yang memakai kategori ini."""
    tx = db.scalar(
        select(func.count(Transaction.id)).where(Transaction.category_id == category_id)
    )
    bd = db.scalar(
        select(func.count(Budget.id)).where(Budget.category_id == category_id)
    )
    return (tx or 0) + (bd or 0)
