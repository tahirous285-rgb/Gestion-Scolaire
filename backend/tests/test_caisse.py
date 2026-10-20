from datetime import date, datetime, timedelta
from decimal import Decimal

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.crud import caisse as caisse_crud
from app.crud import finance as finance_crud
from app.crud import honoraires as honoraires_crud
from app.models.administration import Etablissement, Role, Utilisateur
from app.models.caisse import Caisse, ClotureCaisse, MouvementCaisse
from app.models.eleves import Eleve, Inscription
from app.models.enseignants import Enseignant
from app.models.finance import Depense, FraisScolaire, Paiement, Recu, TypeFrais
from app.models.honoraires import Honoraire, Mois, PaiementHonoraire
from app.models.scolarite import AnneeScolaire, Classe
from app.schemas.caisse import CaisseCloturer, CaisseInitialiser, CaisseReouvrir
from app.schemas.finance import DepenseCreate, PaiementCreate
from app.schemas.honoraires import PaiementHonoraireCreate


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine, autoflush=False, autocommit=False)()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture
def data(db):
    school = Etablissement(nom="École A", code="A")
    role = Role(nom="Gestionnaire", code="GEST")
    db.add_all([school, role])
    db.flush()
    user = Utilisateur(
        id_etablissement=school.id_etablissement,
        id_role=role.id_role,
        nom="Test",
        prenom="User",
        email="user@example.test",
        login="user",
        mot_de_passe_hash="hash",
    )
    eleve = Eleve(id_etablissement=school.id_etablissement, matricule="E1", nom="Élève", prenom="Test")
    annee = AnneeScolaire(
        id_etablissement=school.id_etablissement,
        libelle="2026-2027",
        date_debut=date(2026, 9, 1),
        date_fin=date(2027, 7, 1),
    )
    classe = Classe(id_etablissement=school.id_etablissement, nom="CP1")
    enseignant = Enseignant(id_etablissement=school.id_etablissement, matricule="P1", nom="Prof", prenom="Test")
    mois = Mois(numero=10, libelle="Octobre")
    db.add_all([user, eleve, annee, classe, enseignant, mois])
    db.flush()
    inscription = Inscription(id_eleve=eleve.id_eleve, id_annee=annee.id_annee, id_classe=classe.id_classe)
    frais_inscription_type = TypeFrais(
        id_etablissement=school.id_etablissement, code="INSCRIPTION", libelle="Frais d'inscription"
    )
    frais_autre_type = TypeFrais(
        id_etablissement=school.id_etablissement, code="SCOLARITE", libelle="Frais de scolarité"
    )
    db.add_all([inscription, frais_inscription_type, frais_autre_type])
    db.flush()
    frais_inscription = FraisScolaire(
        id_annee=annee.id_annee,
        id_inscription=inscription.id_inscription,
        id_type_frais=frais_inscription_type.id_type_frais,
        montant_du=Decimal("100000"),
    )
    frais_autre = FraisScolaire(
        id_annee=annee.id_annee,
        id_inscription=inscription.id_inscription,
        id_type_frais=frais_autre_type.id_type_frais,
        montant_du=Decimal("50000"),
    )
    db.add_all([frais_inscription, frais_autre])
    honoraire = Honoraire(
        id_enseignant=enseignant.id_enseignant,
        id_annee=annee.id_annee,
        id_mois=mois.id_mois,
        heures_effectuees=10,
        taux_horaire=1000,
        montant_brut=10000,
        retenues=0,
        montant_net=10000,
        montant_paye=0,
        solde=10000,
    )
    db.add(honoraire)
    db.commit()
    return {
        "school": school,
        "user": user,
        "inscription": inscription,
        "frais_inscription": frais_inscription,
        "frais_autre": frais_autre,
        "enseignant": enseignant,
        "honoraire": honoraire,
    }


def init_cash(db, user):
    return caisse_crud.initialiser(
        db,
        CaisseInitialiser(
            id_etablissement=user.id_etablissement,
            solde_initial=Decimal("100000"),
            date_debut_suivi=date.today() - timedelta(days=2),
        ),
        user,
    )


def create_payment(data, *, fee_id, mode="Espèces", reference="P-1", amount=1500):
    return PaiementCreate(
        id_inscription=data["inscription"].id_inscription,
        id_frais=fee_id,
        reference=reference,
        date_paiement=datetime.now(),
        montant=Decimal(amount),
        mode_paiement=mode,
    )


def test_cash_registration_payment_creates_one_entry_and_receipt(db, data):
    init_cash(db, data["user"])
    finance_crud.create_paiement(db, create_payment(data, fee_id=data["frais_inscription"].id_frais), data["user"])

    rows = db.query(MouvementCaisse).all()
    assert len(rows) == 1
    assert rows[0].sens == "entree"
    assert rows[0].categorie == "frais_inscription"
    assert db.query(Recu).count() == 1


def test_non_registration_school_payment_does_not_create_cash_movement(db, data):
    init_cash(db, data["user"])
    finance_crud.create_paiement(db, create_payment(data, fee_id=data["frais_autre"].id_frais), data["user"])

    assert db.query(Paiement).count() == 1
    assert db.query(MouvementCaisse).count() == 0


def test_bank_payment_does_not_change_cash_balance(db, data):
    init_cash(db, data["user"])
    finance_crud.create_paiement(
        db,
        create_payment(data, fee_id=data["frais_inscription"].id_frais, mode="Banque"),
        data["user"],
    )

    assert db.query(MouvementCaisse).count() == 0
    assert caisse_crud.resume(db, data["user"].id_etablissement, data["user"])["solde_theorique"] == Decimal("100000.00")


def test_cash_honorarium_payment_creates_exit_and_updates_balance(db, data):
    init_cash(db, data["user"])
    honoraires_crud.create_paiement_honoraire(
        db,
        PaiementHonoraireCreate(
            id_honoraire=data["honoraire"].id_honoraire,
            reference="H-1",
            date_paiement=datetime.now(),
            montant=Decimal("2000"),
            mode_paiement="Cash",
        ),
        data["user"],
    )

    db.refresh(data["honoraire"])
    movement = db.query(MouvementCaisse).one()
    assert movement.sens == "sortie"
    assert movement.categorie == "honoraire"
    assert data["honoraire"].montant_paye == 2000
    assert data["honoraire"].solde == 8000


def test_cash_expense_creates_exit_and_other_mode_does_not(db, data):
    init_cash(db, data["user"])
    for ref, mode in (("D-1", "Caisse"), ("D-2", "Mobile Money")):
        finance_crud.create_depense(
            db,
            DepenseCreate(
                id_etablissement=data["school"].id_etablissement,
                date_depense=date.today(),
                libelle="Fournitures",
                montant=Decimal("500"),
                mode_paiement=mode,
                reference_piece=ref,
            ),
            data["user"],
        )

    assert db.query(Depense).count() == 2
    assert db.query(MouvementCaisse).count() == 1
    assert db.query(MouvementCaisse).one().categorie == "depense"


def test_failed_movement_rolls_back_source_payment_and_receipt(db, data, monkeypatch):
    init_cash(db, data["user"])

    def fail(*args, **kwargs):
        raise HTTPException(status_code=409, detail="Échec du mouvement")

    monkeypatch.setattr(finance_crud, "ajouter_mouvement_especes", fail)
    with pytest.raises(HTTPException):
        finance_crud.create_paiement(
            db,
            create_payment(data, fee_id=data["frais_inscription"].id_frais),
            data["user"],
        )

    assert db.query(Paiement).count() == 0
    assert db.query(Recu).count() == 0
    assert db.query(MouvementCaisse).count() == 0


def test_user_cannot_access_other_school_cash(db, data):
    with pytest.raises(HTTPException) as error:
        caisse_crud.resume(db, data["user"].id_etablissement + 1, data["user"])

    assert error.value.status_code == 403


def test_closure_calculates_difference_and_blocks_until_reopened(db, data):
    init_cash(db, data["user"])
    payment = create_payment(data, fee_id=data["frais_inscription"].id_frais)
    finance_crud.create_paiement(db, payment, data["user"])
    close_date = payment.date_paiement.date()
    closure = caisse_crud.creer_cloture(
        db,
        CaisseCloturer(
            id_etablissement=data["school"].id_etablissement,
            date_cloture=close_date,
            solde_compte=Decimal("102000"),
            commentaire="Comptage",
        ),
        data["user"],
    )
    assert closure.solde_theorique == Decimal("101500.00")
    assert closure.ecart == Decimal("500.00")

    with pytest.raises(HTTPException) as error:
        finance_crud.create_depense(
            db,
            DepenseCreate(
                id_etablissement=data["school"].id_etablissement,
                date_depense=close_date,
                libelle="Dépense rétroactive",
                montant=Decimal("100"),
                mode_paiement="Espèces",
            ),
            data["user"],
        )
    assert error.value.status_code == 409

    caisse_crud.reouvrir_cloture(db, closure.id_cloture_caisse, CaisseReouvrir(motif_reouverture="Erreur de comptage"), data["user"])
    expense = finance_crud.create_depense(
        db,
        DepenseCreate(
            id_etablissement=data["school"].id_etablissement,
            date_depense=close_date,
            libelle="Dépense rétroactive corrigée",
            montant=Decimal("100"),
            mode_paiement="Espèces",
        ),
        data["user"],
    )
    assert expense.id_depense


def test_initialization_cannot_be_repeated(db, data):
    init_cash(db, data["user"])
    with pytest.raises(HTTPException) as error:
        init_cash(db, data["user"])
    assert error.value.status_code == 409