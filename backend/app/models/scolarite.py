from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


class AnneeScolaire(Base):
    __tablename__ = "annee_scolaire"

    id_annee = Column(Integer, primary_key=True, index=True)
    id_etablissement = Column(Integer, ForeignKey("etablissement.id_etablissement"), nullable=False)
    libelle = Column(String, nullable=False)
    date_debut = Column(Date, nullable=False)
    date_fin = Column(Date, nullable=False)
    statut = Column(String, default="active")

    __table_args__ = (
        UniqueConstraint("id_etablissement", "libelle", name="uq_etab_libelle_annee"),
    )


class Periode(Base):
    __tablename__ = "periode"

    id_periode = Column(Integer, primary_key=True, index=True)
    id_annee = Column(Integer, ForeignKey("annee_scolaire.id_annee"), nullable=False)
    code = Column(String, nullable=False)
    libelle = Column(String, nullable=False)
    ordre = Column(Integer, nullable=False)
    date_debut = Column(Date, nullable=False)
    date_fin = Column(Date, nullable=False)

    __table_args__ = (
        UniqueConstraint("id_annee", "code", name="uq_annee_code_periode"),
        UniqueConstraint("id_annee", "ordre", name="uq_annee_ordre_periode"),
    )


class Classe(Base):
    __tablename__ = "classe"

    id_classe = Column(Integer, primary_key=True, index=True)
    id_etablissement = Column(Integer, ForeignKey("etablissement.id_etablissement"), nullable=False)
    nom = Column(String, nullable=False)
    niveau = Column(String, nullable=True)
    capacite = Column(Integer, nullable=True)
    salle = Column(String, nullable=True)
    actif = Column(Boolean, default=True)

    __table_args__ = (
        UniqueConstraint("id_etablissement", "nom", name="uq_etab_nom_classe"),
    )


class Matiere(Base):
    __tablename__ = "matiere"

    id_matiere = Column(Integer, primary_key=True, index=True)
    id_etablissement = Column(Integer, ForeignKey("etablissement.id_etablissement"), nullable=False)
    code = Column(String, nullable=False)
    nom = Column(String, nullable=False)
    description = Column(String, nullable=True)
    actif = Column(Boolean, default=True)

    __table_args__ = (
        UniqueConstraint("id_etablissement", "code", name="uq_etab_code_matiere"),
    )


class ClasseMatiere(Base):
    __tablename__ = "classe_matiere"

    id_classe = Column(Integer, ForeignKey("classe.id_classe"), primary_key=True)
    id_matiere = Column(Integer, ForeignKey("matiere.id_matiere"), primary_key=True)
    coefficient = Column(Integer, nullable=True)
    volume_horaire = Column(Integer, nullable=True)