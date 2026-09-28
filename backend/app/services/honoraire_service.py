from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.honoraires import Honoraire, PaiementHonoraire


def calculer_montants(honoraire: Honoraire):
    """
    Applique les règles de calcul des honoraires :
    R8 : montant_brut = heures_effectuees * taux_horaire
    R9 : solde = montant_net - montant_paye (jamais négatif)
    """
    heures = honoraire.heures_effectuees or 0
    honoraire.montant_brut = heures * honoraire.taux_horaire
    honoraire.montant_net = honoraire.montant_brut - (honoraire.retenues or 0)
    solde = honoraire.montant_net - (honoraire.montant_paye or 0)
    honoraire.solde = max(solde, 0)
    return honoraire


def enregistrer_paiement_honoraire(db: Session, id_honoraire: int, montant: float, **kwargs):
    """
    Enregistre un paiement d'honoraire et met à jour le solde (R9).
    Règle R11 : montant strictement positif. Refuse un paiement
    supérieur au solde restant.
    """
    if montant <= 0:
        raise HTTPException(status_code=400, detail="Le montant du paiement doit être supérieur à zéro")

    honoraire = db.query(Honoraire).filter(Honoraire.id_honoraire == id_honoraire).first()
    if not honoraire:
        raise HTTPException(status_code=404, detail="Honoraire introuvable")

    if montant > honoraire.solde:
        raise HTTPException(status_code=400, detail="Le montant dépasse le solde restant dû")

    paiement = PaiementHonoraire(id_honoraire=id_honoraire, montant=montant, **kwargs)
    db.add(paiement)

    honoraire.montant_paye = (honoraire.montant_paye or 0) + montant
    calculer_montants(honoraire)

    db.commit()
    db.refresh(paiement)
    return paiement