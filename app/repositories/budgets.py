from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Budget


def get(db: Session, budget_id: int) -> Budget | None:
    return db.get(Budget, budget_id)


def list_by_user(
    db: Session, user_id: int, month: date | None = None, limit: int = 100
) -> list[Budget]:
    stmt = select(Budget).where(Budget.user_id == user_id)
    if month is not None:
        stmt = stmt.where(Budget.budget_month == month)
    stmt = stmt.order_by(Budget.budget_month.desc(), Budget.id).limit(limit)
    return list(db.scalars(stmt))


def find(db: Session, user_id: int, category_id: int, month: date) -> Budget | None:
    stmt = select(Budget).where(
        Budget.user_id == user_id,
        Budget.category_id == category_id,
        Budget.budget_month == month,
    )
    return db.scalar(stmt)
