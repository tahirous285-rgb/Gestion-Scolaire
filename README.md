# Gestion-Scolaire — frontend

Frontend desktop React/Vite de l’application de gestion scolaire. Le frontend utilise uniquement JavaScript/JSX, React Router, `fetch` et les services REST FastAPI.

## Démarrage

```bash
npm install
npm run dev
```

Par défaut, l’application appelle `/api/v1`. Le serveur Vite proxifie ce chemin vers `http://127.0.0.1:8000`. Pour utiliser une autre API en développement :

```bash
VITE_BACKEND_URL=http://adresse-du-backend:8000 npm run dev
```

`VITE_API_URL` peut également contenir l’URL complète d’une API distante. Les URL locales configurées dans cette variable repassent volontairement par le proxy Vite afin que le navigateur n’appelle jamais `localhost` directement.

## Organisation

- `src/services/apiClient.js` : point d’entrée HTTP unique, JWT, erreurs et gestion de `401`.
- `src/services/*Api.js` : fonctions métier alignées sur les routes FastAPI.
- `src/hooks/AuthProvider.jsx` et `src/hooks/useAuth.js` : session de connexion et protection des routes.
- `src/components/common/CrudPage.jsx` : table, recherche, consultation et formulaires CRUD réutilisables.
- `src/pages/` : modules de l’application.

## Authentification

La page `/login` envoie `id_etablissement`, `login` et `mot_de_passe` à `POST /api/v1/auth/login`. Le JWT, le rôle, l’utilisateur et l’identifiant de l’établissement sont conservés dans la session locale. Chaque requête de service ajoute automatiquement `Authorization: Bearer <token>`.

## Fonctionnalités non exposées par le backend

Le frontend n’invente pas de route pour les fonctionnalités absentes de l’API actuelle. L’interface les signale explicitement avec `BACKEND NON DISPONIBLE` :

- permissions et association rôle–permission ;
- association classe–matière (`ClasseMatiere`) ;
- liste globale des reçus (la recherche par paiement reste disponible).

## Backend

`backend/` contient l’API FastAPI réellement utilisée par le frontend : dépôt [`Hamdate/Projet-Ecole`](https://github.com/Hamdate/Projet-Ecole), branche `main`, commit `fb43063` (« Ajout du module Observations enseignants », 28/09/2026). Les fichiers sont versionnés ici directement afin que le checkout reste complet — auparavant `backend/` n’était qu’un gitlink non initialisé, donc un dossier vide. Aucun fichier backend n’est modifié par le frontend.

Depuis cette version, le backend exige un JWT sur toutes les routes sauf `POST /auth/login` (`HTTPBearer` + `get_current_user`), ce que `apiClient.js` fait déjà, et renvoie `400` sur un doublon enseignant–matière ou enseignant–classe.

Démarrer l’API en local (Python 3.11+, dépendances épinglées dans `backend/requirements.txt`) :

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

`bcrypt` doit rester en `4.0.1` comme épinglé : `passlib 1.7.4` échoue avec `bcrypt >= 4.1` (hachage et vérification des mots de passe en erreur).

## Vérifications

```bash
npm run build
npm run lint
```

## Finalisation frontend (octobre 2026)

Rapport détaillé : [audit frontend](docs/frontend-audit-2026-10-03.md).

- Une session restaurée est vérifiée sur l’API avant l’affichage protégé ; expiration et `401` renvoient à la connexion.
- Le dashboard n’affiche que les valeurs retournées par son endpoint, sans statistiques mensuelles fabriquées.
- Le bouton **📷 Choisir une photo** ouvre le sélecteur de fichiers du système (Explorateur sous Windows). JPG/PNG/WebP/GIF, 8 Mo maximum ; conversion JPEG et stockage comme chaîne dans `photo`, sans prétendre créer un fichier serveur.
- Cartes et bulletins : impression frontend avec photo ; QR local sans service externe. La génération PDF serveur reste disponible mais son chemin n’est pas un lien téléchargeable : le backend actuel n’expose pas `storage/`. Le PDF serveur du bulletin ne reçoit pas la photo.
- Les recherches filtrent les lignes chargées uniquement. Les filtres UI et l’établissement de session ne remplacent pas les autorisations backend.

### Tests frontend

```bash
npm ci
npx playwright install --with-deps chromium
npm test
npm run lint
npm run build
```

Les tests Playwright démarrent/réutilisent Vite sur le port 5173. Ils utilisent des réponses API interceptées **uniquement dans `tests/`**, jamais dans l’application. Les méthodes/routes et les champs de payload sont confrontés aux fichiers backend versionnés, sans modification ni écriture SQLite. `CHROMIUM_PATH` permet de choisir un Chromium déjà installé.
