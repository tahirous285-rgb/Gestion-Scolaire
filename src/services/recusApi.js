import { apiGet, apiPut } from "./apiClient";

export const getRecuByPaiement = (id) => apiGet(`/recus/paiement/${id}`);
export const printRecu = (id, id_imprimeur) =>
  apiPut(`/recus/${id}/imprimer?id_imprimeur=${encodeURIComponent(id_imprimeur)}`);
export const generateRecuPdf = (id) => apiPut(`/recus/${id}/generer-pdf`);
