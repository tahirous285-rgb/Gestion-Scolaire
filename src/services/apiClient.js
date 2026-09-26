import { clearSession, getAccessToken, getSession } from "./authStorage";

// En développement Vite proxifie /api vers FastAPI. Le navigateur ne doit
// jamais tenter d'appeler localhost directement depuis l'application.
const configuredApiUrl = import.meta.env.VITE_API_URL || "";
const usesBrowserLocalhost = /^(https?:\/\/)?(127\.0\.0\.1|localhost)(:\d+)?/i.test(configuredApiUrl);
const API_URL = (usesBrowserLocalhost || !configuredApiUrl ? "/api/v1" : configuredApiUrl).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function buildUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${normalizedPath}`;
}

function errorMessage(data, status) {
  if (typeof data?.detail === "string") return data.detail;
  if (Array.isArray(data?.detail)) {
    return data.detail
      .map((item) => item?.msg || item?.message || String(item))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof data?.message === "string") return data.message;
  return `Erreur HTTP ${status}`;
}

async function readResponse(response) {
  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  const text = await response.text();
  return text || null;
}

export async function apiRequest(path, options = {}) {
  const { headers: optionHeaders = {}, body, ...rest } = options;
  const headers = {
    Accept: "application/json",
    ...optionHeaders,
  };

  if (body !== undefined && !(body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  const token = getAccessToken();
  if (token) {
    headers.Authorization = `${getSession()?.token_type || "bearer"} ${token}`;
  }

  let response;
  try {
    response = await fetch(buildUrl(path), {
      ...rest,
      body,
      headers,
    });
  } catch (error) {
    throw new ApiError(
      "Impossible de joindre le serveur. Vérifiez que l'API FastAPI est démarrée.",
      0,
      error,
    );
  }

  const data = await readResponse(response);

  if (response.status === 401) {
    clearSession();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth:unauthorized"));
    }
  }

  if (!response.ok) {
    throw new ApiError(errorMessage(data, response.status), response.status, data);
  }

  return data;
}

export function apiGet(path, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  const suffix = query.toString() ? `${path.includes("?") ? "&" : "?"}${query}` : "";
  return apiRequest(`${path}${suffix}`);
}

export function apiPost(path, body) {
  return apiRequest(path, { method: "POST", body: JSON.stringify(body) });
}

export function apiPut(path, body) {
  return apiRequest(path, {
    method: "PUT",
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

export function apiDelete(path) {
  return apiRequest(path, { method: "DELETE" });
}

export function establishmentId() {
  const value = Number(getSession()?.id_etablissement);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export function userId() {
  const value = Number(getSession()?.id_utilisateur);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export function authHeader() {
  const token = getAccessToken();
  return token ? `Bearer ${token}` : null;
}

// Alias conservé pour les modules qui utilisaient déjà apiFetch.
export const apiFetch = apiRequest;

// Informations de la session courante (utilisées par le tableau de bord).
export function currentUser() {
  const session = getSession() || {};
  return {
    id_utilisateur: userId(),
    id_etablissement: establishmentId(),
    id_role: Number(session.id_role) || null,
    nom: session.nom || "",
    prenom: session.prenom || "",
  };
}
