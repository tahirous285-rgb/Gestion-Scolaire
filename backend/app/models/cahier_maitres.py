from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, Float, ForeignKey, UniqueConstraint
from datetime import datetime
from app.core.database import Base


class PresenceEnseignant(Base):
    __tablename__ = "presence_enseignant"

    id_presence = Column(Integer, primary_key=True, index=True)
    id_enseignant = Column(Integer, ForeignKey("enseignant.id_enseignant"), nullable=False)
    id_annee = Column(Integer, ForeignKey("annee_scolaire.id_annee"), nullable=False)
    date_presence = Column(Date, nullable=False)
    heure_arrivee = Column(String, nullable=True)
    heure_depart = Column(String, nullable=True)
    statut = Column(String, nullable=False)  # PRESENT, ABSENT, RETARD, PERMISSION, MISSION, CONGE, AUTRE
    motif = Column(String, nullable=True)
    justification = Column(String, nullable=True)
    justificatif = Column(String, nullable=True)
    validee = Column(Boolean, default=False)
    id_validateur = Column(Integer, ForeignKey("utilisateur.id_utilisateur"), nullable=True)
    date_validation = Column(DateTime, nullable=True)
    observation = Column(String, nullable=True)

    __table_args__ = (
        UniqueConstraint("id_enseignant", "date_presence", name="uq_enseignant_date_presence"),
    )


class CoursEffectue(Base):
    __tablename__ = "cours_effectue"

    id_cours = Column(Integer, primary_key=True, index=True)
    id_annee = Column(Integer, ForeignKey("annee_scolaire.id_annee"), nullable=False)
    id_enseignant = Column(Integer, ForeignKey("enseignant.id_enseignant"), nullable=False)
    id_classe = Column(Integer, ForeignKey("classe.id_classe"), nullable=False)
    id_matiere = Column(Integer, ForeignKey("matiere.id_matiere"), nullable=False)
    date_cours = Column(Date, nullable=False)
    heures_prevues = Column(Float, nullable=True)
    heures_effectuees = Column(Float, nullable=True)
    statut = Column(String, default="effectue")
    observation = Column(String, nullable=True)
    id_utilisateur = Column(Integer, ForeignKey("utilisateur.id_utilisateur"), nullable=True)


class ObservationEnseignant(Base):
    __tablename__ = "observation_enseignant"

    id_observation = Column(Integer, primary_key=True, index=True)
    id_enseignant = Column(Integer, ForeignKey("enseignant.id_enseignant"), nullable=False)
    id_auteur = Column(Integer, ForeignKey("utilisateur.id_utilisateur"), nullable=False)
    date_observation = Column(Date, nullable=True)
    contenu = Column(String, nullable=False)
    confidentialite = Column(String, default="interne")
    date_creation = Column(DateTime, default=datetime.utcnow)
    date_modification = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)