from datetime import date

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.crud.enseignants import get_enseignants_affectes, get_enseignants_de_classe
from app.models.administration import Etablissement
from app.models.enseignants import Enseignant, EnseignantClasse, EnseignantMatiere
from app.models.scolarite import AnneeScolaire, Classe, Matiere


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


def test_assigned_teachers_must_match_class_year_and_subject(db):
    school = Etablissement(nom="École test", code="ECOLE-TEST")
    db.add(school)
    db.flush()
    year = AnneeScolaire(
        id_etablissement=school.id_etablissement,
        libelle="2026-2027",
        date_debut=date(2026, 9, 1),
        date_fin=date(2027, 7, 1),
    )
    school_class = Classe(id_etablissement=school.id_etablissement, nom="6ème A")
    subject = Matiere(id_etablissement=school.id_etablissement, code="MATH", nom="Mathématiques")
    db.add_all([year, school_class, subject])
    db.flush()

    matching = Enseignant(id_etablissement=school.id_etablissement, matricule="ENS-0001", nom="Diallo", prenom="Awa")
    subject_only = Enseignant(id_etablissement=school.id_etablissement, matricule="ENS-0002", nom="Traoré", prenom="Moussa")
    db.add_all([matching, subject_only])
    db.flush()
    db.add_all([
        EnseignantClasse(id_enseignant=matching.id_enseignant, id_classe=school_class.id_classe, id_annee=year.id_annee),
        EnseignantMatiere(id_enseignant=matching.id_enseignant, id_matiere=subject.id_matiere),
        EnseignantMatiere(id_enseignant=subject_only.id_enseignant, id_matiere=subject.id_matiere),
    ])
    db.commit()

    teachers = get_enseignants_affectes(
        db,
        id_annee=year.id_annee,
        id_classe=school_class.id_classe,
        id_matiere=subject.id_matiere,
    )

    assert [teacher.id_enseignant for teacher in teachers] == [matching.id_enseignant]

    class_teachers = get_enseignants_de_classe(
        db,
        id_annee=year.id_annee,
        id_classe=school_class.id_classe,
    )
    assert [teacher.id_enseignant for teacher in class_teachers] == [matching.id_enseignant]