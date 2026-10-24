import os
from datetime import date, datetime
from zoneinfo import ZoneInfo

from dotenv import load_dotenv

load_dotenv()

# Zona waktu untuk "hari ini" (default tanggal transaksi, bulan berjalan).
# Server Vercel berjalan di UTC, jadi tanpa ini tanggal bisa meleset sehari.
APP_TIMEZONE = os.getenv("APP_TIMEZONE", "Asia/Jakarta")


def today() -> date:
    return datetime.now(ZoneInfo(APP_TIMEZONE)).date()
