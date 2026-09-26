import { apiDelete, apiGet, apiPost, apiPut } from "./apiClient";

export const getEmplois = ({ id_classe, id_enseignant, id_annee, idClasse, idEnseignant, idAnnee } = {}) =>
  apiGet("/emploi-temps/", {
    id_classe: id_classe ?? idClasse,
    id_enseignant: id_enseignant ?? idEnseignant,
    id_annee: id_annee ?? idAnnee,
  });
export const getEmploi = (id) => apiGet(`/emploi-temps/${id}`);
export const createEmploi = (data) => apiPost("/emploi-temps/", data);
export const updateEmploi = (id, data) => apiPut(`/emploi-temps/${id}`, data);
export const deleteEmploi = (id) => apiDelete(`/emploi-temps/${id}`);
