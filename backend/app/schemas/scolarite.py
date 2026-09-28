from pydantic import BaseModel
from typing import Optional
from datetime import date


# ---------- ANNEE SCOLAIRE ----------
class AnneeScolaireBase(BaseModel):
    id_etablissement: int
    libelle: str
    date_debut: date
    date_fin: date
    statut: Optional[str] = "active"


class AnneeScolaireCreate(AnneeScolaireBase):
    pass


class AnneeScolaireRead(AnneeScolaireBase):
    id_annee: int

    class Config:
        from_attributes = True


# ---------- PERIODE ----------
class PeriodeBase(BaseModel):
    id_annee: int
    code: str
    libelle: str
    ordre: int
    date_debut: date
    date_fin: date


class PeriodeCreate(PeriodeBase):
    pass


class PeriodeRead(PeriodeBase):
    id_periode: int

    class Config:
        from_attributes = True


# ---------- CLASSE ----------
class ClasseBase(BaseModel):
    id_etablissement: int
    nom: str
    niveau: Optional[str] = None
    capacite: Optional[int] = None
    salle: Optional[str] = None
    actif: Optional[bool] = True


class ClasseCreate(ClasseBase):
    pass


class ClasseUpdate(BaseModel):
    nom: Optional[str] = None
    niveau: Optional[str] = None
    capacite: Optional[int] = None
    salle: Optional[str] = None
    actif: Optional[bool] = None


class ClasseRead(ClasseBase):
    id_classe: int

    class Config:
        from_attributes = True


# ---------- MATIERE ----------
class MatiereBase(BaseModel):
    id_etablissement: int
    code: str
    nom: str
    description: Optional[str] = None
    actif: Optional[bool] = True


class MatiereCreate(MatiereBase):
    pass


class MatiereUpdate(BaseModel):
    code: Optional[str] = None
    nom: Optional[str] = None
    description: Optional[str] = None
    actif: Optional[bool] = None


class MatiereRead(MatiereBase):
    id_matiere: int

    class Config:
        from_attributes = True


# ---------- CLASSE_MATIERE ----------
class ClasseMatiereBase(BaseModel):
    id_classe: int
    id_matiere: int
    coefficient: Optional[int] = None
    volume_horaire: Optional[int] = None


class ClasseMatiereCreate(ClasseMatiereBase):
    pass


class ClasseMatiereRead(ClasseMatiereBase):
    class Config:
        from_attributes = True