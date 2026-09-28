from datetime import datetime
from sqlalchemy.orm import Session
from app.models.documents import CarteScolaire
from app.utils.qr_generator import generer_token


def generer_numero_carte() -> str:
    import uuid
    return f"CARTE-{uuid.uuid4().hex[:8].upper()}"


def generer_carte(db: Session, id_inscription: int, date_expiration=None, id_generateur: int = None):
    """
    Crée une nouvelle carte scolaire pour une inscription, avec un numéro
    et un token QR uniques générés automatiquement.
    """
    carte = CarteScolaire(
        id_inscription=id_inscription,
        numero_carte=generer_numero_carte(),
        qr_token=generer_token(),
        date_expiration=date_expiration,
        id_generateur=id_generateur,
        statut="active",
        nombre_reeditions=0
    )
    db.add(carte)
    db.commit()
    db.refresh(carte)
    return carte


def reimprimer_carte(db: Session, id_carte: int):
    """
    Incrémente le compteur de réimpressions et met à jour la date
    de dernière impression d'une carte existante.
    """
    carte = db.query(CarteScolaire).filter(CarteScolaire.id_carte == id_carte).first()
    if not carte:
        return None
    carte.nombre_reeditions = (carte.nombre_reeditions or 0) + 1
    carte.derniere_impression = datetime.utcnow()
    db.commit()
    db.refresh(carte)
    return carte


def verifier_qr_token(db: Session, qr_token: str):
    """
    Vérifie l'authenticité d'une carte à partir de son token QR
    (ex: contrôle à l'entrée de l'école).
    """
    carte = db.query(CarteScolaire).filter(CarteScolaire.qr_token == qr_token).first()
    if not carte or carte.statut != "active":
        return None
    return carte