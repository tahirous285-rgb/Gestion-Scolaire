from datetime import date, datetime, time, timedelta
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.caisse import Caisse, ClotureCaisse, MouvementCaisse
from app.schemas.caisse import CaisseCloturer, CaisseInitialiser, CaisseReouvrir
from app.services.caisse_service import obtenir_caisse, solde_a_date, verifier_etablissement_utilisateur


def initialiser(db: Session, data: CaisseInitialiser, user):
    verifier_etablissement_utilisateur(user, data.id_etablissement)
    if data.date_debut_suivi > date.today():
        raise HTTPException(status_code=400, detail="La date de début du suivi ne peut pas être future")
    if obtenir_caisse(db, data.id_etablissement, required=False):
        raise HTTPException(status_code=409, detail="La caisse est déjà initialisée")
    caisse = Caisse(
        id_etablissement=data.id_etablissement,
        solde_initial=data.solde_initial,
        initialisee=True,
        date_debut_suivi=data.date_debut_suivi,
        id_utilisateur=user.id_utilisateur,
    )
    db.add(caisse)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=409, detail="La caisse est déjà initialisée") from error
    db.refresh(caisse)
    return caisse


def resume(db: Session, id_etablissement: int, user, jour: date | None = None):
    verifier_etablissement_utilisateur(user, id_etablissement)
    caisse = obtenir_caisse(db, id_etablissement, required=False)
    jour = jour or date.today()
    if caisse is None:
        return {
            "id_caisse": None,
            "id_etablissement": id_etablissement,
            "initialisee": False,
            "solde_initial": Decimal("0.00"),
            "date_debut_suivi": None,
            "date_jour": jour,
            "solde_theorique": Decimal("0.00"),
            "total_entrees_jour": Decimal("0.00"),
            "total_sorties_jour": Decimal("0.00"),
        }

    debut = datetime.combine(jour, time.min)
    fin = debut + timedelta(days=1)
    totaux = db.query(
        MouvementCaisse.sens,
        func.coalesce(func.sum(MouvementCaisse.montant), 0),
    ).filter(
        MouvementCaisse.id_caisse == caisse.id_caisse,
        MouvementCaisse.date_mouvement >= datetime.combine(caisse.date_debut_suivi, time.min),
        MouvementCaisse.date_mouvement >= debut,
        MouvementCaisse.date_mouvement < fin,
    ).group_by(MouvementCaisse.sens).all()
    totaux_par_sens = {sens: Decimal(total) for sens, total in totaux}
    return {
        "id_caisse": caisse.id_caisse,
        "id_etablissement": id_etablissement,
        "initialisee": bool(caisse.initialisee),
        "solde_initial": Decimal(caisse.solde_initial),
        "date_debut_suivi": caisse.date_debut_suivi,
        "date_jour": jour,
        "solde_theorique": solde_a_date(db, caisse, jour),
        "total_entrees_jour": totaux_par_sens.get("entree", Decimal("0.00")),
        "total_sorties_jour": totaux_par_sens.get("sortie", Decimal("0.00")),
    }


def mouvements(db: Session, id_etablissement: int, user, date_debut=None, date_fin=None, sens=None):
    verifier_etablissement_utilisateur(user, id_etablissement)
    caisse = obtenir_caisse(db, id_etablissement, required=False)
    if caisse is None:
        return []
    if date_debut and date_fin and date_debut > date_fin:
        raise HTTPException(status_code=400, detail="La date de début doit précéder la date de fin")
    query = db.query(MouvementCaisse).filter(MouvementCaisse.id_caisse == caisse.id_caisse)
    if date_debut:
        query = query.filter(MouvementCaisse.date_mouvement >= datetime.combine(date_debut, time.min))
    if date_fin:
        query = query.filter(MouvementCaisse.date_mouvement < datetime.combine(date_fin + timedelta(days=1), time.min))
    if sens:
        query = query.filter(MouvementCaisse.sens == sens)
    return query.order_by(MouvementCaisse.date_mouvement.desc(), MouvementCaisse.id_mouvement_caisse.desc()).all()


def clotures(db: Session, id_etablissement: int, user):
    verifier_etablissement_utilisateur(user, id_etablissement)
    caisse = obtenir_caisse(db, id_etablissement, required=False)
    if caisse is None:
        return []
    return db.query(ClotureCaisse).filter(
        ClotureCaisse.id_caisse == caisse.id_caisse,
    ).order_by(ClotureCaisse.date_cloture.desc(), ClotureCaisse.id_cloture_caisse.desc()).all()


def creer_cloture(db: Session, data: CaisseCloturer, user):
    verifier_etablissement_utilisateur(user, data.id_etablissement)
    caisse = obtenir_caisse(db, data.id_etablissement)
    if data.date_cloture < caisse.date_debut_suivi:
        raise HTTPException(status_code=400, detail="La clôture précède le début du suivi de caisse")
    if data.date_cloture > date.today():
        raise HTTPException(status_code=400, detail="La date de clôture ne peut pas être future")
    if db.query(ClotureCaisse.id_cloture_caisse).filter(
        ClotureCaisse.id_caisse == caisse.id_caisse,
        ClotureCaisse.date_cloture == data.date_cloture,
        ClotureCaisse.statut == "cloturee",
    ).first():
        raise HTTPException(status_code=409, detail="Cette journée possède déjà une clôture active")

    solde_theorique = solde_a_date(db, caisse, data.date_cloture)
    cloture = ClotureCaisse(
        id_caisse=caisse.id_caisse,
        date_cloture=data.date_cloture,
        solde_theorique=solde_theorique,
        solde_compte=data.solde_compte,
        ecart=Decimal(data.solde_compte) - solde_theorique,
        statut="cloturee",
        commentaire=data.commentaire,
        id_utilisateur=user.id_utilisateur,
    )
    db.add(cloture)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=409, detail="Cette journée possède déjà une clôture active") from error
    db.refresh(cloture)
    return cloture


def reouvrir_cloture(db: Session, id_cloture: int, data: CaisseReouvrir, user):
    cloture = db.query(ClotureCaisse).join(Caisse).filter(
        ClotureCaisse.id_cloture_caisse == id_cloture,
    ).first()
    if cloture is None:
        raise HTTPException(status_code=404, detail="Clôture introuvable")
    verifier_etablissement_utilisateur(user, cloture.caisse.id_etablissement)
    if cloture.statut != "cloturee":
        raise HTTPException(status_code=409, detail="Cette clôture est déjà rouverte")
    motif = data.motif_reouverture.strip()
    if not motif:
        raise HTTPException(status_code=400, detail="Le motif de réouverture est obligatoire")
    cloture.statut = "reouverte"
    cloture.motif_reouverture = motif
    cloture.date_reouverture = datetime.utcnow()
    db.commit()
    db.refresh(cloture)
    return cloture