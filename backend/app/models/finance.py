from sqlalchemy import Column, Integer, String, Boolean, Float, Date, DateTime, ForeignKey, UniqueConstraint
from datetime import datetime
from app.core.database import Base


class TypeFrais(Base):
    __tablename__ = "type_frais"

    id_type_frais = Column(Integer, primary_key=True, index=True)
    id_etablissement = Column(Integer, ForeignKey("etablissement.id_etablissement"), nullable=False)
    code = Column(String, nullable=False)
    libelle = Column(String, nullable=False)
    description = Column(String, nullable=True)
    actif = Column(Boolean, default=True)

    __table_args__ = (
        UniqueConstraint("id_etablissement", "code", name="uq_etab_code_type_frais"),
    )


class FraisScolaire(Base):
    __tablename__ = "frais_scolaire"

    id_frais = Column(Integer, primary_key=True, index=True)
    id_annee = Column(Integer, ForeignKey("annee_scolaire.id_annee"), nullable=False)
    id_inscription = Column(Integer, ForeignKey("inscription.id_inscription"), nullable=False)
    id_type_frais = Column(Integer, ForeignKey("type_frais.id_type_frais"), nullable=False)
    montant_du = Column(Float, nullable=False)
    date_echeance = Column(Date, nullable=True)
    obligatoire = Column(Boolean, default=True)
    description = Column(String, nullable=True)


class Paiement(Base):
    __tablename__ = "paiement"

    id_paiement = Column(Integer, primary_key=True, index=True)
    id_inscription = Column(Integer, ForeignKey("inscription.id_inscription"), nullable=False)
    id_frais = Column(Integer, ForeignKey("frais_scolaire.id_frais"), nullable=True)
    reference = Column(String, unique=True, nullable=False)
    date_paiement = Column(DateTime, nullable=False)
    montant = Column(Float, nullable=False)
    mode_paiement = Column(String, nullable=True)
    statut = Column(String, default="valide")
    commentaire = Column(String, nullable=True)
    id_utilisateur = Column(Integer, ForeignKey("utilisateur.id_utilisateur"), nullable=True)


class Recu(Base):
    __tablename__ = "recu"

    id_recu = Column(Integer, primary_key=True, index=True)
    id_paiement = Column(Integer, ForeignKey("paiement.id_paiement"), unique=True, nullable=False)
    numero_recu = Column(String, unique=True, nullable=False)
    date_emission = Column(DateTime, default=datetime.utcnow)
    montant = Column(Float, nullable=False)
    pdf = Column(String, nullable=True)
    imprime = Column(Boolean, default=False)
    date_impression = Column(DateTime, nullable=True)
    id_imprimeur = Column(Integer, ForeignKey("utilisateur.id_utilisateur"), nullable=True)


class Depense(Base):
    __tablename__ = "depense"

    id_depense = Column(Integer, primary_key=True, index=True)
    id_etablissement = Column(Integer, ForeignKey("etablissement.id_etablissement"), nullable=False)
    date_depense = Column(Date, nullable=False)
    categorie = Column(String, nullable=True)
    libelle = Column(String, nullable=False)
    montant = Column(Float, nullable=False)
    fournisseur = Column(String, nullable=True)
    reference_piece = Column(String, nullable=True)
    mode_paiement = Column(String, nullable=True)
    justificatif = Column(String, nullable=True)
    observation = Column(String, nullable=True)
    id_utilisateur = Column(Integer, ForeignKey("utilisateur.id_utilisateur"), nullable=True)