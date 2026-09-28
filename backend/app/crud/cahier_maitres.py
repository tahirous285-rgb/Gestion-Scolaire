from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.cahier_maitres import PresenceEnseignant, CoursEffectue, ObservationEnseignant
from app.schemas.cahier_maitres import (
    PresenceEnseignantCreate, PresenceEnseignantUpdate,
    CoursEffectueCreate,
    ObservationEnseignantCreate
)


# ---------- PRESENCE_ENSEIGNANT ----------
def get_presences_enseignant(db: Session, id_enseignant: int = None, skip: int = 0, limit: int = 100):
    query = db.query(PresenceEnseignant)
    if id_enseignant:
        query = query.filter(PresenceEnseignant.id_enseignant == id_enseignant)
    return query.offset(skip).limit(limit).all()


def get_presence_enseignant(db: Session, id_presence: int):
    return db.query(PresenceEnseignant).filter(PresenceEnseignant.id_presence == id_presence).first()


def create_presence_enseignant(db: Session, data: PresenceEnseignantCreate):
    existing = db.query(PresenceEnseignant).filter(
        PresenceEnseignant.id_enseignant == data.id_enseignant,
        PresenceEnseignant.date_presence == data.date_presence
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Une présence existe déjà pour cet enseignant à cette date")

    db_obj = PresenceEnseignant(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_presence_enseignant(db: Session, id_presence: int, data: PresenceEnseignantUpdate):
    db_obj = get_presence_enseignant(db, id_presence)
    if not db_obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


# ---------- COURS_EFFECTUE ----------
def get_cours_effectues(db: Session, id_enseignant: int = None, id_classe: int = None, skip: int = 0, limit: int = 100):
    query = db.query(CoursEffectue)
    if id_enseignant:
        query = query.filter(CoursEffectue.id_enseignant == id_enseignant)
    if id_classe:
        query = query.filter(CoursEffectue.id_classe == id_classe)
    return query.offset(skip).limit(limit).all()


def create_cours_effectue(db: Session, data: CoursEffectueCreate):
    db_obj = CoursEffectue(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


# ---------- OBSERVATION_ENSEIGNANT ----------
def get_observations(db: Session, id_enseignant: int = None):
    query = db.query(ObservationEnseignant)
    if id_enseignant:
        query = query.filter(ObservationEnseignant.id_enseignant == id_enseignant)
    return query.all()


def create_observation(db: Session, data: ObservationEnseignantCreate):
    db_obj = ObservationEnseignant(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj