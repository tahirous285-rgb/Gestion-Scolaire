from sqlalchemy.orm import Session
from app.models.eleves import Eleve, Parent, EleveParent, Inscription
from app.schemas.eleves import (
    EleveCreate, EleveUpdate,
    ParentCreate, ParentUpdate,
    EleveParentCreate,
    InscriptionCreate, InscriptionUpdate
)


# ---------- ELEVE ----------
def get_eleves(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Eleve).offset(skip).limit(limit).all()


def get_eleve(db: Session, id_eleve: int):
    return db.query(Eleve).filter(Eleve.id_eleve == id_eleve).first()


def create_eleve(db: Session, data: EleveCreate):
    db_obj = Eleve(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_eleve(db: Session, id_eleve: int, data: EleveUpdate):
    db_obj = get_eleve(db, id_eleve)
    if not db_obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_eleve(db: Session, id_eleve: int):
    db_obj = get_eleve(db, id_eleve)
    if not db_obj:
        return None
    db.delete(db_obj)
    db.commit()
    return db_obj


# ---------- PARENT ----------
def get_parents(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Parent).offset(skip).limit(limit).all()


def get_parent(db: Session, id_parent: int):
    return db.query(Parent).filter(Parent.id_parent == id_parent).first()


def create_parent(db: Session, data: ParentCreate):
    db_obj = Parent(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_parent(db: Session, id_parent: int, data: ParentUpdate):
    db_obj = get_parent(db, id_parent)
    if not db_obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_parent(db: Session, id_parent: int):
    db_obj = get_parent(db, id_parent)
    if not db_obj:
        return None
    db.delete(db_obj)
    db.commit()
    return db_obj


# ---------- ELEVE_PARENT ----------
def get_parents_of_eleve(db: Session, id_eleve: int):
    return db.query(EleveParent).filter(EleveParent.id_eleve == id_eleve).all()


def link_eleve_parent(db: Session, data: EleveParentCreate):
    db_obj = EleveParent(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


# ---------- INSCRIPTION ----------
def get_inscriptions(db: Session, id_eleve: int = None, id_annee: int = None, skip: int = 0, limit: int = 100):
    query = db.query(Inscription)
    if id_eleve:
        query = query.filter(Inscription.id_eleve == id_eleve)
    if id_annee:
        query = query.filter(Inscription.id_annee == id_annee)
    return query.offset(skip).limit(limit).all()


def get_inscription(db: Session, id_inscription: int):
    return db.query(Inscription).filter(Inscription.id_inscription == id_inscription).first()


def create_inscription(db: Session, data: InscriptionCreate):
    db_obj = Inscription(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_inscription(db: Session, id_inscription: int, data: InscriptionUpdate):
    db_obj = get_inscription(db, id_inscription)
    if not db_obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_inscription(db: Session, id_inscription: int):
    db_obj = get_inscription(db, id_inscription)
    if not db_obj:
        return None
    db.delete(db_obj)
    db.commit()
    return db_obj