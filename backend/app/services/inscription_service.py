from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.eleves import Inscription


def inscrire_eleve(db: Session, id_eleve: int, id_annee: int, id_classe: int, **kwargs):
    """
    Inscrit un élève dans une classe pour une année scolaire donnée.
    Règle R2 : un élève ne peut avoir qu'une inscription par année scolaire.
    """
    existing = db.query(Inscription).filter(
        Inscription.id_eleve == id_eleve,
        Inscription.id_annee == id_annee
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Cet élève est déjà inscrit pour cette année scolaire"
        )

    inscription = Inscription(
        id_eleve=id_eleve,
        id_annee=id_annee,
        id_classe=id_classe,
        **kwargs
    )
    db.add(inscription)
    db.commit()
    db.refresh(inscription)
    return inscription


def changer_classe(db: Session, id_inscription: int, nouvelle_id_classe: int):
    """
    Change la classe d'un élève déjà inscrit (réorientation en cours d'année).
    """
    inscription = db.query(Inscription).filter(
        Inscription.id_inscription == id_inscription
    ).first()
    if not inscription:
        return None
    inscription.id_classe = nouvelle_id_classe
    db.commit()
    db.refresh(inscription)
    return inscription