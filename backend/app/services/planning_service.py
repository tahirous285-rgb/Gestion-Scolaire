from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.emploi_temps import EmploiTemps


def verifier_chevauchement(db: Session, id_annee: int, id_classe: int, id_enseignant: int,
                            jour_semaine: str, heure_debut: str, heure_fin: str,
                            exclude_id: int = None):
    """
    Règle R13 : un enseignant ne doit pas avoir deux cours simultanés,
    et une classe ne doit pas avoir deux cours simultanés.
    """
    query = db.query(EmploiTemps).filter(
        EmploiTemps.jour_semaine == jour_semaine,
        EmploiTemps.id_annee == id_annee,
        (EmploiTemps.id_enseignant == id_enseignant) | (EmploiTemps.id_classe == id_classe)
    )
    if exclude_id:
        query = query.filter(EmploiTemps.id_emploi != exclude_id)

    for cours in query.all():
        chevauche = heure_debut < cours.heure_fin and heure_fin > cours.heure_debut
        if chevauche:
            if cours.id_enseignant == id_enseignant:
                raise HTTPException(status_code=400, detail="Cet enseignant a déjà un cours sur ce créneau")
            if cours.id_classe == id_classe:
                raise HTTPException(status_code=400, detail="Cette classe a déjà un cours sur ce créneau")


def creer_creneau(db: Session, **kwargs):
    """
    Crée un créneau d'emploi du temps après vérification du non-chevauchement.
    """
    verifier_chevauchement(
        db,
        id_annee=kwargs["id_annee"],
        id_classe=kwargs["id_classe"],
        id_enseignant=kwargs["id_enseignant"],
        jour_semaine=kwargs["jour_semaine"],
        heure_debut=kwargs["heure_debut"],
        heure_fin=kwargs["heure_fin"],
    )
    creneau = EmploiTemps(**kwargs)
    db.add(creneau)
    db.commit()
    db.refresh(creneau)
    return creneau