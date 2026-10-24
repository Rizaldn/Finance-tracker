from sqlalchemy.orm import Session

from app.exceptions import Conflict, NotFound
from app.models import Category
from app.repositories import categories as categories_repo
from app.schemas import CategoryCreate, CategoryPatch
from app.services.common import require_user, save

NAME_TAKEN = "Kategori dengan nama dan tipe yang sama sudah ada"


def list_categories(
    db: Session, user_id: int | None, tx_type: str | None
) -> list[Category]:
    if user_id is not None:
        require_user(db, user_id)
    return categories_repo.list_visible(db, user_id, tx_type)


def get_category(db: Session, category_id: int) -> Category:
    category = categories_repo.get(db, category_id)
    if category is None:
        raise NotFound("Kategori tidak ditemukan")
    return category


def create_category(db: Session, data: CategoryCreate) -> Category:
    require_user(db, data.user_id)
    if categories_repo.find_duplicate(db, data.user_id, data.name, data.type):
        raise Conflict(NAME_TAKEN)
    category = Category(
        user_id=data.user_id, name=data.name, type=data.type, is_default=False
    )
    db.add(category)
    save(db, category)
    return category


def update_category(db: Session, category_id: int, data: CategoryPatch) -> Category:
    category = get_category(db, category_id)
    if category.is_default:
        raise Conflict("Kategori bawaan tidak dapat diubah")
    new_name = data.name
    if new_name and categories_repo.find_duplicate(
        db, category.user_id, new_name, category.type, exclude_id=category.id
    ):
        raise Conflict(NAME_TAKEN)
    category.name = new_name
    save(db, category)
    return category


def delete_category(db: Session, category_id: int) -> None:
    category = get_category(db, category_id)
    if category.is_default:
        raise Conflict("Kategori bawaan tidak dapat dihapus")
    if categories_repo.count_usage(db, category.id) > 0:
        raise Conflict("Kategori masih digunakan oleh transaksi atau anggaran")
    db.delete(category)
    db.commit()
