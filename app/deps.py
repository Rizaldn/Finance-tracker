"""Tipe dependency/parameter yang dipakai ulang di router."""

from typing import Annotated

from fastapi import Depends, Path, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import MAX_ID

DbDep = Annotated[Session, Depends(get_db)]

# ID di path, contoh: /transactions/{id}
IdPath = Annotated[int, Path(ge=1, le=MAX_ID)]
# user_id wajib di query (versi demo tanpa autentikasi)
UserIdQuery = Annotated[int, Query(ge=1, le=MAX_ID)]
# filter ID opsional di query
OptionalIdQuery = Annotated[int | None, Query(ge=1, le=MAX_ID)]
