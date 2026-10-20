import re
import unicodedata
from datetime import date, datetime, time, timedelta
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.caisse import Caisse, ClotureCaisse, MouvementCaisse
from app.models.eleves import Eleve, Inscription
from app.models.finance import FraisScolaire, TypeFrais


def normaliser_texte(value: str | None) -> str:
    decomposed = unicodedata.normalize("NFKD", value or "")
    ascii_text = "".join(char for char in decomposed if not unicodedata.combining(char))
    return re.sub(r"[^a-z0-9]+", " ", ascii_text.casefold()).strip()


def mode_especes(mode_paiement: str | None) -> bool:
    normalized = normaliser_texte(mode_paiement)
    return normalized in {"especes", "cash", "liquide", "caisse"}


def verifier_etablissement_utilisateur(user, id_etablissement: int) -> None:
    if user.id_etablissement != id_etablissement:
        raise HTTPException(status_code=403, detail="Accès interdit à cet établissement")


def obtenir_caisse(db: Session, id_etablissement: int, required: bool = True) -> Caisse | None:
    caisse = db.query(Caisse).filter(Caisse.id_etablissement == id_etablissement).first()
    if caisse is None and required:
        raise HTTPException(status_code=409, detail="La caisse de cet établissement n'est pas initialisée")
    return caisse


def solde_a_date(db: Session, caisse: Caisse, jour: date) -> Decimal:
    debut_suivi = caisse.date_debut_suivi
    if jour < debut_suivi:
        return Decimal(caisse.solde_initial)
    limite_exclusive = datetime.combine(jour + timedelta(days=1), time.min)
    entrees = db.query(func.coalesce(func.sum(MouvementCaisse.montant), 0)).filter(
        MouvementCaisse.id_caisse == caisse.id_caisse,
        MouvementCaisse.sens == "entree",
        MouvementCaisse.date_mouvement >= datetime.combine(debut_suivi, time.min),
        MouvementCaisse.date_mouvement < limite_exclusive,
    ).scalar()
    sorties = db.query(func.coalesce(func.sum(MouvementCaisse.montant), 0)).filter(
        MouvementCaisse.id_caisse == caisse.id_caisse,
        MouvementCaisse.sens == "sortie",
        MouvementCaisse.date_mouvement >= datetime.combine(debut_suivi, time.min),
        MouvementCaisse.date_mouvement < limite_exclusive,
    ).scalar()
    return Decimal(caisse.solde_initial) + Decimal(entrees) - Decimal(sorties)


def ajouter_mouvement_especes(
    db: Session,
    *,
    id_etablissement: int,
    date_mouvement: datetime,
    sens: str,
    categorie: str,
    libelle: str,
    montant,
    mode_paiement: str | None,
    source_type: str,
    source_id: int,
    id_utilisateur: int,
    commentaire: str | None = None,
) -> MouvementCaisse | None:
    if not mode_especes(mode_paiement):
        return None
    if Decimal(montant) <= 0:
        raise HTTPException(status_code=400, detail="Le montant du mouvement doit être positif")

    caisse = obtenir_caisse(db, id_etablissement)
    if not caisse.initialisee:
        raise HTTPException(status_code=409, detail="La caisse n'est pas initialisée")
    jour = date_mouvement.date()
    if jour < caisse.date_debut_suivi:
        raise HTTPException(status_code=400, detail="La date du paiement précède le début du suivi de caisse")
    cloture_active = db.query(ClotureCaisse).filter(
        ClotureCaisse.id_caisse == caisse.id_caisse,
        ClotureCaisse.date_cloture == jour,
        ClotureCaisse.statut == "cloturee",
    ).first()
    if cloture_active:
        raise HTTPException(status_code=409, detail="Cette journée est clôturée. Rouvrez la clôture avant d'ajouter une opération rétroactive")
    duplicate = db.query(MouvementCaisse).filter(
        MouvementCaisse.id_caisse == caisse.id_caisse,
        MouvementCaisse.source_type == source_type,
        MouvementCaisse.source_id == source_id,
    ).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="Cette opération source possède déjà un mouvement de caisse")

    mouvement = MouvementCaisse(
        id_caisse=caisse.id_caisse,
        date_mouvement=date_mouvement,
        sens=sens,
        categorie=categorie,
        libelle=libelle,
        montant=Decimal(montant),
        mode_paiement=mode_paiement.strip(),
        source_type=source_type,
        source_id=source_id,
        id_utilisateur=id_utilisateur,
        commentaire=commentaire,
    )
    db.add(mouvement)
    db.flush()
    return mouvement


def paiement_est_frais_inscription(db: Session, id_frais: int | None) -> bool:
    if id_frais is None:
        return False
    frais = db.query(FraisScolaire).filter(FraisScolaire.id_frais == id_frais).first()
    if frais is None:
        raise HTTPException(status_code=404, detail="Frais scolaire introuvable")
    type_frais = db.query(TypeFrais).filter(TypeFrais.id_type_frais == frais.id_type_frais).first()
    if type_frais is None:
        raise HTTPException(status_code=404, detail="Type de frais introuvable")
    code = normaliser_texte(type_frais.code)
    libelle = normaliser_texte(type_frais.libelle)
    return code in {"inscription", "frais inscription", "reinscription"} or any(
        phrase in libelle for phrase in ("frais inscription", "frais de inscription", "reinscription")
    ) or code == "inscription" or libelle == "inscription"


def verifier_inscription_etablissement(db: Session, id_inscription: int, id_etablissement: int) -> Inscription:
    inscription = db.query(Inscription).filter(Inscription.id_inscription == id_inscription).first()
    if inscription is None:
        raise HTTPException(status_code=404, detail="Inscription introuvable")
    eleve = db.query(Eleve).filter(Eleve.id_eleve == inscription.id_eleve).first()
    if eleve is None or eleve.id_etablissement != id_etablissement:
        raise HTTPException(status_code=403, detail="L'inscription n'appartient pas à votre établissement")
    return inscription


def verifier_frais_inscription_coherent(db: Session, id_frais: int, id_inscription: int, id_etablissement: int) -> bool:
    frais = db.query(FraisScolaire).filter(FraisScolaire.id_frais == id_frais).first()
    if frais is None:
        raise HTTPException(status_code=404, detail="Frais scolaire introuvable")
    if frais.id_inscription != id_inscription:
        raise HTTPException(status_code=400, detail="Le frais scolaire ne correspond pas à l'inscription du paiement")
    type_frais = db.query(TypeFrais).filter(TypeFrais.id_type_frais == frais.id_type_frais).first()
    if type_frais is None:
        raise HTTPException(status_code=404, detail="Type de frais introuvable")
    if type_frais.id_etablissement != id_etablissement:
        raise HTTPException(status_code=403, detail="Le frais scolaire n'appartient pas à votre établissement")
    code = normaliser_texte(type_frais.code)
    libelle = normaliser_texte(type_frais.libelle)
    return code in {"inscription", "frais inscription", "reinscription"} or libelle in {
        "inscription", "frais inscription", "frais de inscription", "reinscription"
    }