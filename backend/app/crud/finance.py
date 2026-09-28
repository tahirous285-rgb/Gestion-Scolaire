from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
from app.models.finance import TypeFrais, FraisScolaire, Paiement, Recu, Depense
from app.schemas.finance import (
    TypeFraisCreate,
    FraisScolaireCreate,
    PaiementCreate,
    DepenseCreate
)


# ---------- TYPE_FRAIS ----------
def get_types_frais(db: Session, id_etablissement: int = None):
    query = db.query(TypeFrais)
    if id_etablissement:
        query = query.filter(TypeFrais.id_etablissement == id_etablissement)
    return query.all()


def create_type_frais(db: Session, data: TypeFraisCreate):
    db_obj = TypeFrais(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


# ---------- FRAIS_SCOLAIRE ----------
def get_frais_scolaires(db: Session, id_inscription: int = None, id_annee: int = None):
    query = db.query(FraisScolaire)
    if id_inscription:
        query = query.filter(FraisScolaire.id_inscription == id_inscription)
    if id_annee:
        query = query.filter(FraisScolaire.id_annee == id_annee)
    return query.all()


def create_frais_scolaire(db: Session, data: FraisScolaireCreate):
    db_obj = FraisScolaire(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


# ---------- PAIEMENT ----------
def get_paiements(db: Session, id_inscription: int = None, skip: int = 0, limit: int = 100):
    query = db.query(Paiement)
    if id_inscription:
        query = query.filter(Paiement.id_inscription == id_inscription)
    return query.offset(skip).limit(limit).all()


def get_paiement(db: Session, id_paiement: int):
    return db.query(Paiement).filter(Paiement.id_paiement == id_paiement).first()


def create_paiement(db: Session, data: PaiementCreate):
    # Règle R11 : montant strictement positif
    if data.montant <= 0:
        raise HTTPException(status_code=400, detail="Le montant du paiement doit être supérieur à zéro")

    db_obj = Paiement(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)

    # Génération automatique du reçu (relation 1,1)
    numero_recu = f"RECU-{db_obj.id_paiement:06d}"
    recu = Recu(
        id_paiement=db_obj.id_paiement,
        numero_recu=numero_recu,
        date_emission=datetime.utcnow(),
        montant=db_obj.montant,
        imprime=False
    )
    db.add(recu)
    db.commit()

    return db_obj


# ---------- RECU ----------
def get_recu_by_paiement(db: Session, id_paiement: int):
    return db.query(Recu).filter(Recu.id_paiement == id_paiement).first()


def get_recu(db: Session, id_recu: int):
    return db.query(Recu).filter(Recu.id_recu == id_recu).first()


def marquer_recu_imprime(db: Session, id_recu: int, id_imprimeur: int):
    recu = get_recu(db, id_recu)
    if not recu:
        return None
    recu.imprime = True
    recu.date_impression = datetime.utcnow()
    recu.id_imprimeur = id_imprimeur
    db.commit()
    db.refresh(recu)
    return recu


def generer_pdf_recu(db: Session, id_recu: int):
    from app.services.pdf_service import generer_pdf_recu as creer_pdf

    recu = get_recu(db, id_recu)
    if not recu:
        return None

    chemin = creer_pdf(
        numero_recu=recu.numero_recu,
        montant=recu.montant,
        date_emission=recu.date_emission
    )
    recu.pdf = chemin
    db.commit()
    db.refresh(recu)
    return recu


# ---------- DEPENSE ----------
def get_depenses(db: Session, id_etablissement: int = None, skip: int = 0, limit: int = 100):
    query = db.query(Depense)
    if id_etablissement:
        query = query.filter(Depense.id_etablissement == id_etablissement)
    return query.offset(skip).limit(limit).all()


def create_depense(db: Session, data: DepenseCreate):
    db_obj = Depense(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj