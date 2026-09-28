from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


# ---------- TYPE_FRAIS ----------
class TypeFraisBase(BaseModel):
    id_etablissement: int
    code: str
    libelle: str
    description: Optional[str] = None
    actif: Optional[bool] = True


class TypeFraisCreate(TypeFraisBase):
    pass


class TypeFraisRead(TypeFraisBase):
    id_type_frais: int

    class Config:
        from_attributes = True


# ---------- FRAIS_SCOLAIRE ----------
class FraisScolaireBase(BaseModel):
    id_annee: int
    id_inscription: int
    id_type_frais: int
    montant_du: float
    date_echeance: Optional[date] = None
    obligatoire: Optional[bool] = True
    description: Optional[str] = None


class FraisScolaireCreate(FraisScolaireBase):
    pass


class FraisScolaireRead(FraisScolaireBase):
    id_frais: int

    class Config:
        from_attributes = True


# ---------- PAIEMENT ----------
class PaiementBase(BaseModel):
    id_inscription: int
    id_frais: Optional[int] = None
    reference: str
    date_paiement: datetime
    montant: float
    mode_paiement: Optional[str] = None
    commentaire: Optional[str] = None
    id_utilisateur: Optional[int] = None


class PaiementCreate(PaiementBase):
    pass


class PaiementRead(PaiementBase):
    id_paiement: int
    statut: str

    class Config:
        from_attributes = True


# ---------- RECU ----------
class RecuRead(BaseModel):
    id_recu: int
    id_paiement: int
    numero_recu: str
    date_emission: datetime
    montant: float
    pdf: Optional[str] = None
    imprime: bool
    date_impression: Optional[datetime] = None
    id_imprimeur: Optional[int] = None

    class Config:
        from_attributes = True


# ---------- DEPENSE ----------
class DepenseBase(BaseModel):
    id_etablissement: int
    date_depense: date
    categorie: Optional[str] = None
    libelle: str
    montant: float
    fournisseur: Optional[str] = None
    reference_piece: Optional[str] = None
    mode_paiement: Optional[str] = None
    justificatif: Optional[str] = None
    observation: Optional[str] = None
    id_utilisateur: Optional[int] = None


class DepenseCreate(DepenseBase):
    pass


class DepenseRead(DepenseBase):
    id_depense: int

    class Config:
        from_attributes = True