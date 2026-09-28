from sqlalchemy.orm import Session
from app.models.administration import Utilisateur
from app.core.security import verify_password


def authenticate_user(db: Session, id_etablissement: int, login: str, mot_de_passe: str):
    """
    Vérifie les identifiants d'un utilisateur pour un établissement donné.
    Retourne l'utilisateur si les identifiants sont valides, None sinon.
    """
    user = db.query(Utilisateur).filter(
        Utilisateur.id_etablissement == id_etablissement,
        Utilisateur.login == login
    ).first()

    if not user:
        return None
    if not verify_password(mot_de_passe, user.mot_de_passe_hash):
        return None
    if user.statut != "actif":
        return None

    return user