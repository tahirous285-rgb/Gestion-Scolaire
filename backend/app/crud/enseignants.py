from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.enseignants import Enseignant, EnseignantMatiere, EnseignantClasse
from app.schemas.enseignants import (
    EnseignantCreate, EnseignantUpdate,
    EnseignantMatiereCreate,
    EnseignantClasseCreate
)


# ---------- ENSEIGNANT ----------
def get_enseignants(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Enseignant).offset(skip).limit(limit).all()


def get_enseignant(db: Session, id_enseignant: int):
    return db.query(Enseignant).filter(Enseignant.id_enseignant == id_enseignant).first()


def create_enseignant(db: Session, data: EnseignantCreate):
    db_obj = Enseignant(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_enseignant(db: Session, id_enseignant: int, data: EnseignantUpdate):
    db_obj = get_enseignant(db, id_enseignant)
    if not db_obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_enseignant(db: Session, id_enseignant: int):
    db_obj = get_enseignant(db, id_enseignant)
    if not db_obj:
        return None
    db.delete(db_obj)
    db.commit()
    return db_obj


# ---------- ENSEIGNANT_MATIERE ----------
def get_matieres_of_enseignant(db: Session, id_enseignant: int):
    return db.query(EnseignantMatiere).filter(EnseignantMatiere.id_enseignant == id_enseignant).all()


def link_enseignant_matiere(db: Session, data: EnseignantMatiereCreate):
    existing = db.query(EnseignantMatiere).filter(
        EnseignantMatiere.id_enseignant == data.id_enseignant,
        EnseignantMatiere.id_matiere == data.id_matiere
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Cet enseignant est déjà associé à cette matière"
        )

    db_obj = EnseignantMatiere(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


# ---------- ENSEIGNANT_CLASSE ----------
def get_classes_of_enseignant(db: Session, id_enseignant: int, id_annee: int = None):
    query = db.query(EnseignantClasse).filter(EnseignantClasse.id_enseignant == id_enseignant)
    if id_annee:
        query = query.filter(EnseignantClasse.id_annee == id_annee)
    return query.all()


def link_enseignant_classe(db: Session, data: EnseignantClasseCreate):
    existing = db.query(EnseignantClasse).filter(
        EnseignantClasse.id_enseignant == data.id_enseignant,
        EnseignantClasse.id_classe == data.id_classe,
        EnseignantClasse.id_annee == data.id_annee
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Cet enseignant est déjà associé à cette classe pour cette année"
        )

    db_obj = EnseignantClasse(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj