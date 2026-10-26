import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.crud.scolarite import create_matiere
from app.models.administration import Etablissement
from app.schemas.scolarite import MatiereCreate


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


def test_matiere_code_is_generated_and_unique_per_establishment(db):
    school = Etablissement(nom="École test", code="ECOLE-TEST")
    db.add(school)
    db.commit()

    first = create_matiere(
        db,
        MatiereCreate(id_etablissement=school.id_etablissement, nom="Sciences naturelles"),
    )
    second = create_matiere(
        db,
        MatiereCreate(id_etablissement=school.id_etablissement, nom="Sciences naturelles"),
    )

    assert first.code == "SCIENCES-NATURELLES"
    assert second.code == "SCIENCES-NATURELLES-2"
    assert first.code != second.code
