from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Transaction, Wallet


def get(db: Session, wallet_id: int) -> Wallet | None:
    return db.get(Wallet, wallet_id)


def list_by_user(db: Session, user_id: int) -> list[Wallet]:
    stmt = select(Wallet).where(Wallet.user_id == user_id).order_by(Wallet.id)
    return list(db.scalars(stmt))


def find_by_name(db: Session, user_id: int, name: str) -> Wallet | None:
    """Cari dompet milik pengguna dengan nama sama (tanpa membedakan huruf besar/kecil)."""
    stmt = select(Wallet).where(
        Wallet.user_id == user_id, func.lower(Wallet.name) == name.lower()
    )
    return db.scalar(stmt)


def count_transactions(db: Session, wallet_id: int) -> int:
    stmt = select(func.count(Transaction.id)).where(Transaction.wallet_id == wallet_id)
    return db.scalar(stmt) or 0
