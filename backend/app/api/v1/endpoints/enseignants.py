from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.enseignants import (
    EnseignantCreate, EnseignantUpdate, EnseignantRead,
    EnseignantMatiereCreate, EnseignantMatiereRead,
    EnseignantClasseCreate, EnseignantClasseRead
)
from app.crud import enseignants as crud

router = APIRouter()


@router.get("/", response_model=list[EnseignantRead])
def list_enseignants(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_enseignants(db, skip=skip, limit=limit)


@router.get("/{id_enseignant}", response_model=EnseignantRead)
def get_enseignant(id_enseignant: int, db: Session = Depends(get_db)):
    obj = crud.get_enseignant(db, id_enseignant)
    if not obj:
        raise HTTPException(status_code=404, detail="Enseignant introuvable")
    return obj


@router.post("/", response_model=EnseignantRead, status_code=201)
def create_enseignant(data: EnseignantCreate, db: Session = Depends(get_db)):
    return crud.create_enseignant(db, data)


@router.put("/{id_enseignant}", response_model=EnseignantRead)
def update_enseignant(id_enseignant: int, data: EnseignantUpdate, db: Session = Depends(get_db)):
    obj = crud.update_enseignant(db, id_enseignant, data)
    if not obj:
        raise HTTPException(status_code=404, detail="Enseignant introuvable")
    return obj


@router.delete("/{id_enseignant}", status_code=204)
def delete_enseignant(id_enseignant: int, db: Session = Depends(get_db)):
    obj = crud.delete_enseignant(db, id_enseignant)
    if not obj:
        raise HTTPException(status_code=404, detail="Enseignant introuvable")


@router.post("/matieres", response_model=EnseignantMatiereRead, status_code=201)
def lier_enseignant_matiere(data: EnseignantMatiereCreate, db: Session = Depends(get_db)):
    return crud.link_enseignant_matiere(db, data)


@router.get("/{id_enseignant}/matieres", response_model=list[EnseignantMatiereRead])
def get_matieres_of_enseignant(id_enseignant: int, db: Session = Depends(get_db)):
    return crud.get_matieres_of_enseignant(db, id_enseignant)


@router.post("/classes", response_model=EnseignantClasseRead, status_code=201)
def lier_enseignant_classe(data: EnseignantClasseCreate, db: Session = Depends(get_db)):
    return crud.link_enseignant_classe(db, data)


@router.get("/{id_enseignant}/classes", response_model=list[EnseignantClasseRead])
def get_classes_of_enseignant(id_enseignant: int, id_annee: int = None, db: Session = Depends(get_db)):
    return crud.get_classes_of_enseignant(db, id_enseignant, id_annee=id_annee)