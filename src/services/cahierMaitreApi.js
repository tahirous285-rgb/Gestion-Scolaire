import { apiGet, apiPost, apiPut } from "./apiClient";

export const getPresencesEnseignants = (id_enseignant) =>
  apiGet("/presences-enseignants/", { id_enseignant });
export const createPresenceEnseignant = (data) => apiPost("/presences-enseignants/", data);
export const updatePresenceEnseignant = (id, data) =>
  apiPut(`/presences-enseignants/${id}`, data);

export const getCoursEffectues = ({ id_enseignant, id_classe } = {}) =>
  apiGet("/cours-effectues/", { id_enseignant, id_classe });
export const createCoursEffectue = (data) => apiPost("/cours-effectues/", data);
