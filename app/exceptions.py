"""Exception aplikasi. Diterjemahkan menjadi response {"error": "..."} di main.py."""


class AppError(Exception):
    status_code = 500

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class BadRequest(AppError):
    """400 - input tidak valid."""

    status_code = 400


class NotFound(AppError):
    """404 - data tidak ditemukan."""

    status_code = 404


class Conflict(AppError):
    """409 - duplikasi atau pelanggaran aturan relasi."""

    status_code = 409
