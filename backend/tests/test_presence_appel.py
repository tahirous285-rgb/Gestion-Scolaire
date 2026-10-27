from datetime import date

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.crud.pedagogie import enregistrer_appel
from app.models.administration import Etablissement
from app.models.eleves import Eleve, Inscription
from app.models.enseignants import Enseignant
from app.models.pedagogie import PresenceEleve
from app.models.scolarite import AnneeScolaire, Classe, Matiere
from app.schemas.pedagogie import PresenceAppelEntry, PresenceAppelRequest


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


def create_attendance_data(db):
    school = Etablissement(nom="École test", code="ECOLE-TEST")
    db.add(school)
    db.flush()
    year = AnneeScolaire(id_etablissement=school.id_etablissement, libelle="2026-2027", date_debut=date(2026, 9, 1), date_fin=date(2027, 7, 1))
    school_class = Classe(id_etablissement=school.id_etablissement, nom="6ème A")
    subject = Matiere(id_etablissement=school.id_etablissement, code="MATH", nom="Mathématiques")
    student_a = Eleve(id_etablissement=school.id_etablissement, matricule="ELV-0001", nom="Traoré", prenom="Mamadou")
    student_b = Eleve(id_etablissement=school.id_etablissement, matricule="ELV-0002", nom="Diallo", prenom="Aïssata")
    db.add_all([year, school_class, subject, student_a, student_b])
    db.flush()
    registrations = [
        Inscription(id_eleve=student.id_eleve, id_annee=year.id_annee, id_classe=school_class.id_classe, statut="active")
        for student in [student_a, student_b]
    ]
    db.add_all(registrations)
    db.commit()
    request = lambda entries: PresenceAppelRequest(
        id_annee=year.id_annee,
        id_classe=school_class.id_classe,
        id_matiere=subject.id_matiere,
        date_presence=date(2026, 10, 27),
        presences=entries,
    )
    return registrations, request


def test_saves_and_updates_one_class_call_without_duplicates(db):
    registrations, request = create_attendance_data(db)
    first = enregistrer_appel(db, request([
        PresenceAppelEntry(id_inscription=registrations[0].id_inscription, statut="PRESENT"),
        PresenceAppelEntry(id_inscription=registrations[1].id_inscription, statut="ABSENT", motif="Maladie"),
    ]))
    assert first.enregistrees == 2
    assert db.query(PresenceEleve).count() == 2

    second = enregistrer_appel(db, request([
        PresenceAppelEntry(id_inscription=registrations[0].id_inscription, statut="RETARD", motif="Transport"),
        PresenceAppelEntry(id_inscription=registrations[1].id_inscription, statut="PRESENT"),
    ]))

    assert second.enregistrees == 2
    assert db.query(PresenceEleve).count() == 2
    assert {row.statut for row in second.presences} == {"RETARD", "PRESENT"}


def test_call_requires_every_active_registration(db):
    registrations, request = create_attendance_data(db)

    with pytest.raises(HTTPException) as error:
        enregistrer_appel(db, request([
            PresenceAppelEntry(id_inscription=registrations[0].id_inscription, statut="PRESENT"),
        ]))

    assert error.value.status_code == 400
    assert db.query(PresenceEleve).count() == 0