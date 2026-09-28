from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.finance import PaiementCreate, PaiementRead
from app.crud import finance as crud

router = APIRouter()


@router.get("/", response_model=list[PaiementRead])
def list_paiements(id_inscription: int = None, db: Session = Depends(get_db)):
    return crud.get_paiements(db, id_inscription=id_inscription)


@router.get("/{id_paiement}", response_model=PaiementRead)
def get_paiement(id_paiement: int, db: Session = Depends(get_db)):
    obj = crud.get_paiement(db, id_paiement)
    if not obj:
        raise HTTPException(status_code=404, detail="Paiement introuvable")
    return obj


@router.post("/", response_model=PaiementRead, status_code=201)
def create_paiement(data: PaiementCreate, db: Session = Depends(get_db)):
    return crud.create_paiement(db, data)