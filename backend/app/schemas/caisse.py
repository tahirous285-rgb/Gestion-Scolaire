from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class CaisseInitialiser(BaseModel):
    id_etablissement: int = Field(gt=0)
    solde_initial: Decimal = Field(ge=0, max_digits=14, decimal_places=2)
    date_debut_suivi: date


class CaisseCloturer(BaseModel):
    id_etablissement: int = Field(gt=0)
    date_cloture: date
    solde_compte: Decimal = Field(ge=0, max_digits=14, decimal_places=2)
    commentaire: str | None = None


class CaisseReouvrir(BaseModel):
    motif_reouverture: str = Field(min_length=1, max_length=2000)


class MouvementCaisseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_mouvement_caisse: int
    id_caisse: int
    date_mouvement: datetime
    sens: Literal["entree", "sortie"]
    categorie: Literal["frais_inscription", "honoraire", "depense"]
    libelle: str
    montant: Decimal
    mode_paiement: str
    source_type: str
    source_id: int
    id_utilisateur: int | None
    commentaire: str | None


class ClotureCaisseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_cloture_caisse: int
    id_caisse: int
    date_cloture: date
    solde_theorique: Decimal
    solde_compte: Decimal
    ecart: Decimal
    statut: Literal["cloturee", "reouverte"]
    commentaire: str | None
    motif_reouverture: str | None
    id_utilisateur: int
    date_creation: datetime
    date_reouverture: datetime | None


class CaisseResume(BaseModel):
    id_caisse: int | None
    id_etablissement: int
    initialisee: bool
    solde_initial: Decimal
    date_debut_suivi: date | None
    date_jour: date
    solde_theorique: Decimal
    total_entrees_jour: Decimal
    total_sorties_jour: Decimal


class CaisseSynchronisationResultat(BaseModel):
    importes: int
    doublons_ignores: int
    hors_periode: int
    ignores_journee_cloturee: int