from datetime import date

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.crud.eleves import update_inscription
from app.models.administration import Etablissement
from app.models.eleves import Eleve, Inscription
from app.models.scolarite import AnneeScolaire, Classe
from app.schemas.eleves import InscriptionUpdate


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


def create_transfer_data(db):
    school = Etablissement(nom="École test", code="ECOLE-TEST")
    other_school = Etablissement(nom="Autre école", code="AUTRE-ECOLE")
    db.add_all([school, other_school])
    db.flush()
    year = AnneeScolaire(
        id_etablissement=school.id_etablissement,
        libelle="2026-2027",
        date_debut=date(2026, 9, 1),
        date_fin=date(2027, 7, 1),
    )
    source_class = Classe(id_etablissement=school.id_etablissement, nom="6ème A")
    target_class = Classe(id_etablissement=school.id_etablissement, nom="6ème B")
    foreign_class = Classe(id_etablissement=other_school.id_etablissement, nom="6ème C")
    student = Eleve(
        id_etablissement=school.id_etablissement,
        matricule="ELV-0001",
        nom="Diallo",
        prenom="Awa",
    )
    db.add_all([year, source_class, target_class, foreign_class, student])
    db.flush()
    inscription = Inscription(
        id_eleve=student.id_eleve,
        id_annee=year.id_annee,
        id_classe=source_class.id_classe,
        statut="active",
    )
    db.add(inscription)
    db.commit()
    return inscription, target_class, foreign_class


def test_transfer_changes_the_existing_enrolment_class(db):
    inscription, target_class, _ = create_transfer_data(db)

    updated = update_inscription(
        db,
        inscription.id_inscription,
        InscriptionUpdate(id_classe=target_class.id_classe),
    )

    assert updated.id_inscription == inscription.id_inscription
    assert updated.id_classe == target_class.id_classe


def test_transfer_rejects_a_class_from_another_establishment(db):
    inscription, _, foreign_class = create_transfer_data(db)

    with pytest.raises(HTTPException) as error:
        update_inscription(
            db,
            inscription.id_inscription,
            InscriptionUpdate(id_classe=foreign_class.id_classe),
        )

    assert error.value.status_code == 400