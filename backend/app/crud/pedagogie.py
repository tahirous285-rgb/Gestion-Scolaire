from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.pedagogie import Evaluation, Note, PresenceEleve, Bulletin
from app.models.eleves import Inscription
from app.schemas.pedagogie import (
    EvaluationCreate,
    NoteCreate, NoteUpdate,
    PresenceEleveCreate, PresenceEleveUpdate,
    BulletinCreate, BulletinUpdate
)


# ---------- EVALUATION ----------
def get_evaluations(
    db: Session,
    id_annee: int = None,
    id_classe: int = None,
    id_matiere: int = None,
    id_enseignant: int = None,
    id_periode: int = None,
    skip: int = 0,
    limit: int = 100,
):
    query = db.query(Evaluation)
    if id_annee:
        query = query.filter(Evaluation.id_annee == id_annee)
    if id_classe:
        query = query.filter(Evaluation.id_classe == id_classe)
    if id_matiere:
        query = query.filter(Evaluation.id_matiere == id_matiere)
    if id_enseignant:
        query = query.filter(Evaluation.id_enseignant == id_enseignant)
    if id_periode:
        query = query.filter(Evaluation.id_periode == id_periode)
    return query.order_by(Evaluation.id_evaluation.desc()).offset(skip).limit(limit).all()


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
    return query.order_by(Note.id_note).offset(skip).limit(limit).all()


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


def enregistrer_saisie_notes(db: Session, id_evaluation: int, data):
    from app.schemas.pedagogie import NoteSaisieResponse

    evaluation = get_evaluation(db, id_evaluation)
    if not evaluation:
        raise HTTPException(status_code=404, detail="Évaluation introuvable")

    inactive_statuses = {"inactive", "inactif", "inactife", "annule", "annulé", "annulée", "supprime", "supprimé", "supprimée", "radie", "radié", "radiée"}
    registrations = db.query(Inscription).filter(
        Inscription.id_annee == evaluation.id_annee,
        Inscription.id_classe == evaluation.id_classe,
    ).all()
    roster_ids = {
        row.id_inscription
        for row in registrations
        if str(row.statut or "active").strip().lower() not in inactive_statuses
    }
    submitted_ids = [entry.id_inscription for entry in data.notes]
    if len(submitted_ids) != len(set(submitted_ids)):
        raise HTTPException(status_code=400, detail="Un élève figure plusieurs fois dans la saisie")
    if set(submitted_ids) != roster_ids:
        raise HTTPException(
            status_code=400,
            detail="La liste des notes ne correspond pas aux élèves inscrits dans cette classe et cette année. Rechargez la liste.",
        )

    if data.valider and any(not entry.absence and entry.valeur is None for entry in data.notes):
        raise HTTPException(
            status_code=400,
            detail="Chaque élève doit avoir une note ou être marqué absent avant la validation.",
        )

    existing_notes = {
        note.id_inscription: note
        for note in db.query(Note).filter(Note.id_evaluation == id_evaluation).all()
    }
    try:
        for entry in data.notes:
            value = None if entry.absence else entry.valeur
            if value is not None and (value < 0 or value > evaluation.bareme):
                raise HTTPException(
                    status_code=400,
                    detail=f"La note doit être comprise entre 0 et {evaluation.bareme}",
                )

            note = existing_notes.get(entry.id_inscription)
            if note:
                note.valeur = value
                note.absence = entry.absence
            elif value is not None or entry.absence:
                db.add(Note(
                    id_evaluation=id_evaluation,
                    id_inscription=entry.id_inscription,
                    valeur=value,
                    absence=entry.absence,
                ))

        evaluation.notes_validees = data.valider
        db.commit()
    except Exception:
        db.rollback()
        raise

    saved_notes = get_notes(db, id_evaluation=id_evaluation, limit=1000)
    return NoteSaisieResponse(notes=saved_notes, notes_validees=evaluation.notes_validees)


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
def get_presences(
    db: Session,
    id_inscription: int = None,
    id_annee: int = None,
    id_classe: int = None,
    date_presence=None,
    skip: int = 0,
    limit: int = 100,
):
    query = db.query(PresenceEleve)
    if id_inscription:
        query = query.filter(PresenceEleve.id_inscription == id_inscription)
    if id_annee or id_classe:
        query = query.join(Inscription, Inscription.id_inscription == PresenceEleve.id_inscription)
        if id_annee:
            query = query.filter(Inscription.id_annee == id_annee)
        if id_classe:
            query = query.filter(Inscription.id_classe == id_classe)
    if date_presence:
        query = query.filter(PresenceEleve.date_presence == date_presence)
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


def enregistrer_appel(db: Session, data):
    from app.models.scolarite import Classe, Matiere
    from app.schemas.pedagogie import PresenceAppelResponse

    school_class = db.query(Classe).filter(Classe.id_classe == data.id_classe).first()
    subject = db.query(Matiere).filter(Matiere.id_matiere == data.id_matiere).first()
    if not school_class or not subject:
        raise HTTPException(status_code=404, detail="Classe ou matière introuvable")
    if school_class.id_etablissement != subject.id_etablissement:
        raise HTTPException(status_code=400, detail="La matière ne correspond pas à l’établissement de la classe")

    registrations = db.query(Inscription).filter(
        Inscription.id_annee == data.id_annee,
        Inscription.id_classe == data.id_classe,
    ).all()
    inactive_statuses = {"inactive", "inactif", "inactife", "annule", "annulé", "annulée", "supprime", "supprimé", "supprimée", "radie", "radié", "radiée"}
    roster_ids = {
        registration.id_inscription
        for registration in registrations
        if str(registration.statut or "active").strip().lower() not in inactive_statuses
    }
    submitted_ids = [entry.id_inscription for entry in data.presences]
    if len(submitted_ids) != len(set(submitted_ids)):
        raise HTTPException(status_code=400, detail="Un élève figure plusieurs fois dans l’appel")
    if set(submitted_ids) != roster_ids:
        raise HTTPException(
            status_code=400,
            detail="La liste des présences ne correspond pas aux élèves inscrits dans cette classe et cette année. Rechargez l’appel.",
        )

    allowed_statuses = {"PRESENT", "ABSENT", "RETARD", "EXCUSE"}
    if any(entry.statut not in allowed_statuses for entry in data.presences):
        raise HTTPException(status_code=400, detail="Statut de présence invalide")

    existing_rows = db.query(PresenceEleve).filter(
        PresenceEleve.date_presence == data.date_presence,
        PresenceEleve.id_inscription.in_(roster_ids or {-1}),
    ).all()
    existing_by_registration = {row.id_inscription: row for row in existing_rows}

    try:
        for entry in data.presences:
            presence = existing_by_registration.get(entry.id_inscription)
            fields = {
                "id_matiere": data.id_matiere,
                "statut": entry.statut,
                "motif": entry.motif,
                "justifiee": entry.justifiee,
                "observation": entry.observation,
            }
            if presence:
                for key, value in fields.items():
                    setattr(presence, key, value)
            else:
                db.add(PresenceEleve(
                    id_inscription=entry.id_inscription,
                    date_presence=data.date_presence,
                    id_utilisateur=data.id_utilisateur,
                    **fields,
                ))
        db.commit()
    except Exception:
        db.rollback()
        raise

    saved = db.query(PresenceEleve).filter(
        PresenceEleve.date_presence == data.date_presence,
        PresenceEleve.id_inscription.in_(roster_ids or {-1}),
    ).order_by(PresenceEleve.id_inscription).all()
    return PresenceAppelResponse(presences=saved, enregistrees=len(saved))


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