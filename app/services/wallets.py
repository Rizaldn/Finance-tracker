from sqlalchemy.orm import Session

from app.exceptions import Conflict, NotFound
from app.models import Wallet
from app.repositories import wallets as wallets_repo
from app.schemas import WalletCreate, WalletPatch
from app.services.common import require_user, save

NAME_TAKEN = "Pengguna sudah memiliki dompet dengan nama tersebut"


def list_wallets(db: Session, user_id: int) -> list[Wallet]:
    require_user(db, user_id)
    return wallets_repo.list_by_user(db, user_id)


def get_wallet(db: Session, wallet_id: int) -> Wallet:
    wallet = wallets_repo.get(db, wallet_id)
    if wallet is None:
        raise NotFound("Dompet tidak ditemukan")
    return wallet


def create_wallet(db: Session, data: WalletCreate) -> Wallet:
    require_user(db, data.user_id)
    if wallets_repo.find_by_name(db, data.user_id, data.name):
        raise Conflict(NAME_TAKEN)
    wallet = Wallet(
        user_id=data.user_id, name=data.name, initial_balance=data.initial_balance
    )
    db.add(wallet)
    save(db, wallet)
    return wallet


def update_wallet(db: Session, wallet_id: int, data: WalletPatch) -> Wallet:
    wallet = get_wallet(db, wallet_id)
    changes = data.model_dump(exclude_unset=True)
    new_name = changes.get("name")
    if new_name:
        other = wallets_repo.find_by_name(db, wallet.user_id, new_name)
        if other is not None and other.id != wallet.id:
            raise Conflict(NAME_TAKEN)
    for key, value in changes.items():
        setattr(wallet, key, value)
    save(db, wallet)
    return wallet


def delete_wallet(db: Session, wallet_id: int) -> None:
    wallet = get_wallet(db, wallet_id)
    if wallets_repo.count_transactions(db, wallet.id) > 0:
        raise Conflict("Dompet masih digunakan oleh transaksi")
    db.delete(wallet)
    db.commit()
