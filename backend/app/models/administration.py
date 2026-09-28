from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Etablissement(Base):
    __tablename__ = "etablissement"

    id_etablissement = Column(Integer, primary_key=True, index=True)
    nom = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    adresse = Column(String, nullable=True)
    telephone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    site_web = Column(String, nullable=True)
    logo = Column(String, nullable=True)
    devise = Column(String, nullable=True, default="FCFA")
    langue = Column(String, nullable=True, default="fr")
    fuseau_horaire = Column(String, nullable=True, default="Africa/Bamako")
    actif = Column(Boolean, default=True)


class Role(Base):
    __tablename__ = "role"

    id_role = Column(Integer, primary_key=True, index=True)
    nom = Column(String, unique=True, nullable=False)
    code = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)

    permissions = relationship("RolePermission", back_populates="role")


class Permission(Base):
    __tablename__ = "permission"

    id_permission = Column(Integer, primary_key=True, index=True)
    nom = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)


class RolePermission(Base):
    __tablename__ = "role_permission"

    id_role = Column(Integer, ForeignKey("role.id_role"), primary_key=True)
    id_permission = Column(Integer, ForeignKey("permission.id_permission"), primary_key=True)

    role = relationship("Role", back_populates="permissions")
    permission = relationship("Permission")


class Utilisateur(Base):
    __tablename__ = "utilisateur"

    id_utilisateur = Column(Integer, primary_key=True, index=True)
    id_etablissement = Column(Integer, ForeignKey("etablissement.id_etablissement"), nullable=False)
    id_role = Column(Integer, ForeignKey("role.id_role"), nullable=False)
    nom = Column(String, nullable=False)
    prenom = Column(String, nullable=False)
    email = Column(String, nullable=False)
    telephone = Column(String, nullable=True)
    login = Column(String, nullable=False)
    mot_de_passe_hash = Column(String, nullable=False)
    statut = Column(String, default="actif")
    derniere_connexion = Column(DateTime, nullable=True)
    date_creation = Column(DateTime, default=datetime.utcnow)
    date_modification = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    etablissement = relationship("Etablissement")
    role = relationship("Role")

    __table_args__ = (
        UniqueConstraint("id_etablissement", "email", name="uq_etab_email"),
        UniqueConstraint("id_etablissement", "login", name="uq_etab_login"),
    )


class Parametre(Base):
    __tablename__ = "parametre"

    id_parametre = Column(Integer, primary_key=True, index=True)
    id_etablissement = Column(Integer, ForeignKey("etablissement.id_etablissement"), nullable=False)
    cle = Column(String, nullable=False)
    valeur = Column(String, nullable=True)
    description = Column(String, nullable=True)
    date_modification = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("id_etablissement", "cle", name="uq_etab_cle_parametre"),
    )


class JournalActivite(Base):
    __tablename__ = "journal_activite"

    id_journal = Column(Integer, primary_key=True, index=True)
    id_etablissement = Column(Integer, ForeignKey("etablissement.id_etablissement"), nullable=False)
    id_utilisateur = Column(Integer, ForeignKey("utilisateur.id_utilisateur"), nullable=True)
    action = Column(String, nullable=False)
    module = Column(String, nullable=True)
    table_cible = Column(String, nullable=True)
    id_cible = Column(Integer, nullable=True)
    ancienne_valeur = Column(String, nullable=True)
    nouvelle_valeur = Column(String, nullable=True)
    adresse_ip = Column(String, nullable=True)
    date_action = Column(DateTime, default=datetime.utcnow)