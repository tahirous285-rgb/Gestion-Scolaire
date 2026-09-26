# Matrice backend utilisée par le frontend

Source consultée : `app/api/v1/api.py`, les routeurs `app/api/v1/endpoints/`, les schemas et modèles du dépôt backend fourni. Les suffixes `/` ci-dessous sont ceux déclarés par FastAPI.

## Administration

| Module | Routes utilisées | Schémas / champs principaux | Capacités frontend |
| --- | --- | --- | --- |
| Établissements | `GET/POST /etablissements/`, `GET/PUT/DELETE /etablissements/{id}` | `nom`, `code`, `adresse`, `telephone`, `email`, `site_web`, `logo`, `devise`, `langue`, `fuseau_horaire`, `actif` | CRUD |
| Rôles | `GET/POST /roles/` | `nom`, `code`, `description` | Liste + création |
| Utilisateurs | `GET/POST /utilisateurs/`, `GET/PUT/DELETE /utilisateurs/{id}` | création : `id_etablissement`, `id_role`, `nom`, `prenom`, `email`, `telephone`, `login`, `mot_de_passe`, `statut`; mise à jour : `nom`, `prenom`, `email`, `telephone`, `statut`, `id_role` | CRUD adapté aux deux schemas |
| Paramètres | `GET /parametres/?id_etablissement=`, `POST /parametres/`, `PUT /parametres/{id}` | `id_etablissement`, `cle`, `valeur`, `description` | Liste + création + modification |
| Journal | `GET /journal/?id_etablissement=&limit=`, `POST /journal/` | `id_etablissement`, `id_utilisateur`, `action`, `module`, `table_cible`, `id_cible`, valeurs ancienne/nouvelle, `adresse_ip` | Liste + entrée conforme au schema |

Le modèle `Permission` existe, mais aucun routeur permissions n’est inclus dans `api_router`. Aucune route `/permissions` n’est fabriquée.

## Scolarité

| Module | Routes utilisées | Champs de création | Capacités |
| --- | --- | --- | --- |
| Années | `GET /annees-scolaires/`, `GET /annees-scolaires/{id}`, `POST /annees-scolaires/` | `id_etablissement`, `libelle`, `date_debut`, `date_fin`, `statut` | Liste + création |
| Périodes | `GET /periodes/?id_annee=`, `POST /periodes/` | `id_annee`, `code`, `libelle`, `ordre`, `date_debut`, `date_fin` | Liste + création |
| Élèves | `GET/POST /eleves/`, `GET/PUT/DELETE /eleves/{id}` | `id_etablissement`, `matricule`, `nom`, `prenom`, champs personnels optionnels, `actif` | CRUD |
| Parents | `GET/POST /parents/`, `GET/PUT/DELETE /parents/{id}` | `id_etablissement`, `nom`, `prenom`, contacts optionnels | CRUD |
| Lien parent–élève | `POST /parents/lier`, `GET /parents/eleve/{id}/parents` | `id_eleve`, `id_parent`, `lien_parente`, `est_responsable`, `est_contact_urgence` | Formulaire de liaison |
| Inscriptions | `GET/POST /inscriptions/`, `GET/PUT/DELETE /inscriptions/{id}` | `id_eleve`, `id_annee`, `id_classe`, numéro/date/statut/options | CRUD avec schema de mise à jour distinct |
| Classes | `GET/POST /classes/`, `GET/PUT/DELETE /classes/{id}` | `id_etablissement`, `nom`, `niveau`, `capacite`, `salle`, `actif` | CRUD |
| Matières | `GET/POST /matieres/`, `GET/PUT/DELETE /matieres/{id}` | `id_etablissement`, `code`, `nom`, `description`, `actif` | CRUD |

## Enseignants et pédagogie

| Module | Routes utilisées | Capacités |
| --- | --- | --- |
| Enseignants | `GET/POST /enseignants/`, `GET/PUT/DELETE /enseignants/{id}` | CRUD sur les champs du schema enseignant |
| Affectations | `POST /enseignants/matieres`, `GET /enseignants/{id}/matieres`, `POST /enseignants/classes`, `GET /enseignants/{id}/classes` | Création et lecture par enseignant ; aucune suppression inventée |
| Évaluations | `GET /evaluations/`, `GET /evaluations/{id}`, `POST /evaluations/` | Liste + création |
| Notes | `GET/POST /notes/`, `GET/PUT/DELETE /notes/{id}` | CRUD ; le backend valide le barème et les doublons |
| Présences élèves | `GET/POST /presences-eleves/`, `PUT /presences-eleves/{id}` | Création + liste + modification ; statuts documentés par le modèle : `PRESENT`, `ABSENT`, `RETARD`, `EXCUSE` |
| Bulletins | `GET/POST /bulletins/`, `GET/PUT /bulletins/{id}`, `PUT /bulletins/{id}/generer-pdf` | CRUD disponible + génération PDF |
| Emploi du temps | `GET/POST /emploi-temps/`, `GET/PUT/DELETE /emploi-temps/{id}` | CRUD |

## Cahier des maîtres

- Présences enseignants : `GET/POST /presences-enseignants/`, `PUT /presences-enseignants/{id}`. Les statuts proposés correspondent au commentaire du modèle : `PRESENT`, `ABSENT`, `RETARD`, `PERMISSION`, `MISSION`, `CONGE`, `AUTRE`.
- Cours effectués : `GET/POST /cours-effectues/`.
- Observations enseignants : le modèle et les schemas sont présents, mais aucun endpoint n’est enregistré ; l’écran affiche `BACKEND NON DISPONIBLE`.

## Honoraires, finance et documents

| Module | Routes utilisées | Capacités |
| --- | --- | --- |
| Mois | `GET/POST /honoraires/mois` | Liste + création |
| Honoraires | `GET/POST /honoraires/`, `GET/PUT /honoraires/{id}` | Création + mise à jour des champs autorisés |
| Paiements honoraires | `POST /honoraires/paiements`, `GET /honoraires/{id}/paiements` | Paiement + liste par honoraire |
| Types de frais | `GET/POST /frais-scolaires/types` | Liste + création |
| Frais scolaires | `GET/POST /frais-scolaires/` | Liste + création |
| Paiements | `GET/POST /paiements/`, `GET /paiements/{id}` | Liste + création |
| Reçus | `GET /recus/paiement/{id}`, `PUT /recus/{id}/imprimer?id_imprimeur=`, `PUT /recus/{id}/generer-pdf` | Recherche par paiement + actions |
| Dépenses | `GET/POST /depenses/` | Liste + création |
| Cartes scolaires | `GET/POST /cartes-scolaires/`, `PUT /cartes-scolaires/{id}/reimprimer`, `PUT /cartes-scolaires/{id}/generer-qr` | Création + actions |

## Communication et dashboard

- Annonces : `GET/POST /communication/annonces`.
- Messages : `GET/POST /communication/messages`, `PUT /communication/messages/{id}/lire`.
- Notifications : `GET/POST /communication/notifications`, `PUT /communication/notifications/{id}/lire`.
- Dashboard : `GET /dashboard/?id_etablissement=` avec `eleves`, `enseignants`, `classes`, `parents`, `presences_jour`, `finances` et `activites_recentes`.

La pagination UI est activée uniquement pour les quatre routes qui déclarent réellement `skip`/`limit` (`etablissements`, `utilisateurs`, `eleves`, `enseignants`). Aucune recherche serveur ou filtre non déclaré dans ces routeurs n’est envoyé par le frontend ; la recherche des tables filtre seulement les lignes déjà chargées.

## Pages détaillées (interface)

Toutes les pages dont le backend est disponible disposent désormais d'une interface détaillée (et non plus d'un tableau CRUD générique). Les pages de la branche `frontend/tahirou` (élèves, parents, inscriptions, classes, matières, enseignants, affectations, évaluations, bulletins, emploi du temps, cahier des maîtres, années/périodes, tableau de bord) ont été restaurées et branchées sur l'authentification JWT. Les autres pages s'appuient sur la boîte à outils partagée `src/components/module/ModuleKit.jsx` :

| Page | Fonctionnalités principales |
| --- | --- |
| Établissements | Cartes, détails, création/modification, activation/désactivation, suppression (sauf établissement de la session) |
| Utilisateurs | Filtres établissement/rôle/statut, activer/désactiver/suspendre, création avec confirmation du mot de passe |
| Rôles & permissions | Cartes par rôle avec nombre de membres et liste des membres ; permissions signalées comme non exposées par l'API |
| Paramètres | Regroupement par préfixe, édition en ligne, paramètres suggérés |
| Journal d'activité | Chronologie par jour, filtres module/utilisateur, limite configurable, détail avant/après |
| Frais, paiements, reçus, dépenses | Statistiques, filtres, recouvrement, impression des reçus |
| Honoraires, paiements des honoraires | Calcul, validation, paiements plafonnés au solde |
| Notes | Saisie en grille d'une évaluation entière, rang, mention, statistiques |
| Présences élèves | Appel par classe (P/A/R/E), historique et taux d'assiduité |
| Cours effectués | Filtres, taux de réalisation, heures par enseignant, suggestions matières/classes |
| Cartes scolaires | Cartes visuelles, génération unitaire ou par classe, QR, impression (comptabilisée via `reimprimer`) |
| Annonces | Fil en ligne / brouillons / expirées, duplication (pas de modification côté API) |
| Messagerie | Boîte de réception / envoyés, lecture marquée automatiquement, réponse avec citation |
| Notifications | Marquer lu / tout lu, envoi à un utilisateur, un rôle ou tout l'établissement |

Observations enseignants reste marquée « backend non disponible ».
