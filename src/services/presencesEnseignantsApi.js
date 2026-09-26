import { apiGet, apiPost, apiPut } from "./apiClient";

function enseignantParam(value) {
  if (value && typeof value === "object") return value.id_enseignant ?? value.idEnseignant;
  return value;
}

export const getPresencesEnseignants = (filter) =>
  apiGet("/presences-enseignants/", { id_enseignant: enseignantParam(filter) });
export const createPresenceEnseignant = (data) => apiPost("/presences-enseignants/", data);
export const updatePresenceEnseignant = (id, data) => apiPut(`/presences-enseignants/${id}`, data);
