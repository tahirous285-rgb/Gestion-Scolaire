from sqlalchemy.orm import Session
from app.models.pedagogie import Note, Evaluation
from app.models.eleves import Inscription


def calculer_moyenne_periode(db: Session, id_inscription: int, id_periode: int):
    """
    Calcule la moyenne générale (sur 20) d'un élève pour une période,
    pondérée par le coefficient de chaque évaluation.
    Retourne (moyenne, nombre_notes) ou (None, 0) si aucune note.
    """
    notes = (
        db.query(Note, Evaluation)
        .join(Evaluation, Note.id_evaluation == Evaluation.id_evaluation)
        .filter(
            Note.id_inscription == id_inscription,
            Evaluation.id_periode == id_periode,
            Note.valeur.isnot(None)
        )
        .all()
    )

    if not notes:
        return None, 0

    total_points = 0
    total_coefficients = 0

    for note, evaluation in notes:
        note_sur_20 = (note.valeur / evaluation.bareme) * 20
        total_points += note_sur_20 * evaluation.coefficient
        total_coefficients += evaluation.coefficient

    if total_coefficients == 0:
        return None, 0

    moyenne = round(total_points / total_coefficients, 2)
    return moyenne, len(notes)


def calculer_classement(db: Session, id_classe: int, id_periode: int, id_annee: int):
    """
    Calcule le classement de tous les élèves d'une classe pour une période.
    Retourne une liste de tuples (id_inscription, moyenne, rang) triée
    par moyenne décroissante.
    """
    inscriptions = db.query(Inscription).filter(
        Inscription.id_classe == id_classe,
        Inscription.id_annee == id_annee
    ).all()

    resultats = []
    for inscription in inscriptions:
        moyenne, _ = calculer_moyenne_periode(db, inscription.id_inscription, id_periode)
        if moyenne is not None:
            resultats.append((inscription.id_inscription, moyenne))

    resultats.sort(key=lambda x: x[1], reverse=True)

    return [
        (id_inscription, moyenne, rang)
        for rang, (id_inscription, moyenne) in enumerate(resultats, start=1)
    ]