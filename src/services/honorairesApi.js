import { apiGet, apiPost, apiPut } from "./apiClient";

export const getMois = () => apiGet("/honoraires/mois");
export const createMois = (data) => apiPost("/honoraires/mois", data);
export const getHonoraires = ({ id_enseignant, id_annee } = {}) =>
  apiGet("/honoraires/", { id_enseignant, id_annee });
export const getHonoraire = (id) => apiGet(`/honoraires/${id}`);
export const createHonoraire = (data) => apiPost("/honoraires/", data);
export const updateHonoraire = (id, data) => apiPut(`/honoraires/${id}`, data);
export const createPaiementHonoraire = (data) => apiPost("/honoraires/paiements", data);
export const getPaiementsHonoraire = (id) => apiGet(`/honoraires/${id}/paiements`);
