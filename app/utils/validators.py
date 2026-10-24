"""Helper validasi dan format yang dipakai lintas service."""

import re
from datetime import date
from decimal import Decimal

from app.exceptions import BadRequest

_MONTH_RE = re.compile(r"^(\d{4})-(0[1-9]|1[0-2])$")


def parse_month(value: str) -> date:
    """'2026-10' -> date(2026, 10, 1)."""
    match = _MONTH_RE.match(value or "")
    if not match:
        raise BadRequest("month harus berformat YYYY-MM, contoh 2026-10")
    try:
        return date(int(match[1]), int(match[2]), 1)
    except ValueError:
        raise BadRequest("month tidak valid") from None


def month_bounds(first_day: date) -> tuple[date, date]:
    """Rentang setengah-terbuka [awal bulan, awal bulan berikutnya)."""
    if first_day.month == 12:
        next_month = date(first_day.year + 1, 1, 1)
    else:
        next_month = date(first_day.year, first_day.month + 1, 1)
    return first_day, next_month


def money(value) -> Decimal:
    """Samakan semua nilai uang menjadi 2 desimal (mis. '0' -> '0.00')."""
    return Decimal(value or 0).quantize(Decimal("0.01"))
