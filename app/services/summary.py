"""hitungTotalSaldo() -> hitung_total_saldo()

total_saldo = total_saldo_awal + total_pemasukan - total_pengeluaran
Semua angka dihitung dari database, bukan dari angka kiriman client.
"""

from sqlalchemy.orm import Session

from app.config import today
from app.exceptions import NotFound
from app.repositories import budgets as budgets_repo
from app.repositories import summary as summary_repo
from app.repositories import wallets as wallets_repo
from app.schemas import CategorySpendingOut, CategorySummaryOut, SummaryOut
from app.services.common import require_user
from app.utils.validators import month_bounds, money, parse_month


def hitung_total_saldo(
    db: Session, user_id: int, wallet_id: int | None = None
) -> SummaryOut:
    require_user(db, user_id)
    if wallet_id is not None:
        wallet = wallets_repo.get(db, wallet_id)
        if wallet is None or wallet.user_id != user_id:
            raise NotFound("Dompet tidak ditemukan untuk pengguna ini")

    initial, income, expense, count = summary_repo.totals(db, user_id, wallet_id)
    initial, income, expense = money(initial), money(income), money(expense)
    return SummaryOut(
        initial_balance=initial,
        total_income=income,
        total_expense=expense,
        current_balance=money(initial + income - expense),
        total_transactions=count,
    )


def ringkasan_per_kategori(
    db: Session, user_id: int, month: str | None
) -> CategorySummaryOut:
    """Pengeluaran per kategori pada satu bulan (default: bulan berjalan),
    dilengkapi anggaran bila ada."""
    require_user(db, user_id)
    first_day = parse_month(month) if month else today().replace(day=1)
    start, next_start = month_bounds(first_day)

    rows = summary_repo.expense_by_category(db, user_id, start, next_start)
    limits = {
        b.category_id: b.amount_limit
        for b in budgets_repo.list_by_user(db, user_id, first_day)
    }

    items: list[CategorySpendingOut] = []
    for category_id, name, total in rows:
        total = money(total)
        limit = limits.get(category_id)
        items.append(
            CategorySpendingOut(
                category_id=category_id,
                category_name=name,
                total_expense=total,
                budget_limit=limit,
                percentage_used=(
                    float(round(total / limit * 100, 2)) if limit else None
                ),
            )
        )
    return CategorySummaryOut(
        month=first_day.strftime("%Y-%m"),
        total_expense=money(sum((i.total_expense for i in items), 0)),
        categories=items,
    )
