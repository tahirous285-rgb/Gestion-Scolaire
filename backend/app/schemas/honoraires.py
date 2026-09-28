from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ---------- MOIS ----------
class MoisBase(BaseModel):
    numero: int
    libelle: str


class MoisCreate(MoisBase):
    pass


class MoisRead(MoisBase):
    id_mois: int

    class Config:
        from_attributes = True


# ---------- HONORAIRE ----------
class HonoraireBase(BaseModel):
    id_enseignant: int
    id_annee: int
    id_mois: int
    heures_prevues: Optional[float] = None
    heures_effectuees: Optional[float] = None
    taux_horaire: float
    retenues: Optional[float] = 0


class HonoraireCreate(HonoraireBase):
    pass


class HonoraireUpdate(BaseModel):
    heures_effectuees: Optional[float] = None
    retenues: Optional[float] = None
    statut: Optional[str] = None
    id_validateur: Optional[int] = None
    observation: Optional[str] = None


class HonoraireRead(HonoraireBase):
    id_honoraire: int
    montant_brut: float
    montant_net: float
    montant_paye: float
    solde: float
    statut: str
    date_calcul: datetime
    id_validateur: Optional[int] = None
    date_validation: Optional[datetime] = None
    observation: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- PAIEMENT_HONORAIRE ----------
class PaiementHonoraireBase(BaseModel):
    id_honoraire: int
    reference: str
    date_paiement: datetime
    montant: float
    mode_paiement: Optional[str] = None
    commentaire: Optional[str] = None
    id_utilisateur: Optional[int] = None


class PaiementHonoraireCreate(PaiementHonoraireBase):
    pass


class PaiementHonoraireRead(PaiementHonoraireBase):
    id_paiement_honoraire: int
    statut: str

    class Config:
        from_attributes = True