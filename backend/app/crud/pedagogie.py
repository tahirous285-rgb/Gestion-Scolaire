from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.pedagogie import Evaluation, Note, PresenceEleve, Bulletin
from app.schemas.pedagogie import (
    EvaluationCreate,
    NoteCreate, NoteUpdate,
    PresenceEleveCreate, PresenceEleveUpdate,
    BulletinCreate, BulletinUpdate
)


# ---------- EVALUATION ----------
def get_evaluations(db: Session, id_classe: int = None, id_periode: int = None, skip: int = 0, limit: int = 100):
    query = db.query(Evaluation)
    if id_classe:
        query = query.filter(Evaluation.id_classe == id_classe)
    if id_periode:
        query = query.filter(Evaluation.id_periode == id_periode)
    return query.offset(skip).limit(limit).all()


def get_evaluation(db: Session, id_evaluation: int):
    return db.query(Evaluation).filter(Evaluation.id_evaluation == id_evaluation).first()


def create_evaluation(db: Session, data: EvaluationCreate):
    db_obj = Evaluation(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


# ---------- NOTE ----------
def get_notes(db: Session, id_evaluation: int = None, id_inscription: int = None, skip: int = 0, limit: int = 100):
    query = db.query(Note)
    if id_evaluation:
        query = query.filter(Note.id_evaluation == id_evaluation)
    if id_inscription:
        query = query.filter(Note.id_inscription == id_inscription)
    return query.offset(skip).limit(limit).all()


def get_note(db: Session, id_note: int):
    return db.query(Note).filter(Note.id_note == id_note).first()


def create_note(db: Session, data: NoteCreate):
    # Règle R10 : 0 <= note <= bareme
    if data.valeur is not None:
        evaluation = db.query(Evaluation).filter(Evaluation.id_evaluation == data.id_evaluation).first()
        if not evaluation:
            raise HTTPException(status_code=404, detail="Évaluation introuvable")
        if data.valeur < 0 or data.valeur > evaluation.bareme:
            raise HTTPException(
                status_code=400,
                detail=f"La note doit être comprise entre 0 et {evaluation.bareme}"
            )

    # Règle R3 : une seule note par élève et par évaluation
    existing = db.query(Note).filter(
        Note.id_evaluation == data.id_evaluation,
        Note.id_inscription == data.id_inscription
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Une note existe déjà pour cet élève sur cette évaluation")

    db_obj = Note(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_note(db: Session, id_note: int, data: NoteUpdate):
    db_obj = get_note(db, id_note)
    if not db_obj:
        return None

    if data.valeur is not None:
        evaluation = db.query(Evaluation).filter(Evaluation.id_evaluation == db_obj.id_evaluation).first()
        if data.valeur < 0 or data.valeur > evaluation.bareme:
            raise HTTPException(
                status_code=400,
                detail=f"La note doit être comprise entre 0 et {evaluation.bareme}"
            )

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_note(db: Session, id_note: int):
    db_obj = get_note(db, id_note)
    if not db_obj:
        return None
    db.delete(db_obj)
    db.commit()
    return db_obj


# ---------- PRESENCE_ELEVE ----------
def get_presences(db: Session, id_inscription: int = None, skip: int = 0, limit: int = 100):
    query = db.query(PresenceEleve)
    if id_inscription:
        query = query.filter(PresenceEleve.id_inscription == id_inscription)
    return query.offset(skip).limit(limit).all()


def create_presence(db: Session, data: PresenceEleveCreate):
    # Règle R5 : une seule présence par inscription et par date
    existing = db.query(PresenceEleve).filter(
        PresenceEleve.id_inscription == data.id_inscription,
        PresenceEleve.date_presence == data.date_presence
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Une présence existe déjà pour cet élève à cette date")

    db_obj = PresenceEleve(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_presence(db: Session, id_presence: int, data: PresenceEleveUpdate):
    db_obj = db.query(PresenceEleve).filter(PresenceEleve.id_presence == id_presence).first()
    if not db_obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


# ---------- BULLETIN ----------
def get_bulletins(db: Session, id_inscription: int = None, id_periode: int = None, skip: int = 0, limit: int = 100):
    query = db.query(Bulletin)
    if id_inscription:
        query = query.filter(Bulletin.id_inscription == id_inscription)
    if id_periode:
        query = query.filter(Bulletin.id_periode == id_periode)
    return query.offset(skip).limit(limit).all()


def get_bulletin(db: Session, id_bulletin: int):
    return db.query(Bulletin).filter(Bulletin.id_bulletin == id_bulletin).first()


def create_bulletin(db: Session, data: BulletinCreate):
    # Règle R4 : un seul bulletin par inscription et par période
    existing = db.query(Bulletin).filter(
        Bulletin.id_inscription == data.id_inscription,
        Bulletin.id_periode == data.id_periode
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Un bulletin existe déjà pour cet élève sur cette période")

    db_obj = Bulletin(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_bulletin(db: Session, id_bulletin: int, data: BulletinUpdate):
    db_obj = get_bulletin(db, id_bulletin)
    if not db_obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def generer_pdf_bulletin(db: Session, id_bulletin: int):
    from datetime import datetime
    from app.services.pdf_service import generer_pdf_bulletin as creer_pdf
    from app.models.eleves import Eleve, Inscription
    from app.models.scolarite import Periode

    bulletin = get_bulletin(db, id_bulletin)
    if not bulletin:
        return None

    inscription = db.query(Inscription).filter(Inscription.id_inscription == bulletin.id_inscription).first()
    eleve = db.query(Eleve).filter(Eleve.id_eleve == inscription.id_eleve).first()
    periode = db.query(Periode).filter(Periode.id_periode == bulletin.id_periode).first()

    chemin = creer_pdf(
        nom_eleve=eleve.nom,
        prenom_eleve=eleve.prenom,
        periode_libelle=periode.libelle,
        moyenne_generale=bulletin.moyenne_generale or 0,
        rang=bulletin.rang or 0,
        appreciation=bulletin.appreciation or ""
    )

    bulletin.pdf = chemin
    bulletin.date_generation = datetime.utcnow()
    db.commit()
    db.refresh(bulletin)
    return bulletin