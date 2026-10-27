from datetime import date

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.crud.pedagogie import enregistrer_saisie_notes
from app.models.administration import Etablissement
from app.models.eleves import Eleve, Inscription
from app.models.enseignants import Enseignant
from app.models.pedagogie import Evaluation, Note
from app.models.scolarite import AnneeScolaire, Classe, Matiere, Periode
from app.schemas.pedagogie import NoteSaisieEntry, NoteSaisieRequest


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine, autoflush=False, autocommit=False)()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def create_note_entry_data(db):
    school = Etablissement(nom="École test", code="ECOLE-TEST")
    db.add(school)
    db.flush()
    year = AnneeScolaire(id_etablissement=school.id_etablissement, libelle="2026-2027", date_debut=date(2026, 9, 1), date_fin=date(2027, 7, 1))
    school_class = Classe(id_etablissement=school.id_etablissement, nom="6ème A")
    subject = Matiere(id_etablissement=school.id_etablissement, code="MATH", nom="Mathématiques")
    teacher = Enseignant(id_etablissement=school.id_etablissement, matricule="ENS-0001", nom="Diallo", prenom="Awa")
    student_a = Eleve(id_etablissement=school.id_etablissement, matricule="ELV-0001", nom="Traoré", prenom="Mamadou")
    student_b = Eleve(id_etablissement=school.id_etablissement, matricule="ELV-0002", nom="Diallo", prenom="Aïssata")
    db.add_all([year, school_class, subject, teacher, student_a, student_b])
    db.flush()
    period = Periode(id_annee=year.id_annee, code="T1", libelle="1er trimestre", ordre=1, date_debut=date(2026, 9, 1), date_fin=date(2026, 12, 1))
    db.add(period)
    db.flush()
    evaluation = Evaluation(id_annee=year.id_annee, id_periode=period.id_periode, id_classe=school_class.id_classe, id_matiere=subject.id_matiere, id_enseignant=teacher.id_enseignant, libelle="Devoir n°1", bareme=20, coefficient=1)
    db.add(evaluation)
    db.flush()
    registrations = [
        Inscription(id_eleve=student.id_eleve, id_annee=year.id_annee, id_classe=school_class.id_classe, statut="active")
        for student in [student_a, student_b]
    ]
    db.add_all(registrations)
    db.commit()
    return evaluation, registrations


def test_batch_draft_saves_partial_notes(db):
    evaluation, registrations = create_note_entry_data(db)

    result = enregistrer_saisie_notes(db, evaluation.id_evaluation, NoteSaisieRequest(
        valider=False,
        notes=[
            NoteSaisieEntry(id_inscription=registrations[0].id_inscription, valeur=15),
            NoteSaisieEntry(id_inscription=registrations[1].id_inscription),
        ],
    ))

    assert result.notes_validees is False
    assert len(result.notes) == 1
    assert result.notes[0].valeur == 15


def test_batch_validation_requires_grade_or_absence_for_each_student(db):
    evaluation, registrations = create_note_entry_data(db)

    with pytest.raises(HTTPException) as error:
        enregistrer_saisie_notes(db, evaluation.id_evaluation, NoteSaisieRequest(
            valider=True,
            notes=[
                NoteSaisieEntry(id_inscription=registrations[0].id_inscription, valeur=15),
                NoteSaisieEntry(id_inscription=registrations[1].id_inscription),
            ],
        ))

    assert error.value.status_code == 400
    assert db.query(Note).count() == 0
    assert evaluation.notes_validees is False


def test_batch_validation_accepts_absence_and_grade(db):
    evaluation, registrations = create_note_entry_data(db)

    result = enregistrer_saisie_notes(db, evaluation.id_evaluation, NoteSaisieRequest(
        valider=True,
        notes=[
            NoteSaisieEntry(id_inscription=registrations[0].id_inscription, valeur=15),
            NoteSaisieEntry(id_inscription=registrations[1].id_inscription, absence=True),
        ],
    ))

    assert result.notes_validees is True
    assert len(result.notes) == 2
    assert sorted(note.absence for note in result.notes) == [False, True]