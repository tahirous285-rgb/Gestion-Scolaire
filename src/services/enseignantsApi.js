import { apiDelete, apiGet, apiPost, apiPut } from "./apiClient";

export const getEnseignants = ({ skip = 0, limit = 100 } = {}) =>
  apiGet("/enseignants/", { skip, limit });
export const getEnseignant = (id) => apiGet(`/enseignants/${id}`);
export const createEnseignant = (data) => apiPost("/enseignants/", data);
export const updateEnseignant = (id, data) => apiPut(`/enseignants/${id}`, data);
export const deleteEnseignant = (id) => apiDelete(`/enseignants/${id}`);

export const linkEnseignantMatiere = (data) => apiPost("/enseignants/matieres", data);
export const getMatieresOfEnseignant = (id) => apiGet(`/enseignants/${id}/matieres`);
export const linkEnseignantClasse = (data) => apiPost("/enseignants/classes", data);
export const getClassesOfEnseignant = (id, id_annee) =>
  apiGet(`/enseignants/${id}/classes`, { id_annee });
