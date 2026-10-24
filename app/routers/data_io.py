from fastapi import APIRouter, Response

from app.deps import DbDep, UserIdQuery
from app.schemas import Envelope, ExportOut, ImportPayload, ImportResultOut
from app.services import data_io as service

router = APIRouter(prefix="/api/v1", tags=["Export / Import JSON"])


@router.get("/export", response_model=Envelope[ExportOut])
def simpan_data_ke_json(user_id: UserIdQuery, db: DbDep, response: Response):
    """Cadangan data satu pengguna dalam bentuk JSON (diunduh sebagai file)."""
    data = service.simpan_data_ke_json(db, user_id)
    response.headers["Content-Disposition"] = (
        f'attachment; filename="finance-export-user-{user_id}.json"'
    )
    return {"message": "Data berhasil diekspor", "data": data}


@router.post("/import", status_code=201, response_model=Envelope[ImportResultOut])
def muat_data_dari_json(body: ImportPayload, db: DbDep):
    """Impor banyak transaksi sekaligus (maks. 500). Semua atau tidak sama sekali."""
    count = service.muat_data_dari_json(db, body)
    return {
        "message": "Data berhasil diimpor",
        "data": {"imported": count},
    }
