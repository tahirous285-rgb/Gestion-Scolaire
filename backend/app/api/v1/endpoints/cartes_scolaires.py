from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.documents import CarteScolaireCreate, CarteScolaireRead
from app.crud import documents as crud

router = APIRouter()


@router.get("/", response_model=list[CarteScolaireRead])
def list_cartes(id_inscription: int = None, db: Session = Depends(get_db)):
    return crud.get_cartes(db, id_inscription=id_inscription)


@router.get("/{id_carte}", response_model=CarteScolaireRead)
def get_carte(id_carte: int, db: Session = Depends(get_db)):
    obj = crud.get_carte(db, id_carte)
    if not obj:
        raise HTTPException(status_code=404, detail="Carte introuvable")
    return obj


@router.post("/", response_model=CarteScolaireRead, status_code=201)
def create_carte(data: CarteScolaireCreate, db: Session = Depends(get_db)):
    return crud.create_carte(db, data)


@router.put("/{id_carte}/reimprimer", response_model=CarteScolaireRead)
def reimprimer_carte(id_carte: int, db: Session = Depends(get_db)):
    obj = crud.reimprimer_carte(db, id_carte)
    if not obj:
        raise HTTPException(status_code=404, detail="Carte introuvable")
    return obj


@router.put("/{id_carte}/generer-qr", response_model=CarteScolaireRead)
def generer_qr(id_carte: int, db: Session = Depends(get_db)):
    obj = crud.generer_qr_image(db, id_carte)
    if not obj:
        raise HTTPException(status_code=404, detail="Carte introuvable")
    return obj