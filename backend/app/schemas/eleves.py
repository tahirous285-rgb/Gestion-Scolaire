from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


# ---------- ELEVE ----------
class EleveBase(BaseModel):
    id_etablissement: int
    matricule: str
    nom: str
    prenom: str
    sexe: Optional[str] = None
    date_naissance: Optional[date] = None
    lieu_naissance: Optional[str] = None
    nationalite: Optional[str] = None
    adresse: Optional[str] = None
    telephone: Optional[str] = None
    email: Optional[str] = None
    photo: Optional[str] = None
    actif: Optional[bool] = True


class EleveCreate(EleveBase):
    pass


class EleveUpdate(BaseModel):
    matricule: Optional[str] = None
    nom: Optional[str] = None
    prenom: Optional[str] = None
    sexe: Optional[str] = None
    date_naissance: Optional[date] = None
    lieu_naissance: Optional[str] = None
    nationalite: Optional[str] = None
    adresse: Optional[str] = None
    telephone: Optional[str] = None
    email: Optional[str] = None
    photo: Optional[str] = None
    actif: Optional[bool] = None


class EleveRead(EleveBase):
    id_eleve: int
    date_creation: datetime
    date_modification: datetime

    class Config:
        from_attributes = True


# ---------- PARENT ----------
class ParentBase(BaseModel):
    id_etablissement: int
    nom: str
    prenom: str
    telephone: Optional[str] = None
    telephone_secondaire: Optional[str] = None
    email: Optional[str] = None
    adresse: Optional[str] = None
    profession: Optional[str] = None


class ParentCreate(ParentBase):
    pass


class ParentUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    telephone: Optional[str] = None
    telephone_secondaire: Optional[str] = None
    email: Optional[str] = None
    adresse: Optional[str] = None
    profession: Optional[str] = None


class ParentRead(ParentBase):
    id_parent: int

    class Config:
        from_attributes = True


# ---------- ELEVE_PARENT ----------
class EleveParentBase(BaseModel):
    id_eleve: int
    id_parent: int
    lien_parente: Optional[str] = None
    est_responsable: Optional[bool] = False
    est_contact_urgence: Optional[bool] = False


class EleveParentCreate(EleveParentBase):
    pass


class EleveParentRead(EleveParentBase):
    class Config:
        from_attributes = True


# ---------- INSCRIPTION ----------
class InscriptionBase(BaseModel):
    id_eleve: int
    id_annee: int
    id_classe: int
    numero_inscription: Optional[str] = None
    date_inscription: Optional[date] = None
    statut: Optional[str] = "active"
    redoublant: Optional[bool] = False
    observation: Optional[str] = None


class InscriptionCreate(InscriptionBase):
    pass


class InscriptionUpdate(BaseModel):
    id_classe: Optional[int] = None
    numero_inscription: Optional[str] = None
    statut: Optional[str] = None
    redoublant: Optional[bool] = None
    observation: Optional[str] = None


class InscriptionRead(InscriptionBase):
    id_inscription: int

    class Config:
        from_attributes = True