const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";

export function authToken() {
  return localStorage.getItem("access_token");
}

export function isAuthenticated() {
  return Boolean(authToken());
}

export function currentUser() {
  const id = Number(localStorage.getItem("id_utilisateur"));
  const establishment = Number(localStorage.getItem("id_etablissement"));

  return {
    id_utilisateur: Number.isFinite(id) && id > 0 ? id : null,
    id_etablissement: Number.isFinite(establishment) && establishment > 0 ? establishment : null,
    id_role: Number(localStorage.getItem("id_role")) || null,
    nom: localStorage.getItem("nom_utilisateur") || "",
    prenom: localStorage.getItem("prenom_utilisateur") || "",
  };
}

export function saveSession(session) {
  localStorage.setItem("access_token", session.access_token);
  localStorage.setItem("id_utilisateur", String(session.id_utilisateur));
  localStorage.setItem("id_etablissement", String(session.id_etablissement));
  localStorage.setItem("id_role", String(session.id_role));
  localStorage.setItem("nom_utilisateur", session.nom || "");
  localStorage.setItem("prenom_utilisateur", session.prenom || "");
}

export function clearSession() {
  ["access_token", "id_utilisateur", "id_etablissement", "id_role", "nom_utilisateur", "prenom_utilisateur"]
    .forEach((key) => localStorage.removeItem(key));
}

export async function apiFetch(input, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = authToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(input, { ...options, headers });

  if (response.status === 401) {
    clearSession();
  }

  return response;
}

export async function apiRequest(path, options = {}) {
  const { headers, ...requestOptions } = options;
  const response = await apiFetch(`${API_URL}${path}`, {
    ...requestOptions,
    headers: { "Content-Type": "application/json", ...headers },
  });
  if (response.ok) return response.status === 204 ? null : response.json();
  let message = `Erreur HTTP ${response.status}`;
  try {
    const data = await response.json();
    if (typeof data?.detail === "string") message = data.detail;
    else if (Array.isArray(data?.detail)) message = data.detail.map((e) => e.msg).join(", ");
  } catch {}
  throw new Error(message);
}
export const apiGet = (path) => apiRequest(path);
export const apiPost = (path, body) => apiRequest(path, { method: "POST", body: JSON.stringify(body) });
export const apiPut = (path, body) => apiRequest(path, { method: "PUT", body: JSON.stringify(body) });
export const apiDelete = (path) => apiRequest(path, { method: "DELETE" });

export async function login(credentials) {
  const session = await apiPost("/auth/login", credentials);
  const authenticatedSession = { ...session, id_etablissement: credentials.id_etablissement };
  saveSession(authenticatedSession);
  return authenticatedSession;
}

export function establishmentId() {
  return currentUser().id_etablissement;
}

export function userId() {
  return currentUser().id_utilisateur;
}
