from sqlalchemy import Column, Integer, String, Boolean, Date, Float, ForeignKey, UniqueConstraint
from app.core.database import Base


class Enseignant(Base):
    __tablename__ = "enseignant"

    id_enseignant = Column(Integer, primary_key=True, index=True)
    id_etablissement = Column(Integer, ForeignKey("etablissement.id_etablissement"), nullable=False)
    matricule = Column(String, nullable=False)
    nom = Column(String, nullable=False)
    prenom = Column(String, nullable=False)
    sexe = Column(String, nullable=True)
    date_naissance = Column(Date, nullable=True)
    telephone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    adresse = Column(String, nullable=True)
    date_embauche = Column(Date, nullable=True)
    statut = Column(String, default="actif")
    taux_horaire = Column(Float, nullable=True)
    actif = Column(Boolean, default=True)

    __table_args__ = (
        UniqueConstraint("id_etablissement", "matricule", name="uq_etab_matricule_enseignant"),
    )


class EnseignantMatiere(Base):
    __tablename__ = "enseignant_matiere"

    id_enseignant = Column(Integer, ForeignKey("enseignant.id_enseignant"), primary_key=True)
    id_matiere = Column(Integer, ForeignKey("matiere.id_matiere"), primary_key=True)
    principal = Column(Boolean, default=False)


class EnseignantClasse(Base):
    __tablename__ = "enseignant_classe"

    id_enseignant = Column(Integer, ForeignKey("enseignant.id_enseignant"), primary_key=True)
    id_classe = Column(Integer, ForeignKey("classe.id_classe"), primary_key=True)
    id_annee = Column(Integer, ForeignKey("annee_scolaire.id_annee"), primary_key=True)
    principal = Column(Boolean, default=False)