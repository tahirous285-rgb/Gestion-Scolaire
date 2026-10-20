from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    Column,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class Caisse(Base):
    __tablename__ = "caisse"

    id_caisse = Column(Integer, primary_key=True, index=True)
    id_etablissement = Column(
        Integer,
        ForeignKey("etablissement.id_etablissement"),
        nullable=False,
        unique=True,
    )
    solde_initial = Column(Numeric(14, 2), nullable=False)
    initialisee = Column(Boolean, nullable=False, default=True)
    date_debut_suivi = Column(Date, nullable=False)
    date_creation = Column(DateTime, nullable=False, default=datetime.utcnow)
    id_utilisateur = Column(Integer, ForeignKey("utilisateur.id_utilisateur"), nullable=False)

    __table_args__ = (
        CheckConstraint("solde_initial >= 0", name="ck_caisse_solde_initial_non_negatif"),
    )


class MouvementCaisse(Base):
    __tablename__ = "mouvement_caisse"

    id_mouvement_caisse = Column(Integer, primary_key=True, index=True)
    id_caisse = Column(Integer, ForeignKey("caisse.id_caisse"), nullable=False, index=True)
    date_mouvement = Column(DateTime, nullable=False, index=True)
    sens = Column(String(10), nullable=False)
    categorie = Column(String(30), nullable=False)
    libelle = Column(String(255), nullable=False)
    montant = Column(Numeric(14, 2), nullable=False)
    mode_paiement = Column(String(50), nullable=False)
    source_type = Column(String(40), nullable=False)
    source_id = Column(Integer, nullable=False)
    id_utilisateur = Column(Integer, ForeignKey("utilisateur.id_utilisateur"), nullable=True)
    commentaire = Column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint("id_caisse", "source_type", "source_id", name="uq_caisse_source"),
        CheckConstraint("sens IN ('entree', 'sortie')", name="ck_mouvement_caisse_sens"),
        CheckConstraint(
            "categorie IN ('frais_inscription', 'honoraire', 'depense')",
            name="ck_mouvement_caisse_categorie",
        ),
        CheckConstraint("montant > 0", name="ck_mouvement_caisse_montant_positif"),
    )


class ClotureCaisse(Base):
    __tablename__ = "cloture_caisse"

    id_cloture_caisse = Column(Integer, primary_key=True, index=True)
    id_caisse = Column(Integer, ForeignKey("caisse.id_caisse"), nullable=False, index=True)
    date_cloture = Column(Date, nullable=False)
    solde_theorique = Column(Numeric(14, 2), nullable=False)
    solde_compte = Column(Numeric(14, 2), nullable=False)
    ecart = Column(Numeric(14, 2), nullable=False)
    statut = Column(String(20), nullable=False, default="cloturee")
    commentaire = Column(Text, nullable=True)
    motif_reouverture = Column(Text, nullable=True)
    id_utilisateur = Column(Integer, ForeignKey("utilisateur.id_utilisateur"), nullable=False)
    date_creation = Column(DateTime, nullable=False, default=datetime.utcnow)
    date_reouverture = Column(DateTime, nullable=True)
    caisse = relationship("Caisse")

    __table_args__ = (
        CheckConstraint("statut IN ('cloturee', 'reouverte')", name="ck_cloture_caisse_statut"),
        CheckConstraint("solde_compte >= 0", name="ck_cloture_caisse_solde_compte_non_negatif"),
        Index(
            "uq_caisse_cloture_active_date",
            "id_caisse",
            "date_cloture",
            unique=True,
            sqlite_where=text("statut = 'cloturee'"),
        ),
    )