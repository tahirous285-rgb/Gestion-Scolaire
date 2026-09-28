from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from datetime import datetime
from app.core.database import Base


class Annonce(Base):
    __tablename__ = "annonce"

    id_annonce = Column(Integer, primary_key=True, index=True)
    id_etablissement = Column(Integer, ForeignKey("etablissement.id_etablissement"), nullable=False)
    id_auteur = Column(Integer, ForeignKey("utilisateur.id_utilisateur"), nullable=False)
    titre = Column(String, nullable=False)
    contenu = Column(String, nullable=False)
    date_publication = Column(DateTime, default=datetime.utcnow)
    date_expiration = Column(DateTime, nullable=True)
    publiee = Column(Boolean, default=True)


class Message(Base):
    __tablename__ = "message"

    id_message = Column(Integer, primary_key=True, index=True)
    id_etablissement = Column(Integer, ForeignKey("etablissement.id_etablissement"), nullable=False)
    id_expediteur = Column(Integer, ForeignKey("utilisateur.id_utilisateur"), nullable=False)
    id_destinataire = Column(Integer, ForeignKey("utilisateur.id_utilisateur"), nullable=False)
    objet = Column(String, nullable=True)
    contenu = Column(String, nullable=False)
    date_envoi = Column(DateTime, default=datetime.utcnow)
    date_lecture = Column(DateTime, nullable=True)
    lu = Column(Boolean, default=False)


class Notification(Base):
    __tablename__ = "notification"

    id_notification = Column(Integer, primary_key=True, index=True)
    id_etablissement = Column(Integer, ForeignKey("etablissement.id_etablissement"), nullable=False)
    id_utilisateur = Column(Integer, ForeignKey("utilisateur.id_utilisateur"), nullable=False)
    titre = Column(String, nullable=False)
    contenu = Column(String, nullable=True)
    type = Column(String, nullable=True)
    lien = Column(String, nullable=True)
    date_creation = Column(DateTime, default=datetime.utcnow)
    date_lecture = Column(DateTime, nullable=True)
    lue = Column(Boolean, default=False)