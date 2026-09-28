from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.eleves import InscriptionCreate, InscriptionUpdate, InscriptionRead
from app.crud import eleves as crud

router = APIRouter()


@router.get("/", response_model=list[InscriptionRead])
def list_inscriptions(id_eleve: int = None, id_annee: int = None, db: Session = Depends(get_db)):
    return crud.get_inscriptions(db, id_eleve=id_eleve, id_annee=id_annee)


@router.get("/{id_inscription}", response_model=InscriptionRead)
def get_inscription(id_inscription: int, db: Session = Depends(get_db)):
    obj = crud.get_inscription(db, id_inscription)
    if not obj:
        raise HTTPException(status_code=404, detail="Inscription introuvable")
    return obj


@router.post("/", response_model=InscriptionRead, status_code=201)
def create_inscription(data: InscriptionCreate, db: Session = Depends(get_db)):
    return crud.create_inscription(db, data)


@router.put("/{id_inscription}", response_model=InscriptionRead)
def update_inscription(id_inscription: int, data: InscriptionUpdate, db: Session = Depends(get_db)):
    obj = crud.update_inscription(db, id_inscription, data)
    if not obj:
        raise HTTPException(status_code=404, detail="Inscription introuvable")
    return obj


@router.delete("/{id_inscription}", status_code=204)
def delete_inscription(id_inscription: int, db: Session = Depends(get_db)):
    obj = crud.delete_inscription(db, id_inscription)
    if not obj:
        raise HTTPException(status_code=404, detail="Inscription introuvable")