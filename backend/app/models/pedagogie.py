from sqlalchemy import Column, Integer, String, Boolean, Float, Date, DateTime, ForeignKey, UniqueConstraint
from datetime import datetime
from app.core.database import Base


class Evaluation(Base):
    __tablename__ = "evaluation"

    id_evaluation = Column(Integer, primary_key=True, index=True)
    id_annee = Column(Integer, ForeignKey("annee_scolaire.id_annee"), nullable=False)
    id_periode = Column(Integer, ForeignKey("periode.id_periode"), nullable=False)
    id_classe = Column(Integer, ForeignKey("classe.id_classe"), nullable=False)
    id_matiere = Column(Integer, ForeignKey("matiere.id_matiere"), nullable=False)
    id_enseignant = Column(Integer, ForeignKey("enseignant.id_enseignant"), nullable=False)
    libelle = Column(String, nullable=False)
    type_evaluation = Column(String, nullable=True)
    date_evaluation = Column(Date, nullable=True)
    bareme = Column(Float, nullable=False, default=20)
    coefficient = Column(Float, nullable=False, default=1)
    observation = Column(String, nullable=True)


class Note(Base):
    __tablename__ = "note"

    id_note = Column(Integer, primary_key=True, index=True)
    id_evaluation = Column(Integer, ForeignKey("evaluation.id_evaluation"), nullable=False)
    id_inscription = Column(Integer, ForeignKey("inscription.id_inscription"), nullable=False)
    valeur = Column(Float, nullable=True)
    absence = Column(Boolean, default=False)
    observation = Column(String, nullable=True)
    date_creation = Column(DateTime, default=datetime.utcnow)
    date_modification = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("id_evaluation", "id_inscription", name="uq_evaluation_inscription_note"),
    )


class PresenceEleve(Base):
    __tablename__ = "presence_eleve"

    id_presence = Column(Integer, primary_key=True, index=True)
    id_inscription = Column(Integer, ForeignKey("inscription.id_inscription"), nullable=False)
    date_presence = Column(Date, nullable=False)
    statut = Column(String, nullable=False)  # PRESENT, ABSENT, RETARD, EXCUSE
    heure_arrivee = Column(String, nullable=True)
    heure_depart = Column(String, nullable=True)
    motif = Column(String, nullable=True)
    justifiee = Column(Boolean, default=False)
    observation = Column(String, nullable=True)
    id_utilisateur = Column(Integer, ForeignKey("utilisateur.id_utilisateur"), nullable=True)

    __table_args__ = (
        UniqueConstraint("id_inscription", "date_presence", name="uq_inscription_date_presence"),
    )


class Bulletin(Base):
    __tablename__ = "bulletin"

    id_bulletin = Column(Integer, primary_key=True, index=True)
    id_inscription = Column(Integer, ForeignKey("inscription.id_inscription"), nullable=False)
    id_periode = Column(Integer, ForeignKey("periode.id_periode"), nullable=False)
    moyenne_generale = Column(Float, nullable=True)
    rang = Column(Integer, nullable=True)
    appreciation = Column(String, nullable=True)
    decision = Column(String, nullable=True)
    date_generation = Column(DateTime, nullable=True)
    pdf = Column(String, nullable=True)
    valide = Column(Boolean, default=False)
    id_validateur = Column(Integer, ForeignKey("utilisateur.id_utilisateur"), nullable=True)
    date_creation = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("id_inscription", "id_periode", name="uq_inscription_periode_bulletin"),
    )