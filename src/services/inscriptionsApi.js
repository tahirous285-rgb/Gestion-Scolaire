import { apiDelete, apiGet, apiPost, apiPut } from "./apiClient";

export const getInscriptions = ({ id_eleve, id_annee } = {}) =>
  apiGet("/inscriptions/", { id_eleve, id_annee });
export const getInscription = (id) => apiGet(`/inscriptions/${id}`);
export const createInscription = (data) => apiPost("/inscriptions/", data);
export const updateInscription = (id, data) => apiPut(`/inscriptions/${id}`, data);
export const deleteInscription = (id) => apiDelete(`/inscriptions/${id}`);
