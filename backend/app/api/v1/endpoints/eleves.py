from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.eleves import EleveCreate, EleveUpdate, EleveRead
from app.crud import eleves as crud

router = APIRouter()


@router.get("/", response_model=list[EleveRead])
def list_eleves(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_eleves(db, skip=skip, limit=limit)


@router.get("/{id_eleve}", response_model=EleveRead)
def get_eleve(id_eleve: int, db: Session = Depends(get_db)):
    obj = crud.get_eleve(db, id_eleve)
    if not obj:
        raise HTTPException(status_code=404, detail="Élève introuvable")
    return obj


@router.post("/", response_model=EleveRead, status_code=201)
def create_eleve(data: EleveCreate, db: Session = Depends(get_db)):
    return crud.create_eleve(db, data)


@router.put("/{id_eleve}", response_model=EleveRead)
def update_eleve(id_eleve: int, data: EleveUpdate, db: Session = Depends(get_db)):
    obj = crud.update_eleve(db, id_eleve, data)
    if not obj:
        raise HTTPException(status_code=404, detail="Élève introuvable")
    return obj


@router.delete("/{id_eleve}", status_code=204)
def delete_eleve(id_eleve: int, db: Session = Depends(get_db)):
    obj = crud.delete_eleve(db, id_eleve)
    if not obj:
        raise HTTPException(status_code=404, detail="Élève introuvable")