from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.dependencies import get_db
from app.models.eleves import Eleve, Parent, Inscription
from app.models.enseignants import Enseignant
from app.models.scolarite import Classe
from app.models.pedagogie import PresenceEleve
from app.models.finance import Paiement, Depense
from app.models.administration import JournalActivite

router = APIRouter()


@router.get("/")
def get_dashboard(id_etablissement: int = 2, db: Session = Depends(get_db)):
    nb_eleves = db.query(Eleve).filter(
        Eleve.id_etablissement == id_etablissement, Eleve.actif == True
    ).count()

    nb_enseignants = db.query(Enseignant).filter(
        Enseignant.id_etablissement == id_etablissement, Enseignant.actif == True
    ).count()

    nb_classes = db.query(Classe).filter(
        Classe.id_etablissement == id_etablissement, Classe.actif == True
    ).count()

    nb_parents = db.query(Parent).filter(
        Parent.id_etablissement == id_etablissement
    ).count()

    aujourdhui = date.today()
    presences_jour = (
        db.query(PresenceEleve.statut, func.count(PresenceEleve.id_presence))
        .join(Inscription, PresenceEleve.id_inscription == Inscription.id_inscription)
        .join(Eleve, Inscription.id_eleve == Eleve.id_eleve)
        .filter(
            PresenceEleve.date_presence == aujourdhui,
            Eleve.id_etablissement == id_etablissement
        )
        .group_by(PresenceEleve.statut)
        .all()
    )

    presences = {"PRESENT": 0, "ABSENT": 0, "RETARD": 0, "EXCUSE": 0}
    for statut, count in presences_jour:
        presences[statut] = count

    total_recettes = (
        db.query(func.coalesce(func.sum(Paiement.montant), 0))
        .join(Inscription, Paiement.id_inscription == Inscription.id_inscription)
        .join(Eleve, Inscription.id_eleve == Eleve.id_eleve)
        .filter(
            Paiement.statut == "valide",
            Eleve.id_etablissement == id_etablissement
        )
        .scalar()
    )

    total_depenses = db.query(func.coalesce(func.sum(Depense.montant), 0)).filter(
        Depense.id_etablissement == id_etablissement
    ).scalar()

    activites_recentes = (
        db.query(JournalActivite)
        .filter(JournalActivite.id_etablissement == id_etablissement)
        .order_by(JournalActivite.date_action.desc())
        .limit(10)
        .all()
    )

    return {
        "eleves": nb_eleves,
        "enseignants": nb_enseignants,
        "classes": nb_classes,
        "parents": nb_parents,
        "presences_jour": {
            "presents": presences["PRESENT"],
            "absents": presences["ABSENT"],
            "retards": presences["RETARD"],
            "excuses": presences["EXCUSE"]
        },
        "finances": {
            "recettes": total_recettes,
            "depenses": total_depenses
        },
        "activites_recentes": [
            {
                "id_journal": a.id_journal,
                "action": a.action,
                "module": a.module,
                "date_action": a.date_action
            } for a in activites_recentes
        ]
    }