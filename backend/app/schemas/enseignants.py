from pydantic import BaseModel
from typing import Optional
from datetime import date


# ---------- ENSEIGNANT ----------
class EnseignantBase(BaseModel):
    id_etablissement: int
    matricule: str
    nom: str
    prenom: str
    sexe: Optional[str] = None
    date_naissance: Optional[date] = None
    telephone: Optional[str] = None
    email: Optional[str] = None
    adresse: Optional[str] = None
    date_embauche: Optional[date] = None
    statut: Optional[str] = "actif"
    taux_horaire: Optional[float] = None
    actif: Optional[bool] = True


class EnseignantCreate(EnseignantBase):
    pass


class EnseignantUpdate(BaseModel):
    matricule: Optional[str] = None
    nom: Optional[str] = None
    prenom: Optional[str] = None
    sexe: Optional[str] = None
    date_naissance: Optional[date] = None
    telephone: Optional[str] = None
    email: Optional[str] = None
    adresse: Optional[str] = None
    statut: Optional[str] = None
    taux_horaire: Optional[float] = None
    actif: Optional[bool] = None


class EnseignantRead(EnseignantBase):
    id_enseignant: int

    class Config:
        from_attributes = True


# ---------- ENSEIGNANT_MATIERE ----------
class EnseignantMatiereBase(BaseModel):
    id_enseignant: int
    id_matiere: int
    principal: Optional[bool] = False


class EnseignantMatiereCreate(EnseignantMatiereBase):
    pass


class EnseignantMatiereRead(EnseignantMatiereBase):
    class Config:
        from_attributes = True


# ---------- ENSEIGNANT_CLASSE ----------
class EnseignantClasseBase(BaseModel):
    id_enseignant: int
    id_classe: int
    id_annee: int
    principal: Optional[bool] = False


class EnseignantClasseCreate(EnseignantClasseBase):
    pass


class EnseignantClasseRead(EnseignantClasseBase):
    class Config:
        from_attributes = True