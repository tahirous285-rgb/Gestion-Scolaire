from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


# ---------- PRESENCE_ENSEIGNANT ----------
class PresenceEnseignantBase(BaseModel):
    id_enseignant: int
    id_annee: int
    date_presence: date
    heure_arrivee: Optional[str] = None
    heure_depart: Optional[str] = None
    statut: str
    motif: Optional[str] = None
    justification: Optional[str] = None
    justificatif: Optional[str] = None
    validee: Optional[bool] = False
    id_validateur: Optional[int] = None
    observation: Optional[str] = None


class PresenceEnseignantCreate(PresenceEnseignantBase):
    pass


class PresenceEnseignantUpdate(BaseModel):
    heure_arrivee: Optional[str] = None
    heure_depart: Optional[str] = None
    statut: Optional[str] = None
    motif: Optional[str] = None
    justification: Optional[str] = None
    justificatif: Optional[str] = None
    validee: Optional[bool] = None
    id_validateur: Optional[int] = None
    observation: Optional[str] = None


class PresenceEnseignantRead(PresenceEnseignantBase):
    id_presence: int
    date_validation: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---------- COURS_EFFECTUE ----------
class CoursEffectueBase(BaseModel):
    id_annee: int
    id_enseignant: int
    id_classe: int
    id_matiere: int
    date_cours: date
    heures_prevues: Optional[float] = None
    heures_effectuees: Optional[float] = None
    statut: Optional[str] = "effectue"
    observation: Optional[str] = None
    id_utilisateur: Optional[int] = None


class CoursEffectueCreate(CoursEffectueBase):
    pass


class CoursEffectueRead(CoursEffectueBase):
    id_cours: int

    class Config:
        from_attributes = True


# ---------- OBSERVATION_ENSEIGNANT ----------
class ObservationEnseignantBase(BaseModel):
    id_enseignant: int
    id_auteur: int
    date_observation: Optional[date] = None
    contenu: str
    confidentialite: Optional[str] = "interne"


class ObservationEnseignantCreate(ObservationEnseignantBase):
    pass


class ObservationEnseignantRead(ObservationEnseignantBase):
    id_observation: int
    date_creation: datetime
    date_modification: datetime

    class Config:
        from_attributes = True