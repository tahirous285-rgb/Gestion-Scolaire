from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.scolarite import MatiereCreate, MatiereUpdate, MatiereRead
from app.crud import scolarite as crud

router = APIRouter()


@router.get("/", response_model=list[MatiereRead])
def list_matieres(db: Session = Depends(get_db)):
    return crud.get_matieres(db)


@router.get("/{id_matiere}", response_model=MatiereRead)
def get_matiere(id_matiere: int, db: Session = Depends(get_db)):
    obj = crud.get_matiere(db, id_matiere)
    if not obj:
        raise HTTPException(status_code=404, detail="Matière introuvable")
    return obj


@router.post("/", response_model=MatiereRead, status_code=201)
def create_matiere(data: MatiereCreate, db: Session = Depends(get_db)):
    return crud.create_matiere(db, data)


@router.put("/{id_matiere}", response_model=MatiereRead)
def update_matiere(id_matiere: int, data: MatiereUpdate, db: Session = Depends(get_db)):
    obj = crud.update_matiere(db, id_matiere, data)
    if not obj:
        raise HTTPException(status_code=404, detail="Matière introuvable")
    return obj


@router.delete("/{id_matiere}", status_code=204)
def delete_matiere(id_matiere: int, db: Session = Depends(get_db)):
    obj = crud.delete_matiere(db, id_matiere)
    if not obj:
        raise HTTPException(status_code=404, detail="Matière introuvable")