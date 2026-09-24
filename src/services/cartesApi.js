import { apiGet, apiPost, apiPut } from "./apiClient";

export const getCartes = (id_inscription) =>
  apiGet("/cartes-scolaires/", { id_inscription });
export const getCarte = (id) => apiGet(`/cartes-scolaires/${id}`);
export const createCarte = (data) => apiPost("/cartes-scolaires/", data);
export const reimprimerCarte = (id) => apiPut(`/cartes-scolaires/${id}/reimprimer`);
export const generateCarteQr = (id) => apiPut(`/cartes-scolaires/${id}/generer-qr`);
