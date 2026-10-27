from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.pedagogie import PresenceAppelRequest, PresenceAppelResponse, PresenceEleveCreate, PresenceEleveUpdate, PresenceEleveRead
from app.crud import pedagogie as crud

router = APIRouter()


@router.get("/", response_model=list[PresenceEleveRead])
def list_presences(
    id_inscription: int = None,
    id_annee: int = None,
    id_classe: int = None,
    date_presence: date = None,
    db: Session = Depends(get_db),
):
    return crud.get_presences(
        db,
        id_inscription=id_inscription,
        id_annee=id_annee,
        id_classe=id_classe,
        date_presence=date_presence,
    )


@router.post("/appel", response_model=PresenceAppelResponse)
def save_call(data: PresenceAppelRequest, db: Session = Depends(get_db)):
    return crud.enregistrer_appel(db, data)


@router.post("/", response_model=PresenceEleveRead, status_code=201)
def create_presence(data: PresenceEleveCreate, db: Session = Depends(get_db)):
    return crud.create_presence(db, data)


@router.put("/{id_presence}", response_model=PresenceEleveRead)
def update_presence(id_presence: int, data: PresenceEleveUpdate, db: Session = Depends(get_db)):
    obj = crud.update_presence(db, id_presence, data)
    if not obj:
        raise HTTPException(status_code=404, detail="Présence introuvable")
    return obj