import re

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.crud.enseignants import create_enseignant
from app.models.administration import Etablissement
from app.models import scolarite as scolarite_models
from app.schemas.enseignants import EnseignantCreate


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


def test_teacher_matricule_is_generated_and_unique(db):
    school = Etablissement(nom="École test", code="ECOLE-TEST")
    db.add(school)
    db.commit()
    payload = EnseignantCreate(
        id_etablissement=school.id_etablissement,
        nom="Diallo",
        prenom="Awa",
        type_contrat="CDD",
    )

    first = create_enseignant(db, payload)
    second = create_enseignant(db, payload)

    assert re.fullmatch(r"ENS-[A-F0-9]{8}", first.matricule)
    assert first.matricule != second.matricule
    assert first.type_contrat == "CDD"
    assert second.type_contrat == "CDD"
