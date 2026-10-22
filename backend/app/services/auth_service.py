from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.administration import Utilisateur
from app.core.security import verify_password


def authenticate_user(db: Session, email: str, mot_de_passe: str):
    """
    Vérifie l'adresse e-mail et le mot de passe.
    Retourne l'utilisateur uniquement si l'adresse correspond à un seul compte actif.
    """
    users = db.query(Utilisateur).filter(
        func.lower(Utilisateur.email) == email.strip().lower()
    ).limit(2).all()

    if len(users) != 1:
        return None
    user = users[0]
    if not verify_password(mot_de_passe, user.mot_de_passe_hash):
        return None
    if user.statut != "actif":
        return None

    return user