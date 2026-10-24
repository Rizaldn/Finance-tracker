"""Ekspor/impor JSON.

Penyimpanan utama sekarang PostgreSQL, jadi simpanDataKeJson() dan
muatDataDariJson() berubah peran menjadi fitur cadangan/pemulihan lewat API
(bukan membaca/menulis file lokal; filesystem Vercel tidak permanen).

  simpanDataKeJson() -> simpan_data_ke_json()  (GET  /api/v1/export)
  muatDataDariJson() -> muat_data_dari_json()  (POST /api/v1/import)
"""

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.repositories import budgets as budgets_repo
from app.repositories import categories as categories_repo
from app.repositories import transactions as tx_repo
from app.repositories import wallets as wallets_repo
from app.schemas import BudgetOut, ExportOut, ImportPayload, UserOut
from app.services import transactions as tx_service
from app.services.common import require_user


def simpan_data_ke_json(db: Session, user_id: int) -> ExportOut:
    user = require_user(db, user_id)
    own_categories = [
        c for c in categories_repo.list_visible(db, user_id, None) if c.user_id == user_id
    ]
    return ExportOut(
        exported_at=datetime.now(timezone.utc),
        user=UserOut.model_validate(user),
        wallets=wallets_repo.list_by_user(db, user_id),
        categories=own_categories,
        transactions=tx_repo.list_all_by_user(db, user_id),
        budgets=[
            BudgetOut.model_validate(b)
            for b in budgets_repo.list_by_user(db, user_id, limit=1000)
        ],
    )


def muat_data_dari_json(db: Session, payload: ImportPayload) -> int:
    """Impor transaksi. wallet_id/category_id harus sudah ada di database dan
    sesuai pemilik; satu baris gagal = seluruh impor dibatalkan."""
    return tx_service.tambah_banyak_transaksi(db, payload.user_id, payload.transactions)
