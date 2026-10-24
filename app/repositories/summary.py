"""Query agregasi. Semua angka dihitung dari data di database."""

from datetime import date
from decimal import Decimal

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models import Category, Transaction, Wallet


def totals(
    db: Session, user_id: int, wallet_id: int | None = None
) -> tuple[Decimal, Decimal, Decimal, int]:
    """(saldo_awal, total_pemasukan, total_pengeluaran, jumlah_transaksi).
    Saldo awal dijumlahkan dari tabel wallets sekali saja, terpisah dari
    transaksi, supaya tidak terhitung ganda."""
    initial_stmt = select(func.coalesce(func.sum(Wallet.initial_balance), 0)).where(
        Wallet.user_id == user_id
    )
    if wallet_id is not None:
        initial_stmt = initial_stmt.where(Wallet.id == wallet_id)
    initial = db.scalar(initial_stmt)

    tx_stmt = select(
        func.coalesce(
            func.sum(case((Transaction.type == "income", Transaction.amount), else_=0)),
            0,
        ),
        func.coalesce(
            func.sum(case((Transaction.type == "expense", Transaction.amount), else_=0)),
            0,
        ),
        func.count(Transaction.id),
    ).where(Transaction.user_id == user_id)
    if wallet_id is not None:
        tx_stmt = tx_stmt.where(Transaction.wallet_id == wallet_id)
    income, expense, count = db.execute(tx_stmt).one()
    return initial, income, expense, count


def expense_by_category(
    db: Session, user_id: int, start: date, next_start: date
) -> list[tuple[int, str, Decimal]]:
    """Pengeluaran per kategori pada rentang [start, next_start)."""
    total = func.sum(Transaction.amount)
    stmt = (
        select(Category.id, Category.name, total)
        .join(Category, Category.id == Transaction.category_id)
        .where(
            Transaction.user_id == user_id,
            Transaction.type == "expense",
            Transaction.transaction_date >= start,
            Transaction.transaction_date < next_start,
        )
        .group_by(Category.id, Category.name)
        .order_by(total.desc(), Category.id)
    )
    return [(row[0], row[1], row[2]) for row in db.execute(stmt)]


def spent_in_month(
    db: Session, user_id: int, category_id: int, start: date, next_start: date
) -> Decimal:
    stmt = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
        Transaction.user_id == user_id,
        Transaction.category_id == category_id,
        Transaction.type == "expense",
        Transaction.transaction_date >= start,
        Transaction.transaction_date < next_start,
    )
    return db.scalar(stmt)
