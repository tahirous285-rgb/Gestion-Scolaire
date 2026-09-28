from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.pedagogie import Note, Evaluation


def valider_note(valeur: float, bareme: float):
    """
    Règle R10 : la note doit être comprise entre 0 et le barème de l'évaluation.
    """
    if valeur is None:
        return
    if valeur < 0 or valeur > bareme:
        raise HTTPException(
            status_code=400,
            detail=f"La note doit être comprise entre 0 et {bareme}"
        )


def saisir_note(db: Session, id_evaluation: int, id_inscription: int, valeur: float, **kwargs):
    """
    Enregistre la note d'un élève pour une évaluation.
    Règle R3 : une seule note par élève et par évaluation.
    Règle R10 : 0 <= note <= bareme.
    """
    evaluation = db.query(Evaluation).filter(Evaluation.id_evaluation == id_evaluation).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Évaluation introuvable")

    valider_note(valeur, evaluation.bareme)

    existing = db.query(Note).filter(
        Note.id_evaluation == id_evaluation,
        Note.id_inscription == id_inscription
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Une note existe déjà pour cet élève sur cette évaluation"
        )

    note = Note(id_evaluation=id_evaluation, id_inscription=id_inscription, valeur=valeur, **kwargs)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note