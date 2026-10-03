const SESSION_KEY = "gestion_scolaire_session";

// Contrôle de cohérence/expiration côté UI uniquement : la signature et les
// autorisations restent vérifiées par FastAPI à chaque requête protégée.
export function tokenPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || !parts.every(Boolean)) return null;
    return JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

export function isSessionValid(session) {
  const claims = tokenPayload(session?.access_token);
  return Boolean(claims && Number.isFinite(claims.exp) && claims.exp * 1000 > Date.now()
    && ["id_etablissement", "id_utilisateur", "id_role"].every((key) => Number.isInteger(Number(session[key])) && Number(session[key]) > 0)
    && String(claims.sub) === String(session.id_utilisateur)
    && Number(claims.id_etablissement) === Number(session.id_etablissement)
    && Number(claims.id_role) === Number(session.id_role));
}

export function getSession() {
  let session = null;
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) session = JSON.parse(stored);
    else if (localStorage.getItem("access_token")) {
      session = Object.fromEntries(["access_token", "token_type", "id_etablissement", "id_utilisateur", "id_role", "nom", "prenom"].map((key) => [key, localStorage.getItem(key)]));
    }
  } catch { /* Stockage incomplet ou illisible : ne pas ouvrir les routes protégées. */ }
  if (isSessionValid(session)) return session;
  clearSession();
  return null;
}

export function saveSession(tokenResponse, idEtablissement) {
  const session = { ...tokenResponse, id_etablissement: Number(idEtablissement) };
  if (!isSessionValid(session)) throw new Error("La réponse de connexion ne contient pas de session JWT valide.");
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearSession() {
  [SESSION_KEY, "access_token", "token_type", "id_etablissement", "id_utilisateur", "id_role", "nom", "prenom"].forEach((key) => localStorage.removeItem(key));
}

export function getAccessToken() {
  return getSession()?.access_token || null;
}

export { SESSION_KEY };
