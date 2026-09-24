import { apiGet, apiPost } from "./apiClient";

export const getAnnees = () => apiGet("/annees-scolaires/");
export const getAnnee = (id) => apiGet(`/annees-scolaires/${id}`);
export const createAnnee = (data) => apiPost("/annees-scolaires/", data);

export const getPeriodes = ({ id_annee } = {}) => apiGet("/periodes/", { id_annee });
export const createPeriode = (data) => apiPost("/periodes/", data);
