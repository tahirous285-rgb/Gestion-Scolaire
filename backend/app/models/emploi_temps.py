from sqlalchemy import Column, Integer, String, ForeignKey
from app.core.database import Base


class EmploiTemps(Base):
    __tablename__ = "emploi_temps"

    id_emploi = Column(Integer, primary_key=True, index=True)
    id_annee = Column(Integer, ForeignKey("annee_scolaire.id_annee"), nullable=False)
    id_classe = Column(Integer, ForeignKey("classe.id_classe"), nullable=False)
    id_enseignant = Column(Integer, ForeignKey("enseignant.id_enseignant"), nullable=False)
    id_matiere = Column(Integer, ForeignKey("matiere.id_matiere"), nullable=False)
    jour_semaine = Column(String, nullable=False)  # Lundi, Mardi, ...
    heure_debut = Column(String, nullable=False)
    heure_fin = Column(String, nullable=False)
    salle = Column(String, nullable=True)
    observation = Column(String, nullable=True)