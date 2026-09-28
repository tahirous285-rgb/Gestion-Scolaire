from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class CarteScolaireBase(BaseModel):
    id_inscription: int
    date_expiration: Optional[date] = None
    id_generateur: Optional[int] = None


class CarteScolaireCreate(CarteScolaireBase):
    pass


class CarteScolaireRead(CarteScolaireBase):
    id_carte: int
    numero_carte: str
    date_generation: datetime
    statut: str
    qr_token: str
    fichier: Optional[str] = None
    nombre_reeditions: int
    derniere_impression: Optional[datetime] = None

    class Config:
        from_attributes = True