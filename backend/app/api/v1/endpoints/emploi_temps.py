from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.emploi_temps import EmploiTempsCreate, EmploiTempsUpdate, EmploiTempsRead
from app.crud import emploi_temps as crud

router = APIRouter()


@router.get("/", response_model=list[EmploiTempsRead])
def list_emplois(id_classe: int = None, id_enseignant: int = None, id_annee: int = None, db: Session = Depends(get_db)):
    return crud.get_emplois(db, id_classe=id_classe, id_enseignant=id_enseignant, id_annee=id_annee)


@router.get("/{id_emploi}", response_model=EmploiTempsRead)
def get_emploi(id_emploi: int, db: Session = Depends(get_db)):
    obj = crud.get_emploi(db, id_emploi)
    if not obj:
        raise HTTPException(status_code=404, detail="Créneau introuvable")
    return obj


@router.post("/", response_model=EmploiTempsRead, status_code=201)
def create_emploi(data: EmploiTempsCreate, db: Session = Depends(get_db)):
    return crud.create_emploi(db, data)


@router.put("/{id_emploi}", response_model=EmploiTempsRead)
def update_emploi(id_emploi: int, data: EmploiTempsUpdate, db: Session = Depends(get_db)):
    obj = crud.update_emploi(db, id_emploi, data)
    if not obj:
        raise HTTPException(status_code=404, detail="Créneau introuvable")
    return obj


@router.delete("/{id_emploi}", status_code=204)
def delete_emploi(id_emploi: int, db: Session = Depends(get_db)):
    obj = crud.delete_emploi(db, id_emploi)
    if not obj:
        raise HTTPException(status_code=404, detail="Créneau introuvable")