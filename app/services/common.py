from sqlalchemy.orm import Session

from app.exceptions import NotFound
from app.models import User
from app.repositories import users as users_repo


def require_user(db: Session, user_id: int) -> User:
    user = users_repo.get(db, user_id)
    if user is None:
        raise NotFound("Pengguna tidak ditemukan")
    return user


def save(db: Session, obj) -> None:
    """Commit lalu muat ulang objek (mengisi id, created_at, dst. dari database)."""
    db.commit()
    db.refresh(obj)
