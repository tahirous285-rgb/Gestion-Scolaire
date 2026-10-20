from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.crud import caisse as crud
from app.models.administration import Utilisateur
from app.schemas.caisse import (
    CaisseCloturer,
    CaisseInitialiser,
    CaisseResume,
    CaisseReouvrir,
    ClotureCaisseRead,
    MouvementCaisseRead,
)

router = APIRouter()


@router.get("/resume", response_model=CaisseResume)
def get_resume(
    id_etablissement: int = Query(gt=0),
    date_jour: date | None = None,
    db: Session = Depends(get_db),
    user: Utilisateur = Depends(get_current_user),
):
    return crud.resume(db, id_etablissement, user, date_jour)


@router.get("/mouvements", response_model=list[MouvementCaisseRead])
def get_mouvements(
    id_etablissement: int = Query(gt=0),
    date_debut: date | None = None,
    date_fin: date | None = None,
    sens: Literal["entree", "sortie"] | None = None,
    db: Session = Depends(get_db),
    user: Utilisateur = Depends(get_current_user),
):
    return crud.mouvements(db, id_etablissement, user, date_debut, date_fin, sens)


@router.get("/clotures", response_model=list[ClotureCaisseRead])
def get_clotures(
    id_etablissement: int = Query(gt=0),
    db: Session = Depends(get_db),
    user: Utilisateur = Depends(get_current_user),
):
    return crud.clotures(db, id_etablissement, user)


@router.post("/initialiser", response_model=CaisseResume, status_code=201)
def initialiser(
    data: CaisseInitialiser,
    db: Session = Depends(get_db),
    user: Utilisateur = Depends(get_current_user),
):
    crud.initialiser(db, data, user)
    return crud.resume(db, data.id_etablissement, user)


@router.post("/clotures", response_model=ClotureCaisseRead, status_code=201)
def creer_cloture(
    data: CaisseCloturer,
    db: Session = Depends(get_db),
    user: Utilisateur = Depends(get_current_user),
):
    return crud.creer_cloture(db, data, user)


@router.post("/clotures/{id_cloture}/reouvrir", response_model=ClotureCaisseRead)
def reouvrir_cloture(
    id_cloture: int,
    data: CaisseReouvrir,
    db: Session = Depends(get_db),
    user: Utilisateur = Depends(get_current_user),
):
    return crud.reouvrir_cloture(db, id_cloture, data, user)