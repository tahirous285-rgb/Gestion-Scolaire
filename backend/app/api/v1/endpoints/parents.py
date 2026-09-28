from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.eleves import (
    ParentCreate, ParentUpdate, ParentRead,
    EleveParentCreate, EleveParentRead
)
from app.crud import eleves as crud

router = APIRouter()


@router.get("/", response_model=list[ParentRead])
def list_parents(db: Session = Depends(get_db)):
    return crud.get_parents(db)


@router.get("/{id_parent}", response_model=ParentRead)
def get_parent(id_parent: int, db: Session = Depends(get_db)):
    obj = crud.get_parent(db, id_parent)
    if not obj:
        raise HTTPException(status_code=404, detail="Parent introuvable")
    return obj


@router.post("/", response_model=ParentRead, status_code=201)
def create_parent(data: ParentCreate, db: Session = Depends(get_db)):
    return crud.create_parent(db, data)


@router.put("/{id_parent}", response_model=ParentRead)
def update_parent(id_parent: int, data: ParentUpdate, db: Session = Depends(get_db)):
    obj = crud.update_parent(db, id_parent, data)
    if not obj:
        raise HTTPException(status_code=404, detail="Parent introuvable")
    return obj


@router.delete("/{id_parent}", status_code=204)
def delete_parent(id_parent: int, db: Session = Depends(get_db)):
    obj = crud.delete_parent(db, id_parent)
    if not obj:
        raise HTTPException(status_code=404, detail="Parent introuvable")


@router.post("/lier", response_model=EleveParentRead, status_code=201)
def lier_eleve_parent(data: EleveParentCreate, db: Session = Depends(get_db)):
    return crud.link_eleve_parent(db, data)


@router.get("/eleve/{id_eleve}/parents", response_model=list[EleveParentRead])
def get_parents_of_eleve(id_eleve: int, db: Session = Depends(get_db)):
    return crud.get_parents_of_eleve(db, id_eleve)