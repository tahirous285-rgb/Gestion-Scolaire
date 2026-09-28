from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# ---------- ETABLISSEMENT ----------
class EtablissementBase(BaseModel):
    nom: str
    code: str
    adresse: Optional[str] = None
    telephone: Optional[str] = None
    email: Optional[str] = None
    site_web: Optional[str] = None
    logo: Optional[str] = None
    devise: Optional[str] = "FCFA"
    langue: Optional[str] = "fr"
    fuseau_horaire: Optional[str] = "Africa/Bamako"
    actif: Optional[bool] = True


class EtablissementCreate(EtablissementBase):
    pass


class EtablissementUpdate(BaseModel):
    nom: Optional[str] = None
    code: Optional[str] = None
    adresse: Optional[str] = None
    telephone: Optional[str] = None
    email: Optional[str] = None
    site_web: Optional[str] = None
    logo: Optional[str] = None
    devise: Optional[str] = None
    langue: Optional[str] = None
    fuseau_horaire: Optional[str] = None
    actif: Optional[bool] = None


class EtablissementRead(EtablissementBase):
    id_etablissement: int

    class Config:
        from_attributes = True


# ---------- ROLE ----------
class RoleBase(BaseModel):
    nom: str
    code: str
    description: Optional[str] = None


class RoleCreate(RoleBase):
    pass


class RoleRead(RoleBase):
    id_role: int

    class Config:
        from_attributes = True


# ---------- PERMISSION ----------
class PermissionBase(BaseModel):
    nom: str
    code: str
    description: Optional[str] = None


class PermissionCreate(PermissionBase):
    pass


class PermissionRead(PermissionBase):
    id_permission: int

    class Config:
        from_attributes = True


# ---------- UTILISATEUR ----------
class UtilisateurBase(BaseModel):
    id_etablissement: int
    id_role: int
    nom: str
    prenom: str
    email: EmailStr
    telephone: Optional[str] = None
    login: str
    statut: Optional[str] = "actif"


class UtilisateurCreate(UtilisateurBase):
    mot_de_passe: str


class UtilisateurUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    email: Optional[EmailStr] = None
    telephone: Optional[str] = None
    statut: Optional[str] = None
    id_role: Optional[int] = None


class UtilisateurRead(UtilisateurBase):
    id_utilisateur: int
    date_creation: datetime
    date_modification: datetime

    class Config:
        from_attributes = True


# ---------- PARAMETRE ----------
class ParametreBase(BaseModel):
    id_etablissement: int
    cle: str
    valeur: Optional[str] = None
    description: Optional[str] = None


class ParametreCreate(ParametreBase):
    pass


class ParametreUpdate(BaseModel):
    valeur: Optional[str] = None
    description: Optional[str] = None


class ParametreRead(ParametreBase):
    id_parametre: int
    date_modification: datetime

    class Config:
        from_attributes = True


# ---------- JOURNAL_ACTIVITE ----------
class JournalActiviteBase(BaseModel):
    id_etablissement: int
    id_utilisateur: Optional[int] = None
    action: str
    module: Optional[str] = None
    table_cible: Optional[str] = None
    id_cible: Optional[int] = None
    ancienne_valeur: Optional[str] = None
    nouvelle_valeur: Optional[str] = None
    adresse_ip: Optional[str] = None


class JournalActiviteCreate(JournalActiviteBase):
    pass


class JournalActiviteRead(JournalActiviteBase):
    id_journal: int
    date_action: datetime

    class Config:
        from_attributes = True