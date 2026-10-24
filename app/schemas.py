"""Skema Pydantic: validasi request dan bentuk response.

Nilai uang dikirim/diterima sebagai Decimal. Di JSON, Decimal menjadi string
dengan 2 desimal (contoh "18000.00") agar tidak ada selisih pembulatan float.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Annotated, ClassVar, Generic, Literal, TypeVar

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    field_validator,
    model_validator,
)

MAX_ID = 9_223_372_036_854_775_807  # batas BIGINT PostgreSQL

TxType = Literal["income", "expense"]
Id = Annotated[int, Field(ge=1, le=MAX_ID)]
Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
Email = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        to_lower=True,
        max_length=255,
        pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$",
    ),
]
Note = Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)]
PositiveMoney = Annotated[Decimal, Field(gt=0, max_digits=14, decimal_places=2)]
NonNegativeMoney = Annotated[Decimal, Field(ge=0, max_digits=14, decimal_places=2)]


# --------------------------------------------------------------------------
# Envelope response: {"message": ..., "data": ...}
# --------------------------------------------------------------------------
T = TypeVar("T")


class Envelope(BaseModel, Generic[T]):
    message: str
    data: T


class PageMeta(BaseModel):
    total: int
    limit: int
    offset: int


class PagedEnvelope(BaseModel, Generic[T]):
    message: str
    data: list[T]
    meta: PageMeta


class DeletedOut(BaseModel):
    id: int


# --------------------------------------------------------------------------
# Dasar untuk PATCH: minimal satu field, dan field non-nullable tidak boleh null
# --------------------------------------------------------------------------
class PatchModel(BaseModel):
    nullable_fields: ClassVar[frozenset[str]] = frozenset()

    @model_validator(mode="after")
    def _validate_patch(self):
        if not self.model_fields_set:
            raise ValueError("Minimal satu field harus diisi")
        for name in self.model_fields_set:
            if getattr(self, name) is None and name not in self.nullable_fields:
                raise ValueError(f"{name} tidak boleh null")
        return self


# --------------------------------------------------------------------------
# Users
# --------------------------------------------------------------------------
class UserCreate(BaseModel):
    name: Name
    email: Email


class UserPatch(PatchModel):
    name: Name | None = None
    email: Email | None = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    created_at: datetime


# --------------------------------------------------------------------------
# Wallets
# --------------------------------------------------------------------------
class WalletCreate(BaseModel):
    user_id: Id
    name: Name
    initial_balance: NonNegativeMoney = Decimal("0")


class WalletPatch(PatchModel):
    name: Name | None = None
    initial_balance: NonNegativeMoney | None = None


class WalletOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    name: str
    initial_balance: Decimal
    created_at: datetime


# --------------------------------------------------------------------------
# Categories
# --------------------------------------------------------------------------
class CategoryCreate(BaseModel):
    user_id: Id
    name: Name
    type: TxType


class CategoryPatch(PatchModel):
    name: Name | None = None


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None
    name: str
    type: str
    is_default: bool
    created_at: datetime


# --------------------------------------------------------------------------
# Transactions
# --------------------------------------------------------------------------
class TransactionBase(BaseModel):
    wallet_id: Id
    category_id: Id
    type: TxType
    amount: PositiveMoney
    transaction_date: date | None = None  # default: hari ini
    note: Note | None = None


class TransactionCreate(TransactionBase):
    user_id: Id


class TransactionReplace(BaseModel):
    """Body PUT: semua field yang bisa diedit wajib dikirim ulang.
    user_id tidak bisa diubah, jadi tidak ada di sini."""

    wallet_id: Id
    category_id: Id
    type: TxType
    amount: PositiveMoney
    transaction_date: date
    note: Note | None = None


class TransactionPatch(PatchModel):
    nullable_fields: ClassVar[frozenset[str]] = frozenset({"note"})

    wallet_id: Id | None = None
    category_id: Id | None = None
    type: TxType | None = None
    amount: PositiveMoney | None = None
    transaction_date: date | None = None
    note: Note | None = None


class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    wallet_id: int
    category_id: int
    type: str
    amount: Decimal
    transaction_date: date
    note: str | None
    created_at: datetime
    updated_at: datetime


# --------------------------------------------------------------------------
# Budgets
# --------------------------------------------------------------------------
class BudgetCreate(BaseModel):
    user_id: Id
    category_id: Id
    amount_limit: PositiveMoney
    budget_month: date

    @field_validator("budget_month")
    @classmethod
    def _first_day_only(cls, value: date) -> date:
        if value.day != 1:
            raise ValueError("budget_month harus tanggal 1, contoh 2026-10-01")
        return value


class BudgetPatch(PatchModel):
    amount_limit: PositiveMoney | None = None


class BudgetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    category_id: int
    amount_limit: Decimal
    budget_month: date
    created_at: datetime
    # Dihitung dari transaksi bulan tersebut (bukan disimpan di database)
    spent: Decimal | None = None
    remaining: Decimal | None = None
    percentage_used: float | None = None


# --------------------------------------------------------------------------
# Summary
# --------------------------------------------------------------------------
class SummaryOut(BaseModel):
    initial_balance: Decimal
    total_income: Decimal
    total_expense: Decimal
    current_balance: Decimal
    total_transactions: int


class CategorySpendingOut(BaseModel):
    category_id: int
    category_name: str
    total_expense: Decimal
    budget_limit: Decimal | None = None
    percentage_used: float | None = None


class CategorySummaryOut(BaseModel):
    month: str
    total_expense: Decimal
    categories: list[CategorySpendingOut]


# --------------------------------------------------------------------------
# Export / import JSON (pengganti simpanDataKeJson / muatDataDariJson)
# --------------------------------------------------------------------------
class ExportOut(BaseModel):
    exported_at: datetime
    user: UserOut
    wallets: list[WalletOut]
    categories: list[CategoryOut]  # hanya kategori milik pengguna
    transactions: list[TransactionOut]
    budgets: list[BudgetOut]


class ImportPayload(BaseModel):
    user_id: Id
    transactions: Annotated[list[TransactionBase], Field(min_length=1, max_length=500)]


class ImportResultOut(BaseModel):
    imported: int
