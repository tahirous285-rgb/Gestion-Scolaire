from pydantic import BaseModel
from typing import Optional


class EmploiTempsBase(BaseModel):
    id_annee: int
    id_classe: int
    id_enseignant: int
    id_matiere: int
    jour_semaine: str
    heure_debut: str
    heure_fin: str
    salle: Optional[str] = None
    observation: Optional[str] = None


class EmploiTempsCreate(EmploiTempsBase):
    pass


class EmploiTempsUpdate(BaseModel):
    id_enseignant: Optional[int] = None
    id_matiere: Optional[int] = None
    jour_semaine: Optional[str] = None
    heure_debut: Optional[str] = None
    heure_fin: Optional[str] = None
    salle: Optional[str] = None
    observation: Optional[str] = None


class EmploiTempsRead(EmploiTempsBase):
    id_emploi: int

    class Config:
        from_attributes = True