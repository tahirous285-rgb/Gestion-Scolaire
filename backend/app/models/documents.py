from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, ForeignKey
from datetime import datetime
from app.core.database import Base


class CarteScolaire(Base):
    __tablename__ = "carte_scolaire"

    id_carte = Column(Integer, primary_key=True, index=True)
    id_inscription = Column(Integer, ForeignKey("inscription.id_inscription"), nullable=False)
    numero_carte = Column(String, unique=True, nullable=False)
    date_generation = Column(DateTime, default=datetime.utcnow)
    date_expiration = Column(Date, nullable=True)
    statut = Column(String, default="active")
    qr_token = Column(String, unique=True, nullable=False)
    fichier = Column(String, nullable=True)
    nombre_reeditions = Column(Integer, default=0)
    derniere_impression = Column(DateTime, nullable=True)
    id_generateur = Column(Integer, ForeignKey("utilisateur.id_utilisateur"), nullable=True)