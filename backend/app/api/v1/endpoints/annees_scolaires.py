from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.scolarite import AnneeScolaireCreate, AnneeScolaireRead
from app.crud import scolarite as crud

router = APIRouter()


@router.get("/", response_model=list[AnneeScolaireRead])
def list_annees(db: Session = Depends(get_db)):
    return crud.get_annees(db)


@router.get("/{id_annee}", response_model=AnneeScolaireRead)
def get_annee(id_annee: int, db: Session = Depends(get_db)):
    obj = crud.get_annee(db, id_annee)
    if not obj:
        raise HTTPException(status_code=404, detail="Année scolaire introuvable")
    return obj


@router.post("/", response_model=AnneeScolaireRead, status_code=201)
def create_annee(data: AnneeScolaireCreate, db: Session = Depends(get_db)):
    return crud.create_annee(db, data)