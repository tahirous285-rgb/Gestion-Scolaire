const SESSION_KEY = "gestion_scolaire_session";

function parseSession(value) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed?.access_token ? parsed : null;
  } catch {
    return null;
  }
}

function tokenIsExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
}

export function getSession() {
  const stored = parseSession(localStorage.getItem(SESSION_KEY));
  if (stored) {
    if (tokenIsExpired(stored.access_token)) {
      clearSession();
      return null;
    }
    return stored;
  }

  // Compatibilité avec les anciennes clés utilisées par le frontend.
  const token = localStorage.getItem("access_token");
  if (!token) return null;
  if (tokenIsExpired(token)) {
    clearSession();
    return null;
  }

  return {
    access_token: token,
    token_type: localStorage.getItem("token_type") || "bearer",
    id_etablissement: Number(localStorage.getItem("id_etablissement")) || null,
    id_utilisateur: Number(localStorage.getItem("id_utilisateur")) || null,
    id_role: Number(localStorage.getItem("id_role")) || null,
    nom: localStorage.getItem("nom") || "",
    prenom: localStorage.getItem("prenom") || "",
  };
}

export function saveSession(tokenResponse, idEtablissement) {
  const session = {
    ...tokenResponse,
    id_etablissement: Number(idEtablissement),
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem("access_token", session.access_token);
  localStorage.setItem("token_type", session.token_type || "bearer");
  localStorage.setItem("id_etablissement", String(session.id_etablissement));
  localStorage.setItem("id_utilisateur", String(session.id_utilisateur));
  localStorage.setItem("id_role", String(session.id_role));
  localStorage.setItem("nom", session.nom || "");
  localStorage.setItem("prenom", session.prenom || "");

  return session;
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  [
    "access_token",
    "token_type",
    "id_etablissement",
    "id_utilisateur",
    "id_role",
    "nom",
    "prenom",
  ].forEach((key) => localStorage.removeItem(key));
}

export function getAccessToken() {
  return getSession()?.access_token || null;
}

export { SESSION_KEY };
