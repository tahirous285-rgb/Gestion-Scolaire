from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.finance import RecuRead
from app.crud import finance as crud

router = APIRouter()


@router.get("/paiement/{id_paiement}", response_model=RecuRead)
def get_recu_by_paiement(id_paiement: int, db: Session = Depends(get_db)):
    obj = crud.get_recu_by_paiement(db, id_paiement)
    if not obj:
        raise HTTPException(status_code=404, detail="Reçu introuvable")
    return obj


@router.put("/{id_recu}/imprimer", response_model=RecuRead)
def marquer_imprime(id_recu: int, id_imprimeur: int, db: Session = Depends(get_db)):
    obj = crud.marquer_recu_imprime(db, id_recu, id_imprimeur)
    if not obj:
        raise HTTPException(status_code=404, detail="Reçu introuvable")
    return obj


@router.put("/{id_recu}/generer-pdf", response_model=RecuRead)
def generer_pdf(id_recu: int, db: Session = Depends(get_db)):
    obj = crud.generer_pdf_recu(db, id_recu)
    if not obj:
        raise HTTPException(status_code=404, detail="Reçu introuvable")
    return obj