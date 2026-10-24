from fastapi import APIRouter

from app.deps import DbDep, IdPath, UserIdQuery
from app.schemas import DeletedOut, Envelope, WalletCreate, WalletOut, WalletPatch
from app.services import wallets as service

router = APIRouter(prefix="/api/v1/wallets", tags=["Wallets"])


@router.get("", response_model=Envelope[list[WalletOut]])
def list_wallets(user_id: UserIdQuery, db: DbDep):
    return {
        "message": "Data berhasil diambil",
        "data": service.list_wallets(db, user_id),
    }


@router.get("/{wallet_id}", response_model=Envelope[WalletOut])
def get_wallet(wallet_id: IdPath, db: DbDep):
    return {
        "message": "Data berhasil diambil",
        "data": service.get_wallet(db, wallet_id),
    }


@router.post("", status_code=201, response_model=Envelope[WalletOut])
def create_wallet(body: WalletCreate, db: DbDep):
    return {
        "message": "Dompet berhasil dibuat",
        "data": service.create_wallet(db, body),
    }


@router.patch("/{wallet_id}", response_model=Envelope[WalletOut])
def update_wallet(wallet_id: IdPath, body: WalletPatch, db: DbDep):
    return {
        "message": "Dompet berhasil diubah",
        "data": service.update_wallet(db, wallet_id, body),
    }


@router.delete("/{wallet_id}", response_model=Envelope[DeletedOut])
def delete_wallet(wallet_id: IdPath, db: DbDep):
    """Ditolak (409) jika dompet masih dipakai transaksi."""
    service.delete_wallet(db, wallet_id)
    return {"message": "Dompet berhasil dihapus", "data": {"id": wallet_id}}
