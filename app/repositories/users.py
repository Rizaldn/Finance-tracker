from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import User


def get(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def get_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email))


def list_all(db: Session, limit: int = 100) -> list[User]:
    return list(db.scalars(select(User).order_by(User.id).limit(limit)))
