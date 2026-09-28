from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.administration import JournalActiviteCreate, JournalActiviteRead
from app.crud import administration as crud

router = APIRouter()


@router.get("/", response_model=list[JournalActiviteRead])
def list_journal(id_etablissement: int, limit: int = 20, db: Session = Depends(get_db)):
    return crud.get_journal(db, id_etablissement, limit=limit)


@router.post("/", response_model=JournalActiviteRead, status_code=201)
def create_journal(data: JournalActiviteCreate, db: Session = Depends(get_db)):
    return crud.create_journal_entry(db, data)