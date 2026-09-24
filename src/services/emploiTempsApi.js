import { apiDelete, apiGet, apiPost, apiPut } from "./apiClient";

export const getEmplois = ({ id_classe, id_enseignant, id_annee } = {}) =>
  apiGet("/emploi-temps/", { id_classe, id_enseignant, id_annee });
export const getEmploi = (id) => apiGet(`/emploi-temps/${id}`);
export const createEmploi = (data) => apiPost("/emploi-temps/", data);
export const updateEmploi = (id, data) => apiPut(`/emploi-temps/${id}`, data);
export const deleteEmploi = (id) => apiDelete(`/emploi-temps/${id}`);
