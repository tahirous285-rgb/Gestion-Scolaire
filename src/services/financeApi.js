import { apiGet, apiPost, apiPut } from "./apiClient";

export const getTypesFrais = (id_etablissement) =>
  apiGet("/frais-scolaires/types", { id_etablissement });
export const createTypeFrais = (data) => apiPost("/frais-scolaires/types", data);
export const getFrais = ({ id_inscription, id_annee } = {}) =>
  apiGet("/frais-scolaires/", { id_inscription, id_annee });
export const createFrais = (data) => apiPost("/frais-scolaires/", data);

export const getPaiements = (id_inscription) => apiGet("/paiements/", { id_inscription });
export const getPaiement = (id) => apiGet(`/paiements/${id}`);
export const createPaiement = (data) => apiPost("/paiements/", data);

export const getRecuByPaiement = (id) => apiGet(`/recus/paiement/${id}`);
export const printRecu = (id, id_imprimeur) =>
  apiPut(`/recus/${id}/imprimer?id_imprimeur=${encodeURIComponent(id_imprimeur)}`);
export const generateRecuPdf = (id) => apiPut(`/recus/${id}/generer-pdf`);

export const getDepenses = (id_etablissement) =>
  apiGet("/depenses/", { id_etablissement });
export const createDepense = (data) => apiPost("/depenses/", data);
