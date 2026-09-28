from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ---------- ANNONCE ----------
class AnnonceBase(BaseModel):
    id_etablissement: int
    id_auteur: int
    titre: str
    contenu: str
    date_expiration: Optional[datetime] = None
    publiee: Optional[bool] = True


class AnnonceCreate(AnnonceBase):
    pass


class AnnonceRead(AnnonceBase):
    id_annonce: int
    date_publication: datetime

    class Config:
        from_attributes = True


# ---------- MESSAGE ----------
class MessageBase(BaseModel):
    id_etablissement: int
    id_expediteur: int
    id_destinataire: int
    objet: Optional[str] = None
    contenu: str


class MessageCreate(MessageBase):
    pass


class MessageRead(MessageBase):
    id_message: int
    date_envoi: datetime
    date_lecture: Optional[datetime] = None
    lu: bool

    class Config:
        from_attributes = True


# ---------- NOTIFICATION ----------
class NotificationBase(BaseModel):
    id_etablissement: int
    id_utilisateur: int
    titre: str
    contenu: Optional[str] = None
    type: Optional[str] = None
    lien: Optional[str] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationRead(NotificationBase):
    id_notification: int
    date_creation: datetime
    date_lecture: Optional[datetime] = None
    lue: bool

    class Config:
        from_attributes = True