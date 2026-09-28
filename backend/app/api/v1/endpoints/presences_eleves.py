from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.pedagogie import PresenceEleveCreate, PresenceEleveUpdate, PresenceEleveRead
from app.crud import pedagogie as crud

router = APIRouter()


@router.get("/", response_model=list[PresenceEleveRead])
def list_presences(id_inscription: int = None, db: Session = Depends(get_db)):
    return crud.get_presences(db, id_inscription=id_inscription)


@router.post("/", response_model=PresenceEleveRead, status_code=201)
def create_presence(data: PresenceEleveCreate, db: Session = Depends(get_db)):
    return crud.create_presence(db, data)


@router.put("/{id_presence}", response_model=PresenceEleveRead)
def update_presence(id_presence: int, data: PresenceEleveUpdate, db: Session = Depends(get_db)):
    obj = crud.update_presence(db, id_presence, data)
    if not obj:
        raise HTTPException(status_code=404, detail="Présence introuvable")
    return obj