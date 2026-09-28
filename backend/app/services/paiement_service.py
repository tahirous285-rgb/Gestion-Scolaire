from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.finance import Paiement, Recu


def enregistrer_paiement(db: Session, id_inscription: int, montant: float, reference: str, **kwargs):
    """
    Enregistre un paiement scolaire (règle R11 : montant strictement positif)
    et génère automatiquement le reçu associé (relation 1,1 PAIEMENT-RECU).
    """
    if montant <= 0:
        raise HTTPException(status_code=400, detail="Le montant du paiement doit être supérieur à zéro")

    paiement = Paiement(
        id_inscription=id_inscription,
        montant=montant,
        reference=reference,
        **kwargs
    )
    db.add(paiement)
    db.commit()
    db.refresh(paiement)

    recu = Recu(
        id_paiement=paiement.id_paiement,
        numero_recu=f"RECU-{paiement.id_paiement:06d}",
        date_emission=datetime.utcnow(),
        montant=paiement.montant,
        imprime=False
    )
    db.add(recu)
    db.commit()

    return paiement


def marquer_recu_imprime(db: Session, id_recu: int, id_imprimeur: int):
    """
    Marque un reçu comme imprimé, avec horodatage.
    """
    recu = db.query(Recu).filter(Recu.id_recu == id_recu).first()
    if not recu:
        return None
    recu.imprime = True
    recu.date_impression = datetime.utcnow()
    recu.id_imprimeur = id_imprimeur
    db.commit()
    db.refresh(recu)
    return recu