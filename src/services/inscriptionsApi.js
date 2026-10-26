import { apiDelete, apiGet, apiPost, apiPut } from "./apiClient";

export const getInscriptions = ({ id_eleve, id_annee, skip = 0, limit = 1000 } = {}) =>
  apiGet("/inscriptions/", { id_eleve, id_annee, skip, limit });
export const getInscription = (id) => apiGet(`/inscriptions/${id}`);
export const createInscription = (data) => apiPost("/inscriptions/", data);
export const updateInscription = (id, data) => apiPut(`/inscriptions/${id}`, data);
export const deleteInscription = (id) => apiDelete(`/inscriptions/${id}`);
