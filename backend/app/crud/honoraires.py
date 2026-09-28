from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.honoraires import Mois, Honoraire, PaiementHonoraire
from app.schemas.honoraires import MoisCreate, HonoraireCreate, HonoraireUpdate, PaiementHonoraireCreate


# ---------- MOIS ----------
def get_mois_list(db: Session):
    return db.query(Mois).all()


def create_mois(db: Session, data: MoisCreate):
    db_obj = Mois(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


# ---------- HONORAIRE ----------
def _recalculer_honoraire(db_obj: Honoraire):
    # Règle R8 : brut = heures_effectuees * taux_horaire
    heures = db_obj.heures_effectuees or 0
    db_obj.montant_brut = heures * db_obj.taux_horaire
    # Règle : net = brut - retenues
    db_obj.montant_net = db_obj.montant_brut - (db_obj.retenues or 0)
    # Règle R9 : solde = net - total_paiements (jamais négatif)
    solde = db_obj.montant_net - (db_obj.montant_paye or 0)
    db_obj.solde = max(solde, 0)


def get_honoraires(db: Session, id_enseignant: int = None, id_annee: int = None, skip: int = 0, limit: int = 100):
    query = db.query(Honoraire)
    if id_enseignant:
        query = query.filter(Honoraire.id_enseignant == id_enseignant)
    if id_annee:
        query = query.filter(Honoraire.id_annee == id_annee)
    return query.offset(skip).limit(limit).all()


def get_honoraire(db: Session, id_honoraire: int):
    return db.query(Honoraire).filter(Honoraire.id_honoraire == id_honoraire).first()


def create_honoraire(db: Session, data: HonoraireCreate):
    # Règle R7 : unicité enseignant + année + mois
    existing = db.query(Honoraire).filter(
        Honoraire.id_enseignant == data.id_enseignant,
        Honoraire.id_annee == data.id_annee,
        Honoraire.id_mois == data.id_mois
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Un honoraire existe déjà pour cet enseignant ce mois-ci")

    db_obj = Honoraire(**data.model_dump())
    _recalculer_honoraire(db_obj)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_honoraire(db: Session, id_honoraire: int, data: HonoraireUpdate):
    db_obj = get_honoraire(db, id_honoraire)
    if not db_obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(db_obj, key, value)
    _recalculer_honoraire(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


# ---------- PAIEMENT_HONORAIRE ----------
def get_paiements_honoraire(db: Session, id_honoraire: int = None):
    query = db.query(PaiementHonoraire)
    if id_honoraire:
        query = query.filter(PaiementHonoraire.id_honoraire == id_honoraire)
    return query.all()


def create_paiement_honoraire(db: Session, data: PaiementHonoraireCreate):
    # Règle R11 : le montant doit être strictement positif
    if data.montant <= 0:
        raise HTTPException(status_code=400, detail="Le montant du paiement doit être supérieur à zéro")

    honoraire = db.query(Honoraire).filter(Honoraire.id_honoraire == data.id_honoraire).first()
    if not honoraire:
        raise HTTPException(status_code=404, detail="Honoraire introuvable")

    # On empêche de payer plus que le solde restant
    if data.montant > honoraire.solde:
        raise HTTPException(status_code=400, detail="Le montant dépasse le solde restant dû")

    db_obj = PaiementHonoraire(**data.model_dump())
    db.add(db_obj)

    # Mise à jour du montant payé et recalcul du solde (R9)
    honoraire.montant_paye = (honoraire.montant_paye or 0) + data.montant
    _recalculer_honoraire(honoraire)

    db.commit()
    db.refresh(db_obj)
    return db_obj