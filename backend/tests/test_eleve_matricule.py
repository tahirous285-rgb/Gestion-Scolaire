import re

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.crud.eleves import create_eleve
from app.models.administration import Etablissement
from app.models import scolarite as scolarite_models
from app.schemas.eleves import EleveCreate


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


def test_student_matricule_is_generated_and_unique(db):
    school = Etablissement(nom="Ecole test", code="ECOLE-TEST")
    db.add(school)
    db.commit()
    payload = EleveCreate(
        id_etablissement=school.id_etablissement,
        nom="Diallo",
        prenom="Awa",
    )

    first = create_eleve(db, payload)
    second = create_eleve(db, payload)

    assert re.fullmatch(r"ELV-[A-F0-9]{8}", first.matricule)
    assert first.matricule != second.matricule


def test_student_matricule_is_not_user_supplied(db):
    school = Etablissement(nom="Ecole test", code="ECOLE-TEST")
    db.add(school)
    db.commit()
    payload = EleveCreate(
        id_etablissement=school.id_etablissement,
        matricule="MANUEL-123",
        nom="Diallo",
        prenom="Awa",
    )

    student = create_eleve(db, payload)

    assert student.matricule != "MANUEL-123"
    assert re.fullmatch(r"ELV-[A-F0-9]{8}", student.matricule)