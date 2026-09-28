from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.finance import (
    TypeFraisCreate, TypeFraisRead,
    FraisScolaireCreate, FraisScolaireRead
)
from app.crud import finance as crud

router = APIRouter()


@router.get("/types", response_model=list[TypeFraisRead])
def list_types_frais(id_etablissement: int = None, db: Session = Depends(get_db)):
    return crud.get_types_frais(db, id_etablissement=id_etablissement)


@router.post("/types", response_model=TypeFraisRead, status_code=201)
def create_type_frais(data: TypeFraisCreate, db: Session = Depends(get_db)):
    return crud.create_type_frais(db, data)


@router.get("/", response_model=list[FraisScolaireRead])
def list_frais(id_inscription: int = None, id_annee: int = None, db: Session = Depends(get_db)):
    return crud.get_frais_scolaires(db, id_inscription=id_inscription, id_annee=id_annee)


@router.post("/", response_model=FraisScolaireRead, status_code=201)
def create_frais(data: FraisScolaireCreate, db: Session = Depends(get_db)):
    return crud.create_frais_scolaire(db, data)