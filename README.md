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
- `src/hooks/useAuth.jsx` : session de connexion et protection des routes.
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
