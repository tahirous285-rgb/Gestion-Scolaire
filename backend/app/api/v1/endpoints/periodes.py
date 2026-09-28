from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.scolarite import PeriodeCreate, PeriodeRead
from app.crud import scolarite as crud

router = APIRouter()


@router.get("/", response_model=list[PeriodeRead])
def list_periodes(id_annee: int = None, db: Session = Depends(get_db)):
    return crud.get_periodes(db, id_annee=id_annee)


@router.post("/", response_model=PeriodeRead, status_code=201)
def create_periode(data: PeriodeCreate, db: Session = Depends(get_db)):
    return crud.create_periode(db, data)