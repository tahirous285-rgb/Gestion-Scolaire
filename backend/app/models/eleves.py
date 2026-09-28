from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, UniqueConstraint, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Eleve(Base):
    __tablename__ = "eleve"

    id_eleve = Column(Integer, primary_key=True, index=True)
    id_etablissement = Column(Integer, ForeignKey("etablissement.id_etablissement"), nullable=False)
    matricule = Column(String, nullable=False)
    nom = Column(String, nullable=False)
    prenom = Column(String, nullable=False)
    sexe = Column(String, nullable=True)
    date_naissance = Column(Date, nullable=True)
    lieu_naissance = Column(String, nullable=True)
    nationalite = Column(String, nullable=True)
    adresse = Column(String, nullable=True)
    telephone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    photo = Column(String, nullable=True)
    actif = Column(Boolean, default=True)
    date_creation = Column(DateTime, default=datetime.utcnow)
    date_modification = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("id_etablissement", "matricule", name="uq_etab_matricule_eleve"),
    )


class Parent(Base):
    __tablename__ = "parent"

    id_parent = Column(Integer, primary_key=True, index=True)
    id_etablissement = Column(Integer, ForeignKey("etablissement.id_etablissement"), nullable=False)
    nom = Column(String, nullable=False)
    prenom = Column(String, nullable=False)
    telephone = Column(String, nullable=True)
    telephone_secondaire = Column(String, nullable=True)
    email = Column(String, nullable=True)
    adresse = Column(String, nullable=True)
    profession = Column(String, nullable=True)


class EleveParent(Base):
    __tablename__ = "eleve_parent"

    id_eleve = Column(Integer, ForeignKey("eleve.id_eleve"), primary_key=True)
    id_parent = Column(Integer, ForeignKey("parent.id_parent"), primary_key=True)
    lien_parente = Column(String, nullable=True)
    est_responsable = Column(Boolean, default=False)
    est_contact_urgence = Column(Boolean, default=False)


class Inscription(Base):
    __tablename__ = "inscription"

    id_inscription = Column(Integer, primary_key=True, index=True)
    id_eleve = Column(Integer, ForeignKey("eleve.id_eleve"), nullable=False)
    id_annee = Column(Integer, ForeignKey("annee_scolaire.id_annee"), nullable=False)
    id_classe = Column(Integer, ForeignKey("classe.id_classe"), nullable=False)
    numero_inscription = Column(String, nullable=True)
    date_inscription = Column(Date, nullable=True)
    statut = Column(String, default="active")
    redoublant = Column(Boolean, default=False)
    observation = Column(String, nullable=True)

    __table_args__ = (
        UniqueConstraint("id_eleve", "id_annee", name="uq_eleve_annee_inscription"),
    )