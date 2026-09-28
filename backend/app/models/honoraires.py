from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint
from datetime import datetime
from app.core.database import Base


class Mois(Base):
    __tablename__ = "mois"

    id_mois = Column(Integer, primary_key=True, index=True)
    numero = Column(Integer, unique=True, nullable=False)
    libelle = Column(String, unique=True, nullable=False)


class Honoraire(Base):
    __tablename__ = "honoraire"

    id_honoraire = Column(Integer, primary_key=True, index=True)
    id_enseignant = Column(Integer, ForeignKey("enseignant.id_enseignant"), nullable=False)
    id_annee = Column(Integer, ForeignKey("annee_scolaire.id_annee"), nullable=False)
    id_mois = Column(Integer, ForeignKey("mois.id_mois"), nullable=False)
    heures_prevues = Column(Float, nullable=True)
    heures_effectuees = Column(Float, nullable=True)
    taux_horaire = Column(Float, nullable=False)
    montant_brut = Column(Float, nullable=False, default=0)
    retenues = Column(Float, nullable=False, default=0)
    montant_net = Column(Float, nullable=False, default=0)
    montant_paye = Column(Float, nullable=False, default=0)
    solde = Column(Float, nullable=False, default=0)
    statut = Column(String, default="calcule")
    date_calcul = Column(DateTime, default=datetime.utcnow)
    id_validateur = Column(Integer, ForeignKey("utilisateur.id_utilisateur"), nullable=True)
    date_validation = Column(DateTime, nullable=True)
    observation = Column(String, nullable=True)

    __table_args__ = (
        UniqueConstraint("id_enseignant", "id_annee", "id_mois", name="uq_enseignant_annee_mois_honoraire"),
    )


class PaiementHonoraire(Base):
    __tablename__ = "paiement_honoraire"

    id_paiement_honoraire = Column(Integer, primary_key=True, index=True)
    id_honoraire = Column(Integer, ForeignKey("honoraire.id_honoraire"), nullable=False)
    reference = Column(String, unique=True, nullable=False)
    date_paiement = Column(DateTime, nullable=False)
    montant = Column(Float, nullable=False)
    mode_paiement = Column(String, nullable=True)
    statut = Column(String, default="valide")
    commentaire = Column(String, nullable=True)
    id_utilisateur = Column(Integer, ForeignKey("utilisateur.id_utilisateur"), nullable=True)