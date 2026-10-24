"""Logika bisnis transaksi.

Pemetaan ke fungsi proyek awal:
  tambahTransaksi()   -> tambah_transaksi()
  getSemuaTransaksi() -> get_semua_transaksi()  (filter category_id =
                         getTransaksiByKategori())
  hapusTransaksi()    -> hapus_transaksi()
"""

from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import today
from app.exceptions import BadRequest, NotFound
from app.models import Transaction
from app.repositories import categories as categories_repo
from app.repositories import transactions as tx_repo
from app.repositories import wallets as wallets_repo
from app.schemas import TransactionBase, TransactionCreate
from app.services.common import require_user, save


def _check_refs(
    db: Session, user_id: int, wallet_id: int, category_id: int, tx_type: str
) -> None:
    """Aturan bisnis: dompet harus milik pengguna, kategori harus bawaan atau
    milik pengguna, dan tipe kategori harus sama dengan tipe transaksi."""
    wallet = wallets_repo.get(db, wallet_id)
    if wallet is None or wallet.user_id != user_id:
        raise BadRequest("wallet_id tidak ditemukan untuk pengguna ini")

    category = categories_repo.get(db, category_id)
    if category is None or category.user_id not in (None, user_id):
        raise BadRequest("category_id tidak ditemukan untuk pengguna ini")
    if category.type != tx_type:
        raise BadRequest(
            f"Kategori '{category.name}' bertipe {category.type}, "
            f"tidak dapat dipakai untuk transaksi {tx_type}"
        )


def _build(db: Session, user_id: int, item: TransactionBase) -> Transaction:
    _check_refs(db, user_id, item.wallet_id, item.category_id, item.type)
    return Transaction(
        user_id=user_id,
        wallet_id=item.wallet_id,
        category_id=item.category_id,
        type=item.type,
        amount=item.amount,
        transaction_date=item.transaction_date or today(),
        note=item.note,
    )


def tambah_transaksi(db: Session, data: TransactionCreate) -> Transaction:
    require_user(db, data.user_id)
    tx = _build(db, data.user_id, data)
    db.add(tx)
    save(db, tx)
    return tx


def tambah_banyak_transaksi(
    db: Session, user_id: int, items: list[TransactionBase]
) -> int:
    """Semua berhasil atau tidak ada yang tersimpan (satu commit di akhir)."""
    require_user(db, user_id)
    rows = []
    for index, item in enumerate(items):
        try:
            rows.append(_build(db, user_id, item))
        except BadRequest as exc:
            raise BadRequest(f"transactions[{index}]: {exc.message}") from None
    db.add_all(rows)
    db.commit()
    return len(rows)


def get_semua_transaksi(
    db: Session,
    *,
    user_id: int,
    category_id: int | None = None,
    tx_type: str | None = None,
    wallet_id: int | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[Transaction], int]:
    require_user(db, user_id)
    if start_date and end_date and start_date > end_date:
        raise BadRequest("start_date tidak boleh setelah end_date")
    return tx_repo.search(
        db,
        user_id=user_id,
        category_id=category_id,
        tx_type=tx_type,
        wallet_id=wallet_id,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
    )


def get_transaksi(db: Session, transaction_id: int) -> Transaction:
    tx = tx_repo.get(db, transaction_id)
    if tx is None:
        raise NotFound("Transaksi tidak ditemukan")
    return tx


def ubah_transaksi(db: Session, transaction_id: int, changes: dict) -> Transaction:
    """Dipakai PUT (semua field) dan PATCH (sebagian). Data hasil gabungan
    divalidasi ulang, misalnya mengganti type harus diikuti kategori yang cocok."""
    tx = get_transaksi(db, transaction_id)
    merged = {
        "wallet_id": changes.get("wallet_id", tx.wallet_id),
        "category_id": changes.get("category_id", tx.category_id),
        "type": changes.get("type", tx.type),
    }
    _check_refs(
        db, tx.user_id, merged["wallet_id"], merged["category_id"], merged["type"]
    )
    for key, value in changes.items():
        setattr(tx, key, value)
    tx.updated_at = func.now()
    save(db, tx)
    return tx


def hapus_transaksi(db: Session, transaction_id: int) -> None:
    tx = get_transaksi(db, transaction_id)
    db.delete(tx)
    db.commit()
