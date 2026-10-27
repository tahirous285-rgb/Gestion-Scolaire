from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date, datetime


# ---------- EVALUATION ----------
class EvaluationBase(BaseModel):
    id_annee: int
    id_periode: int
    id_classe: int
    id_matiere: int
    id_enseignant: int
    libelle: str
    type_evaluation: Optional[str] = None
    date_evaluation: Optional[date] = None
    bareme: float = 20
    coefficient: float = 1
    observation: Optional[str] = None
    notes_validees: bool = False


class EvaluationCreate(EvaluationBase):
    pass


class EvaluationRead(EvaluationBase):
    id_evaluation: int

    class Config:
        from_attributes = True


# ---------- NOTE ----------
class NoteBase(BaseModel):
    id_evaluation: int
    id_inscription: int
    valeur: Optional[float] = None
    absence: Optional[bool] = False
    observation: Optional[str] = None


class NoteCreate(NoteBase):
    pass


class NoteUpdate(BaseModel):
    valeur: Optional[float] = None
    absence: Optional[bool] = None
    observation: Optional[str] = None


class NoteRead(NoteBase):
    id_note: int
    date_creation: datetime
    date_modification: datetime

    class Config:
        from_attributes = True


class NoteSaisieEntry(BaseModel):
    id_inscription: int
    valeur: Optional[float] = None
    absence: bool = False


class NoteSaisieRequest(BaseModel):
    notes: list[NoteSaisieEntry]
    valider: bool = False


class NoteSaisieResponse(BaseModel):
    notes: list[NoteRead]
    notes_validees: bool


# ---------- PRESENCE_ELEVE ----------
class PresenceEleveBase(BaseModel):
    id_inscription: int
    id_matiere: Optional[int] = None
    date_presence: date
    statut: str
    heure_arrivee: Optional[str] = None
    heure_depart: Optional[str] = None
    motif: Optional[str] = None
    justifiee: Optional[bool] = False
    observation: Optional[str] = None
    id_utilisateur: Optional[int] = None


class PresenceEleveCreate(PresenceEleveBase):
    pass


class PresenceEleveUpdate(BaseModel):
    statut: Optional[str] = None
    heure_arrivee: Optional[str] = None
    heure_depart: Optional[str] = None
    motif: Optional[str] = None
    justifiee: Optional[bool] = None
    observation: Optional[str] = None


class PresenceEleveRead(PresenceEleveBase):
    id_presence: int

    class Config:
        from_attributes = True


class PresenceAppelEntry(BaseModel):
    id_inscription: int
    statut: str
    motif: Optional[str] = None
    justifiee: bool = False
    observation: Optional[str] = None


class PresenceAppelRequest(BaseModel):
    id_annee: int
    id_classe: int
    id_matiere: int
    date_presence: date
    id_utilisateur: Optional[int] = None
    presences: list[PresenceAppelEntry]


class PresenceAppelResponse(BaseModel):
    presences: list[PresenceEleveRead]
    enregistrees: int


# ---------- BULLETIN ----------
class BulletinBase(BaseModel):
    id_inscription: int
    id_periode: int
    moyenne_generale: Optional[float] = None
    rang: Optional[int] = None
    appreciation: Optional[str] = None
    decision: Optional[str] = None
    valide: Optional[bool] = False
    id_validateur: Optional[int] = None


class BulletinCreate(BulletinBase):
    pass


class BulletinUpdate(BaseModel):
    moyenne_generale: Optional[float] = None
    rang: Optional[int] = None
    appreciation: Optional[str] = None
    decision: Optional[str] = None
    valide: Optional[bool] = None
    id_validateur: Optional[int] = None


class BulletinRead(BulletinBase):
    id_bulletin: int
    date_generation: Optional[datetime] = None
    pdf: Optional[str] = None
    date_creation: datetime

    class Config:
        from_attributes = True