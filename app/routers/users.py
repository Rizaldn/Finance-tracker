from fastapi import APIRouter

from app.deps import DbDep, IdPath
from app.schemas import DeletedOut, Envelope, UserCreate, UserOut, UserPatch
from app.services import users as service

router = APIRouter(prefix="/api/v1/users", tags=["Users"])


@router.get("", response_model=Envelope[list[UserOut]])
def list_users(db: DbDep):
    """Daftar pengguna (untuk pengujian/demo)."""
    return {"message": "Data berhasil diambil", "data": service.list_users(db)}


@router.get("/{user_id}", response_model=Envelope[UserOut])
def get_user(user_id: IdPath, db: DbDep):
    return {"message": "Data berhasil diambil", "data": service.get_user(db, user_id)}


@router.post("", status_code=201, response_model=Envelope[UserOut])
def create_user(body: UserCreate, db: DbDep):
    return {
        "message": "Pengguna berhasil dibuat",
        "data": service.create_user(db, body),
    }


@router.patch("/{user_id}", response_model=Envelope[UserOut])
def update_user(user_id: IdPath, body: UserPatch, db: DbDep):
    return {
        "message": "Pengguna berhasil diubah",
        "data": service.update_user(db, user_id, body),
    }


@router.delete("/{user_id}", response_model=Envelope[DeletedOut])
def delete_user(user_id: IdPath, db: DbDep):
    """Menghapus pengguna beserta dompet, transaksi, anggaran, dan kategori miliknya."""
    service.delete_user(db, user_id)
    return {"message": "Pengguna berhasil dihapus", "data": {"id": user_id}}
