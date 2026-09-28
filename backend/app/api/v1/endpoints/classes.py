from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.scolarite import ClasseCreate, ClasseUpdate, ClasseRead
from app.crud import scolarite as crud

router = APIRouter()


@router.get("/", response_model=list[ClasseRead])
def list_classes(db: Session = Depends(get_db)):
    return crud.get_classes(db)


@router.get("/{id_classe}", response_model=ClasseRead)
def get_classe(id_classe: int, db: Session = Depends(get_db)):
    obj = crud.get_classe(db, id_classe)
    if not obj:
        raise HTTPException(status_code=404, detail="Classe introuvable")
    return obj


@router.post("/", response_model=ClasseRead, status_code=201)
def create_classe(data: ClasseCreate, db: Session = Depends(get_db)):
    return crud.create_classe(db, data)


@router.put("/{id_classe}", response_model=ClasseRead)
def update_classe(id_classe: int, data: ClasseUpdate, db: Session = Depends(get_db)):
    obj = crud.update_classe(db, id_classe, data)
    if not obj:
        raise HTTPException(status_code=404, detail="Classe introuvable")
    return obj


@router.delete("/{id_classe}", status_code=204)
def delete_classe(id_classe: int, db: Session = Depends(get_db)):
    obj = crud.delete_classe(db, id_classe)
    if not obj:
        raise HTTPException(status_code=404, detail="Classe introuvable")