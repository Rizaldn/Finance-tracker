"""Tes tanpa database: validasi input dan helper. Jalankan: pytest tests/test_schemas.py"""

from datetime import date
from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.exceptions import BadRequest
from app.schemas import (
    BudgetCreate,
    ImportPayload,
    TransactionCreate,
    TransactionPatch,
    UserCreate,
    WalletCreate,
)
from app.utils.validators import month_bounds, money, parse_month

VALID_TX = {
    "user_id": 1, "wallet_id": 1, "category_id": 3,
    "type": "expense", "amount": 18000, "note": "Makan siang",
}


def test_transaksi_valid():
    tx = TransactionCreate(**VALID_TX)
    assert tx.amount == Decimal("18000")
    assert tx.transaction_date is None  # default hari ini diisi di service


@pytest.mark.parametrize("amount", [0, -5, "abc", 10.555])
def test_amount_tidak_valid(amount):
    with pytest.raises(ValidationError):
        TransactionCreate(**{**VALID_TX, "amount": amount})


def test_type_tidak_valid():
    with pytest.raises(ValidationError):
        TransactionCreate(**{**VALID_TX, "type": "transfer"})


def test_tanggal_tidak_valid():
    with pytest.raises(ValidationError):
        TransactionCreate(**{**VALID_TX, "transaction_date": "2026-02-31"})


def test_patch_kosong_ditolak():
    with pytest.raises(ValidationError):
        TransactionPatch()


def test_patch_null_hanya_untuk_note():
    TransactionPatch(note=None)  # boleh: mengosongkan catatan
    with pytest.raises(ValidationError):
        TransactionPatch(amount=None)


def test_wallet_saldo_awal_tidak_boleh_negatif():
    with pytest.raises(ValidationError):
        WalletCreate(user_id=1, name="Cash", initial_balance=-1)


def test_email_dirapikan():
    assert UserCreate(name=" Budi ", email=" Budi@Example.COM ").email == "budi@example.com"
    with pytest.raises(ValidationError):
        UserCreate(name="Budi", email="bukan-email")


def test_budget_harus_tanggal_1():
    BudgetCreate(user_id=1, category_id=3, amount_limit=750000, budget_month="2026-10-01")
    with pytest.raises(ValidationError):
        BudgetCreate(user_id=1, category_id=3, amount_limit=750000, budget_month="2026-10-15")


def test_import_maksimal_500():
    item = {k: v for k, v in VALID_TX.items() if k != "user_id"}
    ImportPayload(user_id=1, transactions=[item])
    with pytest.raises(ValidationError):
        ImportPayload(user_id=1, transactions=[])
    with pytest.raises(ValidationError):
        ImportPayload(user_id=1, transactions=[item] * 501)


def test_parse_month():
    assert parse_month("2026-10") == date(2026, 10, 1)
    for bad in ("2026-13", "2026-1", "okt-2026", ""):
        with pytest.raises(BadRequest):
            parse_month(bad)


def test_month_bounds_desember():
    assert month_bounds(date(2026, 12, 1)) == (date(2026, 12, 1), date(2027, 1, 1))


def test_money_dua_desimal():
    assert str(money(0)) == "0.00"
    assert str(money(None)) == "0.00"
    assert str(money(Decimal("1325000"))) == "1325000.00"
