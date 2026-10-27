# Matrice backend utilisée par le frontend

Source consultée : `backend/` (dépôt `Hamdate/Projet-Ecole`, `main` @ `2762593`) — `app/api/v1/api.py`, les routeurs `app/api/v1/endpoints/`, les schemas et modèles. Les suffixes `/` ci-dessous sont ceux déclarés par FastAPI.

Depuis cette version, toutes les routes ci-dessous exigent `Authorization: Bearer <token>` (seul `POST /auth/login` est public) : la dépendance `get_current_user` est appliquée globalement dans `api_router`.

## Administration

| Module | Routes utilisées | Schémas / champs principaux | Capacités frontend |
| --- | --- | --- | --- |
| Établissements | `GET/POST /etablissements/`, `GET/PUT/DELETE /etablissements/{id}` | `nom`, `code`, `adresse`, `telephone`, `email`, `site_web`, `logo`, `devise`, `langue`, `fuseau_horaire`, `actif` | CRUD |
| Rôles | `GET/POST /roles/`, `GET/PUT/DELETE /roles/{id}` | `nom`, `code`, `description` | Liste + création dans l’interface |
| Permissions | `GET/POST /permissions/`, `GET/PUT/DELETE /permissions/{id}`, `GET /permissions/role/{id_role}`, `POST /permissions/assign`, `DELETE /permissions/assign/{id_role}/{id_permission}` | `nom`, `code`, `description`, association `id_role`–`id_permission` | API disponible, pas encore intégrée à l’interface |
| Utilisateurs | `GET/POST /utilisateurs/`, `GET/PUT/DELETE /utilisateurs/{id}` | création : `id_etablissement`, `id_role`, `nom`, `prenom`, `email`, `telephone`, `login`, `mot_de_passe`, `statut`; mise à jour : `nom`, `prenom`, `email`, `telephone`, `statut`, `id_role` | CRUD adapté aux deux schemas |
| Paramètres | `GET /parametres/?id_etablissement=`, `POST /parametres/`, `PUT /parametres/{id}` | `id_etablissement`, `cle`, `valeur`, `description` | Liste + création + modification |
| Journal | `GET /journal/?id_etablissement=&limit=`, `POST /journal/` | `id_etablissement`, `id_utilisateur`, `action`, `module`, `table_cible`, `id_cible`, valeurs ancienne/nouvelle, `adresse_ip` | Liste + entrée conforme au schema |

L’API prend désormais en charge les permissions et leur association aux rôles. L’interface frontend ne propose pas encore leur gestion, ni le détail, la modification ou la suppression des rôles.

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
| Affectations | `POST /enseignants/matieres`, `GET /enseignants/{id}/matieres`, `POST /enseignants/classes`, `GET /enseignants/{id}/classes` | Création et lecture par enseignant ; aucune suppression inventée. Le backend rejette désormais un doublon avec `400` et un message métier (« Cet enseignant est déjà associé à cette matière » / « … à cette classe pour cette année »), affiché tel quel par l’UI |
| Évaluations | `GET /evaluations/`, `GET /evaluations/{id}`, `POST /evaluations/` | Liste + création |
| Notes | `GET/POST /notes/`, `GET/PUT/DELETE /notes/{id}` | CRUD ; le backend valide le barème et les doublons |
| Présences élèves | `GET/POST /presences-eleves/`, `PUT /presences-eleves/{id}` | Création + liste + modification ; statuts documentés par le modèle : `PRESENT`, `ABSENT`, `RETARD`, `EXCUSE` |
| Bulletins | `GET/POST /bulletins/`, `GET/PUT /bulletins/{id}`, `PUT /bulletins/{id}/generer-pdf` | CRUD disponible + génération PDF |
| Emploi du temps | `GET/POST /emploi-temps/`, `GET/PUT/DELETE /emploi-temps/{id}` | CRUD |

## Cahier des maîtres

- Présences enseignants : `GET/POST /presences-enseignants/`, `PUT /presences-enseignants/{id}`. Les statuts proposés correspondent au commentaire du modèle : `PRESENT`, `ABSENT`, `RETARD`, `PERMISSION`, `MISSION`, `CONGE`, `AUTRE`.
- Cours effectués : `GET/POST /cours-effectues/`.
- Observations enseignants : `GET /observations-enseignants/?id_enseignant=`, `GET /observations-enseignants/{id_observation}`, `POST /observations-enseignants/`, `PUT/DELETE /observations-enseignants/{id_observation}`. Champs : `id_enseignant`, `id_auteur` (non modifiable, rempli avec l’utilisateur connecté), `date_observation` (optionnelle), `contenu` (obligatoire), `confidentialite` (texte libre, défaut `interne`). L’API permet la lecture, la création, la modification et la suppression ; l’interface reste en liste + création.

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

## Filtrage établissement : contrat réel et dépendances backend

Les routes suivantes déclarent réellement un paramètre `id_etablissement` et le frontend transmet l’identifiant de la session via `establishmentId()` :

| Route GET | Page frontend | Comportement backend |
| --- | --- | --- |
| `/dashboard/?id_etablissement=` | Dashboard | Agrège les indicateurs de l’établissement demandé. L’API a toutefois `2` comme valeur par défaut : le frontend doit toujours transmettre l’identifiant de session. |
| `/communication/annonces?id_etablissement=` | Annonces | Filtre les annonces si l’identifiant est fourni. |
| `/frais-scolaires/types?id_etablissement=` | Frais scolaires — types | Filtre les types de frais si l’identifiant est fourni. |
| `/depenses/?id_etablissement=` | Dépenses | Filtre les dépenses si l’identifiant est fourni. |
| `/parametres/?id_etablissement=` | Paramètres | Identifiant requis par l’API. |
| `/journal/?id_etablissement=&limit=` | Journal d’activité | Identifiant requis par l’API ; limite déclarée par l’API. |

Les autres listes n’acceptent pas de filtre d’établissement direct. Certaines acceptent seulement un filtre relationnel (`id_eleve`, `id_inscription`, `id_annee`, `id_classe`, `id_enseignant`, `id_periode`, ou l’identifiant utilisateur) ; cela ne constitue pas un filtrage d’établissement ni une garantie d’isolation. En particulier, les pages et sélecteurs concernés sont :

- Administration et références : Établissements (`GET /etablissements/`), Utilisateurs (`GET /utilisateurs/`), Rôles (`GET /roles/`).
- Scolarité : Années/périodes (`GET /annees-scolaires/`, `/periodes/?id_annee=`), Élèves (`GET /eleves/`), Parents (`GET /parents/`), Inscriptions (`GET /inscriptions/?id_eleve=&id_annee=`), Classes (`GET /classes/`) et Matières (`GET /matieres/`).
- Pédagogie : Enseignants (`GET /enseignants/`), Affectations (`GET /enseignants/{id}/matieres`, `/enseignants/{id}/classes?id_annee=`), Évaluations (`GET /evaluations/?id_classe=&id_periode=`), Notes (`GET /notes/?id_evaluation=&id_inscription=`), Présences élèves (`GET /presences-eleves/?id_inscription=`), Bulletins (`GET /bulletins/?id_inscription=&id_periode=`), Emploi du temps (`GET /emploi-temps/?id_classe=&id_enseignant=&id_annee=`), Cahier maître (`GET /presences-enseignants/?id_enseignant=`, `/cours-effectues/?id_enseignant=&id_classe=`) et Observations enseignants (`GET /observations-enseignants/?id_enseignant=`).
- Finance et documents : Honoraires (`GET /honoraires/mois`, `/honoraires/?id_enseignant=&id_annee=`), Frais scolaires (`GET /frais-scolaires/?id_inscription=&id_annee=`), Paiements (`GET /paiements/?id_inscription=`), Reçus (`GET /recus/paiement/{id}`) et Cartes scolaires (`GET /cartes-scolaires/?id_inscription=`).
- Communication : Messages (`GET /communication/messages?id_destinataire=&id_expediteur=`) et Notifications (`GET /communication/notifications?id_utilisateur=`). Les notifications sont limitées par l’identifiant utilisateur ; la liste des messages peut être construite à partir des filtres expéditeur/destinataire, mais aucune de ces routes ne vérifie l’établissement.

Les autres listes à clé étrangère ont aussi ces routes sans filtre établissement : `GET /parents/eleve/{id}/parents` et `GET /honoraires/{id}/paiements`. Les reçus n’exposent qu’une recherche par paiement (`GET /recus/paiement/{id}`), sans route de liste globale ni filtre établissement.

Ces routes nécessitent une évolution backend pour accepter et appliquer un filtre d’établissement dérivé de la session authentifiée (ou une politique équivalente fondée sur le JWT). Les filtres React ne remplacent pas ce contrôle serveur. Les listes principales paginées utilisent des pages de 100 lignes sur les quatre routes qui exposent `skip`/`limit`. Les listes déroulantes qui appellent ces routes sans pagination (`getUtilisateurs`, `getEleves`, `getEnseignants`) restent limitées aux 100 premières lignes ; Cartes scolaires demande au plus 500 élèves. L’API devra aussi fournir un chargement paginé adapté aux sélecteurs. Le frontend refuse désormais une session (y compris une session legacy) sans identifiant d’établissement valide, afin d’éviter notamment que `/dashboard/` retombe sur sa valeur par défaut `id_etablissement=2`.
