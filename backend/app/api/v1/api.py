from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user
from app.api.v1.endpoints import (
    auth,
    etablissements, roles, utilisateurs,
    annees_scolaires, periodes, classes, matieres,
    eleves, parents, inscriptions,
    enseignants,
    evaluations, notes, presences_eleves, bulletins,
    emploi_temps,
    presences_enseignants, cours_effectues, observations_enseignants,
    honoraires,
    frais_scolaires, paiements, recus, depenses,
    cartes_scolaires,
    communication,
    parametres,
    dashboard,
    journal
)

api_router = APIRouter()

# Route publique : pas de protection (il faut pouvoir se connecter sans token)
api_router.include_router(auth.router, prefix="/auth", tags=["Authentification"])

# Toutes les routes ci-dessous exigent un token valide (Authorization: Bearer <token>)
protected = [Depends(get_current_user)]

api_router.include_router(etablissements.router, prefix="/etablissements", tags=["Établissements"], dependencies=protected)
api_router.include_router(roles.router, prefix="/roles", tags=["Rôles"], dependencies=protected)
api_router.include_router(utilisateurs.router, prefix="/utilisateurs", tags=["Utilisateurs"], dependencies=protected)
api_router.include_router(annees_scolaires.router, prefix="/annees-scolaires", tags=["Années scolaires"], dependencies=protected)
api_router.include_router(periodes.router, prefix="/periodes", tags=["Périodes"], dependencies=protected)
api_router.include_router(classes.router, prefix="/classes", tags=["Classes"], dependencies=protected)
api_router.include_router(matieres.router, prefix="/matieres", tags=["Matières"], dependencies=protected)
api_router.include_router(eleves.router, prefix="/eleves", tags=["Élèves"], dependencies=protected)
api_router.include_router(parents.router, prefix="/parents", tags=["Parents"], dependencies=protected)
api_router.include_router(inscriptions.router, prefix="/inscriptions", tags=["Inscriptions"], dependencies=protected)
api_router.include_router(enseignants.router, prefix="/enseignants", tags=["Enseignants"], dependencies=protected)
api_router.include_router(evaluations.router, prefix="/evaluations", tags=["Évaluations"], dependencies=protected)
api_router.include_router(notes.router, prefix="/notes", tags=["Notes"], dependencies=protected)
api_router.include_router(presences_eleves.router, prefix="/presences-eleves", tags=["Présences élèves"], dependencies=protected)
api_router.include_router(bulletins.router, prefix="/bulletins", tags=["Bulletins"], dependencies=protected)
api_router.include_router(emploi_temps.router, prefix="/emploi-temps", tags=["Emploi du temps"], dependencies=protected)
api_router.include_router(presences_enseignants.router, prefix="/presences-enseignants", tags=["Présences enseignants"], dependencies=protected)
api_router.include_router(cours_effectues.router, prefix="/cours-effectues", tags=["Cours effectués"], dependencies=protected)
api_router.include_router(observations_enseignants.router, prefix="/observations-enseignants", tags=["Observations enseignants"], dependencies=protected)
api_router.include_router(honoraires.router, prefix="/honoraires", tags=["Honoraires"], dependencies=protected)
api_router.include_router(frais_scolaires.router, prefix="/frais-scolaires", tags=["Frais scolaires"], dependencies=protected)
api_router.include_router(paiements.router, prefix="/paiements", tags=["Paiements"], dependencies=protected)
api_router.include_router(recus.router, prefix="/recus", tags=["Reçus"], dependencies=protected)
api_router.include_router(depenses.router, prefix="/depenses", tags=["Dépenses"], dependencies=protected)
api_router.include_router(cartes_scolaires.router, prefix="/cartes-scolaires", tags=["Cartes scolaires"], dependencies=protected)
api_router.include_router(communication.router, prefix="/communication", tags=["Communication"], dependencies=protected)
api_router.include_router(parametres.router, prefix="/parametres", tags=["Paramètres"], dependencies=protected)
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"], dependencies=protected)
api_router.include_router(journal.router, prefix="/journal", tags=["Journal d'activité"], dependencies=protected)