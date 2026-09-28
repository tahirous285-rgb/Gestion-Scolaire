from sqlalchemy.orm import Session
from app.models.scolarite import AnneeScolaire, Periode, Classe, Matiere, ClasseMatiere
from app.schemas.scolarite import (
    AnneeScolaireCreate,
    PeriodeCreate,
    ClasseCreate, ClasseUpdate,
    MatiereCreate, MatiereUpdate,
    ClasseMatiereCreate
)


# ---------- ANNEE SCOLAIRE ----------
def get_annees(db: Session, skip: int = 0, limit: int = 100):
    return db.query(AnneeScolaire).offset(skip).limit(limit).all()


def get_annee(db: Session, id_annee: int):
    return db.query(AnneeScolaire).filter(AnneeScolaire.id_annee == id_annee).first()


def create_annee(db: Session, data: AnneeScolaireCreate):
    db_obj = AnneeScolaire(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


# ---------- PERIODE ----------
def get_periodes(db: Session, id_annee: int = None, skip: int = 0, limit: int = 100):
    query = db.query(Periode)
    if id_annee:
        query = query.filter(Periode.id_annee == id_annee)
    return query.offset(skip).limit(limit).all()


def create_periode(db: Session, data: PeriodeCreate):
    db_obj = Periode(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


# ---------- CLASSE ----------
def get_classes(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Classe).offset(skip).limit(limit).all()


def get_classe(db: Session, id_classe: int):
    return db.query(Classe).filter(Classe.id_classe == id_classe).first()


def create_classe(db: Session, data: ClasseCreate):
    db_obj = Classe(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_classe(db: Session, id_classe: int, data: ClasseUpdate):
    db_obj = get_classe(db, id_classe)
    if not db_obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_classe(db: Session, id_classe: int):
    db_obj = get_classe(db, id_classe)
    if not db_obj:
        return None
    db.delete(db_obj)
    db.commit()
    return db_obj


# ---------- MATIERE ----------
def get_matieres(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Matiere).offset(skip).limit(limit).all()


def get_matiere(db: Session, id_matiere: int):
    return db.query(Matiere).filter(Matiere.id_matiere == id_matiere).first()


def create_matiere(db: Session, data: MatiereCreate):
    db_obj = Matiere(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_matiere(db: Session, id_matiere: int, data: MatiereUpdate):
    db_obj = get_matiere(db, id_matiere)
    if not db_obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_matiere(db: Session, id_matiere: int):
    db_obj = get_matiere(db, id_matiere)
    if not db_obj:
        return None
    db.delete(db_obj)
    db.commit()
    return db_obj


# ---------- CLASSE_MATIERE ----------
def get_classe_matieres(db: Session, id_classe: int):
    return db.query(ClasseMatiere).filter(ClasseMatiere.id_classe == id_classe).all()


def create_classe_matiere(db: Session, data: ClasseMatiereCreate):
    db_obj = ClasseMatiere(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj