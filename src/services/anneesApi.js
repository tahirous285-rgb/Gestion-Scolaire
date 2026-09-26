import { apiGet, apiPost } from "./apiClient";
export { getPeriodes, createPeriode } from "./periodesApi";

export const getAnnees = () => apiGet("/annees-scolaires/");
export const getAnnee = (id) => apiGet(`/annees-scolaires/${id}`);
export const createAnnee = (data) => apiPost("/annees-scolaires/", data);
