# Audit et finalisation frontend — 3 octobre 2026

## Périmètre et méthode

Travail sur la branche existante `arena/01a10198-gestion-scolaire`, depuis `8487070`. Aucun changement de branche, reset, remplacement d’architecture ou retour à une ancienne version.

Avant les corrections : lecture de `README.md`, de la matrice, de `backend/app/api/v1/api.py`, des 31 fichiers du dossier endpoints (dont `__init__.py`), de tous les schémas Pydantic utilisés, de tous les services `*Api.js`, des pages JSX (y compris les formulaires autonomes), du CRUD générique et de la chaîne d’authentification. Lecture complémentaire des CRUD documents/PDF, du dashboard et des dépendances JWT pour vérifier le comportement réel, sans les modifier.

Les corrections et les tests sont en JavaScript/JSX. React/Vite, `fetch`, `apiClient.js` et l’organisation existante sont conservés. Aucun endpoint ajouté au backend. Aucune donnée de démonstration dans l’application.

## Constats initiaux et corrections

| Domaine | Problème constaté | Correction frontend |
| --- | --- | --- |
| Session | JWT malformé accepté localement, métadonnées manquantes possibles, expiration non réactive | Validation de cohérence/expiration, rejet des sessions incomplètes ; validation des sessions restaurées par le `GET /utilisateurs/{id}` existant avant montage des pages protégées ; réessai explicite si API indisponible |
| Auth HTTP | Ancien 401 susceptible de déconnecter une nouvelle session | `Bearer` automatique, pas de JWT sur login, invalidation seulement de la session concernée, synchronisation inter-onglets et expiration même sans requête |
| Dashboard | Valeurs initiales à zéro assimilables à des statistiques réelles ; pas d’actualisation | Valeurs absentes affichées « — », chargement/erreur/actualisation, journal vide distinct d’un journal indisponible ; aucun calcul mensuel |
| Photo | Contrôle natif seul, formulation ambiguë sur le stockage | Composant partagé `PhotoPicker` : bouton ouvrant le sélecteur système, aperçu, retrait, validation JPG/PNG/WebP/GIF et 8 Mo ; conversion existante `fileToStoredPhoto()` conservée, JPEG dans le champ `photo` |
| Élèves | Soumission possible pendant préparation photo ; champs requis vidables en édition | Verrouillage pendant préparation/enregistrement ; conservation photo après création/édition et consultation ; maintien des champs obligatoires |
| Cartes | Identité/photo dépendant d’une liste d’élèves tronquée ; première impression confondue avec réédition | Résolution des élèves via leurs IDs réels ; récupération des inscriptions manquantes par GET individuel ; sélection inscription, photo partagée avec dossier élève ; impression et réimpression séparées |
| Impression | `noopener` pouvait empêcher l’accès à la fenêtre ; ouverture après appels asynchrones ; délai arbitraire de 400 ms | Fenêtre réservée dans le clic, `opener` neutralisé, données relues par GET individuel, attente du décodage des images, fermeture en cas d’échec |
| QR | Token envoyé à un générateur externe | QR produit localement avec `qrcode` ; action serveur `PUT /cartes-scolaires/{id}/generer-qr` conservée ; pas de token JWT/QR affiché dans les tables |
| Bulletins | Validateur saisi à la main, PDF serveur décrit comme disponible sans accès au fichier | Auteur connecté pour validation (validateur précédent conservé si déjà validé) ; périodes cohérentes avec année de l’inscription ; impression frontend avec photo et notes ; génération serveur conservée, chemin et limites explicités |
| Années/utilisateurs | Établissement librement modifiable | Champ supprimé de la saisie, injection `establishmentId()` ; pas de PUT/DELETE inventé pour années/périodes |
| Référentiels | IDs bruts et listes périmées après création ; limites implicites de 100/500 | Libellés des sélecteurs réutilisés dans les tables, détails et recherche locale ; actualisation après mutation ; parcours `skip/limit` uniquement pour élèves/enseignants/utilisateurs où il est déclaré ; erreurs de référentiels visibles |
| Relations | Périodes, inscriptions ou frais sélectionnables sans cohérence | Listes dépendantes : année→période, inscription→période/frais, année→inscription, évaluation→inscription ; réinitialisation du choix dépendant |
| Affectations | IDs dans résultats ; doubles soumissions possibles | Noms matière/classe/année réels, verrouillage pendant création ; aucune modification/suppression ajoutée |
| CRUD | Champs hors formulaire envoyés (notamment honoraires), erreurs masquées derrière modal, pas de succès, rafraîchissements inutiles | Sérialisation limitée aux champs du schéma de création/édition, erreurs dans le modal, succès, verrou synchrone contre doubles soumissions, réponses de chargement obsolètes ignorées ; impression sans rechargement inutile |
| Consultation | Détails absents des pages création seule ; champs masqués par les seules colonnes visibles | Consultation disponible sans inventer de mutation, détails étendus aux champs de formulaire (hors mots de passe), dont justificatifs/observations de dépenses et présences |
| Journal | Présentation ambiguë d’un audit automatique | Historique des entrées renvoyées ; bouton « Consigner une entrée manuelle », aucune écriture automatique de journal |
| Finance | Choix de frais non lié à inscription, honoraire payable différent de la liste consultée | Frais liés à l’inscription choisie ; paiement d’honoraire fixé à l’honoraire consulté ; reçus toujours recherchés par paiement |
| Communication | Messages globaux chargés et marquage lu sans distinction du destinataire | Requêtes réelles destinataire/expéditeur connecté, dédoublonnage, bouton lu pour le destinataire ; notifications conservées, aucune intégration externe ajoutée |
| Rôles | Titre mélangeant rôles fonctionnels et permissions indisponibles | « Rôles disponibles » et avertissement permissions non exposées conservé |

## Limites backend conservées, sans contournement

- Permissions et association rôle–permission non exposées.
- ClasseMatiere non exposée ; affectations enseignant–matière/classe en création/lecture seulement.
- Années, périodes, évaluations, cours effectués, observations enseignants, frais, paiements, dépenses, journal, annonces : aucune mutation non exposée ajoutée.
- Pas de liste globale des reçus ; uniquement recherche par paiement, marquage imprimé et génération PDF.
- Les PDF serveur sont bien demandés aux routes existantes. Le backend retourne un chemin `storage/...` mais ne monte pas de route de téléchargement/statique. Aucun faux lien de téléchargement n’est fabriqué.
- Le générateur PDF serveur du bulletin ne reçoit pas la photo : seule l’impression frontend garantit la photo du champ élève. Le bouton serveur reste disponible avec explication.
- Le compteur de cartes comptabilise l’appel à `reimprimer`. Le navigateur ne peut pas prouver qu’une impression physique a abouti ou distinguer l’annulation du dialogue système ; l’UI l’explicite.
- Certaines listes backend ont une limite interne de 100 sans exposer de pagination dans le routeur. Le frontend n’invente pas de paramètres pour la dépasser. Les inscriptions/élèves des cartes et les contextes d’impression sont résolus par les GET individuels existants si nécessaire.
- Les listes renvoyées par plusieurs routes sont globales. L’ID d’établissement, les libellés et les filtres UI ne constituent **jamais** une isolation de sécurité. La signature JWT et les autorisations restent du ressort du backend inchangé.
- Le dashboard lit exclusivement `/dashboard/?id_etablissement=...`. Ses `activites_recentes` viennent du même modèle JournalActivite que `/journal/`, interrogé directement dans le module historique. Aucun second journal simulé ni agrégat mensuel.

## Tests exécutés

### Automatisés frontend

- `npm run lint` : **réussi, 0 erreur, 0 avertissement**.
- `npm run build` : **réussi**.
- `npm test` sous Chromium : **34 tests réussis**.
- Contrôle statique de toutes les méthodes/routes des services contre les routeurs FastAPI versionnés.
- Vérification des champs transmis par les parcours testés contre les classes Pydantic lues dans le backend (champs autorisés et requis, héritage compris).
- Parcours : login, dashboard, JWT, 401, session expirée/malformée/incomplète, validation serveur avant montage, panne/reprise, déconnexion inter-onglets, réponse 401 tardive.
- Élèves : lecture, création, édition, retrait et persistance photo ; événement `filechooser`, type/taille invalides, erreur 422 visible dans modal.
- Cartes : identité automatique, photo, création, QR exact, réimpression exacte et compteur, contenu de la fenêtre imprimable, QR local ; photo depuis le formulaire carte enregistrée par `PUT /eleves/{id}`.
- Bulletins : validation/auteur, photo/notes/période dans fenêtre imprimable, génération PDF serveur.
- Notes, présences élèves/enseignants, types/frais, paiements, dépenses, journal, observations enseignants : consultation et création avec vérification des payloads.
- Années/périodes : établissement imposé et nouvel élément disponible dans le sélecteur sans rechargement de page.
- Affectations, rôles, reçus, communication, honoraires, recherche locale, confirmation de suppression, double soumission, référentiels au-delà de 100 enseignants.
- Montage des autres pages sans erreur React.

Ces tests interceptent les réponses API **dans les tests uniquement**. Ils vérifient le frontend, pas une écriture réelle sur une base de production. Le sélecteur a été testé sous Chromium headless, pas sur un poste Windows physique. Le contenu imprimable est testé ; ni une imprimante physique ni le dialogue système « Enregistrer en PDF » ne sont pilotés.

Le téléchargement standard du navigateur Playwright étant bloqué dans cet environnement, Chromium a été fourni temporairement hors dépôt. Exécution locale utilisée : `CHROMIUM_PATH=/tmp/chromium LD_LIBRARY_PATH=/home/user/browser-tools/libs/lib npm test -- --reporter=line`. En environnement habituel : `npx playwright install --with-deps chromium` puis `npm test`.

### Appels réels au backend inchangé

Au départ : aucun serveur local et aucune base SQLite dans ce checkout. Dépendances Python minimales installées dans un environnement **extérieur au dépôt**. Démarrage du code existant avec `PYTHONDONTWRITEBYTECODE=1`, un `DATABASE_URL` SQLite **uniquement en mémoire**, vide, sans seed et sans création/modification de fichier SQLite.

| Appel réel | Résultat |
| --- | --- |
| `GET /` | 200, API opérationnelle |
| `POST /api/v1/auth/login` avec identifiants absents | 401, Identifiants invalides |
| `GET /api/v1/dashboard/?id_etablissement=1` sans JWT | 401, Non authentifié |
| `GET /api/v1/eleves/` avec JWT invalide | 401, Token invalide ou expiré |
| `GET /openapi.json` | 200, 69 chemins et 90 schémas |

**Non validés sur une base métier réelle :** connexion réussie avec compte existant, créations/éditions persistantes, fichiers PDF/QR serveur produits avec des données réelles. Aucun compte n’a été inventé ou injecté pour prétendre valider ces opérations.

## Intégrité backend

`backend/` : aucun fichier ajouté/modifié/supprimé. Aucun modèle SQLAlchemy, schéma Pydantic, routeur, CRUD Python ou fichier SQLite modifié. Vérification finale par `git diff --exit-code HEAD -- backend/` et contrôle des fichiers non suivis. Les artefacts de tests/build et les outils temporaires sont exclus du commit.

## Fichiers frontend modifiés ou ajoutés

- `src/components/common/CrudPage.jsx`
- `src/components/common/PhotoPicker.jsx`
- `src/hooks/AuthProvider.jsx`
- `src/hooks/useReferenceOptions.js`
- `src/pages/affectations/Affectations.jsx`
- `src/pages/annees-periodes/AnneesPeriodes.jsx`
- `src/pages/auth/login.jsx`
- `src/pages/bulletins/Bulletins.jsx`
- `src/pages/cahier-maitre/CahierMaitre.jsx`
- `src/pages/cartes/CartesScolaires.jsx`
- `src/pages/classes/Classes.jsx`
- `src/pages/cours-effectues/CoursEffectues.jsx`
- `src/pages/dashboard/Dashboard.jsx`
- `src/pages/eleves/EleveForm.jsx`
- `src/pages/eleves/Eleves.jsx`
- `src/pages/emploi-du-temps/EmploiDuTemps.jsx`
- `src/pages/enseignants/Enseignants.jsx`
- `src/pages/etablissements/Etablissements.jsx`
- `src/pages/evaluations/Evaluations.jsx`
- `src/pages/frais/FraisScolaires.jsx`
- `src/pages/honoraires/Honoraires.jsx`
- `src/pages/inscriptions/Inscriptions.jsx`
- `src/pages/journal-activite/JournalActivite.jsx`
- `src/pages/matieres/Matieres.jsx`
- `src/pages/messages/Messages.jsx`
- `src/pages/notes/Notes.jsx`
- `src/pages/observations-enseignants/ObservationsEnseignants.jsx`
- `src/pages/paiements-honoraires/PaiementsHonoraires.jsx`
- `src/pages/paiements/Paiements.jsx`
- `src/pages/parents/Parents.jsx`
- `src/pages/presences-eleves/PresencesEleves.jsx`
- `src/pages/recus/Recus.jsx`
- `src/pages/roles-permissions/RolesPermissions.jsx`
- `src/pages/utilisateurs/Utilisateurs.jsx`
- `src/routes/AppRoutes.jsx`
- `src/services/apiClient.js`
- `src/services/authStorage.js`
- `src/utils/imageFile.js`
- `src/utils/printBulletinsCartes.js`
- `src/utils/printDocument.js`

Outillage : `package.json`, `package-lock.json`, `playwright.config.js`, `tests/frontend.spec.js`, `.gitignore`. Documentation : `README.md`, `docs/backend-frontend-matrix.md`, ce rapport.
