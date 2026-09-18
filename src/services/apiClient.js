const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
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
export function establishmentId() { const v = Number(localStorage.getItem("id_etablissement")); return Number.isFinite(v) && v > 0 ? v : 1; }
export function userId() { const v = Number(localStorage.getItem("id_utilisateur")); return Number.isFinite(v) && v > 0 ? v : 1; }
