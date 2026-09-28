from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.honoraires import (
    MoisCreate, MoisRead,
    HonoraireCreate, HonoraireUpdate, HonoraireRead,
    PaiementHonoraireCreate, PaiementHonoraireRead
)
from app.crud import honoraires as crud

router = APIRouter()


@router.get("/mois", response_model=list[MoisRead])
def list_mois(db: Session = Depends(get_db)):
    return crud.get_mois_list(db)


@router.post("/mois", response_model=MoisRead, status_code=201)
def create_mois(data: MoisCreate, db: Session = Depends(get_db)):
    return crud.create_mois(db, data)


@router.get("/", response_model=list[HonoraireRead])
def list_honoraires(id_enseignant: int = None, id_annee: int = None, db: Session = Depends(get_db)):
    return crud.get_honoraires(db, id_enseignant=id_enseignant, id_annee=id_annee)


@router.get("/{id_honoraire}", response_model=HonoraireRead)
def get_honoraire(id_honoraire: int, db: Session = Depends(get_db)):
    obj = crud.get_honoraire(db, id_honoraire)
    if not obj:
        raise HTTPException(status_code=404, detail="Honoraire introuvable")
    return obj


@router.post("/", response_model=HonoraireRead, status_code=201)
def create_honoraire(data: HonoraireCreate, db: Session = Depends(get_db)):
    return crud.create_honoraire(db, data)


@router.put("/{id_honoraire}", response_model=HonoraireRead)
def update_honoraire(id_honoraire: int, data: HonoraireUpdate, db: Session = Depends(get_db)):
    obj = crud.update_honoraire(db, id_honoraire, data)
    if not obj:
        raise HTTPException(status_code=404, detail="Honoraire introuvable")
    return obj


@router.post("/paiements", response_model=PaiementHonoraireRead, status_code=201)
def create_paiement(data: PaiementHonoraireCreate, db: Session = Depends(get_db)):
    return crud.create_paiement_honoraire(db, data)


@router.get("/{id_honoraire}/paiements", response_model=list[PaiementHonoraireRead])
def get_paiements(id_honoraire: int, db: Session = Depends(get_db)):
    return crud.get_paiements_honoraire(db, id_honoraire)