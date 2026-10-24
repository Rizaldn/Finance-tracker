from sqlalchemy.orm import Session

from app.exceptions import BadRequest, Conflict, NotFound
from app.models import Budget
from app.repositories import budgets as budgets_repo
from app.repositories import categories as categories_repo
from app.repositories import summary as summary_repo
from app.schemas import BudgetCreate, BudgetOut, BudgetPatch
from app.services.common import require_user, save
from app.utils.validators import month_bounds, money, parse_month


def _with_usage(db: Session, budget: Budget) -> BudgetOut:
    """Tambahkan pemakaian anggaran: pengeluaran kategori pada bulan itu
    dibanding amount_limit."""
    start, next_start = month_bounds(budget.budget_month)
    spent = money(
        summary_repo.spent_in_month(
            db, budget.user_id, budget.category_id, start, next_start
        )
    )
    out = BudgetOut.model_validate(budget)
    out.spent = spent
    out.remaining = money(budget.amount_limit - spent)
    out.percentage_used = float(round(spent / budget.amount_limit * 100, 2))
    return out


def _get_budget(db: Session, budget_id: int) -> Budget:
    budget = budgets_repo.get(db, budget_id)
    if budget is None:
        raise NotFound("Anggaran tidak ditemukan")
    return budget


def list_budgets(db: Session, user_id: int, month: str | None) -> list[BudgetOut]:
    require_user(db, user_id)
    month_start = parse_month(month) if month else None
    budgets = budgets_repo.list_by_user(db, user_id, month_start)
    return [_with_usage(db, b) for b in budgets]


def get_budget(db: Session, budget_id: int) -> BudgetOut:
    return _with_usage(db, _get_budget(db, budget_id))


def create_budget(db: Session, data: BudgetCreate) -> BudgetOut:
    require_user(db, data.user_id)
    category = categories_repo.get(db, data.category_id)
    if category is None or category.user_id not in (None, data.user_id):
        raise BadRequest("category_id tidak ditemukan untuk pengguna ini")
    if category.type != "expense":
        raise BadRequest("Anggaran hanya dapat dibuat untuk kategori bertipe expense")
    if budgets_repo.find(db, data.user_id, data.category_id, data.budget_month):
        raise Conflict("Anggaran untuk kategori dan bulan ini sudah ada")

    budget = Budget(
        user_id=data.user_id,
        category_id=data.category_id,
        amount_limit=data.amount_limit,
        budget_month=data.budget_month,
    )
    db.add(budget)
    save(db, budget)
    return _with_usage(db, budget)


def update_budget(db: Session, budget_id: int, data: BudgetPatch) -> BudgetOut:
    budget = _get_budget(db, budget_id)
    budget.amount_limit = data.amount_limit
    save(db, budget)
    return _with_usage(db, budget)


def delete_budget(db: Session, budget_id: int) -> None:
    budget = _get_budget(db, budget_id)
    db.delete(budget)
    db.commit()
