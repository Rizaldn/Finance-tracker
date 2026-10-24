from sqlalchemy.orm import Session

from app.exceptions import Conflict
from app.models import User
from app.repositories import users as users_repo
from app.schemas import UserCreate, UserPatch
from app.services.common import require_user, save

EMAIL_TAKEN = "Email sudah terdaftar"


def list_users(db: Session) -> list[User]:
    return users_repo.list_all(db)


def get_user(db: Session, user_id: int) -> User:
    return require_user(db, user_id)


def create_user(db: Session, data: UserCreate) -> User:
    if users_repo.get_by_email(db, data.email):
        raise Conflict(EMAIL_TAKEN)
    user = User(name=data.name, email=data.email)
    db.add(user)
    save(db, user)
    return user


def update_user(db: Session, user_id: int, data: UserPatch) -> User:
    user = require_user(db, user_id)
    changes = data.model_dump(exclude_unset=True)
    new_email = changes.get("email")
    if new_email and new_email != user.email and users_repo.get_by_email(db, new_email):
        raise Conflict(EMAIL_TAKEN)
    for key, value in changes.items():
        setattr(user, key, value)
    save(db, user)
    return user


def delete_user(db: Session, user_id: int) -> None:
    """Dompet, kategori milik pengguna, transaksi, dan anggaran ikut terhapus
    (ON DELETE CASCADE di database)."""
    user = require_user(db, user_id)
    db.delete(user)
    db.commit()
