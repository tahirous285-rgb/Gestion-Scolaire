from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.administration import UtilisateurCreate, UtilisateurUpdate, UtilisateurRead
from app.crud import administration as crud

router = APIRouter()


@router.get("/", response_model=list[UtilisateurRead])
def list_utilisateurs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_utilisateurs(db, skip=skip, limit=limit)


@router.get("/{id_utilisateur}", response_model=UtilisateurRead)
def get_utilisateur(id_utilisateur: int, db: Session = Depends(get_db)):
    obj = crud.get_utilisateur(db, id_utilisateur)
    if not obj:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    return obj


@router.post("/", response_model=UtilisateurRead, status_code=201)
def create_utilisateur(data: UtilisateurCreate, db: Session = Depends(get_db)):
    return crud.create_utilisateur(db, data)


@router.put("/{id_utilisateur}", response_model=UtilisateurRead)
def update_utilisateur(id_utilisateur: int, data: UtilisateurUpdate, db: Session = Depends(get_db)):
    obj = crud.update_utilisateur(db, id_utilisateur, data)
    if not obj:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    return obj


@router.delete("/{id_utilisateur}", status_code=204)
def delete_utilisateur(id_utilisateur: int, db: Session = Depends(get_db)):
    obj = crud.delete_utilisateur(db, id_utilisateur)
    if not obj:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")