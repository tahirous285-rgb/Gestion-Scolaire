from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.administration import EtablissementCreate, EtablissementUpdate, EtablissementRead
from app.crud import administration as crud

router = APIRouter()


@router.get("/", response_model=list[EtablissementRead])
def list_etablissements(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_etablissements(db, skip=skip, limit=limit)


@router.get("/{id_etablissement}", response_model=EtablissementRead)
def get_etablissement(id_etablissement: int, db: Session = Depends(get_db)):
    obj = crud.get_etablissement(db, id_etablissement)
    if not obj:
        raise HTTPException(status_code=404, detail="Établissement introuvable")
    return obj


@router.post("/", response_model=EtablissementRead, status_code=201)
def create_etablissement(data: EtablissementCreate, db: Session = Depends(get_db)):
    return crud.create_etablissement(db, data)


@router.put("/{id_etablissement}", response_model=EtablissementRead)
def update_etablissement(id_etablissement: int, data: EtablissementUpdate, db: Session = Depends(get_db)):
    obj = crud.update_etablissement(db, id_etablissement, data)
    if not obj:
        raise HTTPException(status_code=404, detail="Établissement introuvable")
    return obj


@router.delete("/{id_etablissement}", status_code=204)
def delete_etablissement(id_etablissement: int, db: Session = Depends(get_db)):
    obj = crud.delete_etablissement(db, id_etablissement)
    if not obj:
        raise HTTPException(status_code=404, detail="Établissement introuvable")