import { apiGet, apiPost } from "./apiClient";

// Accepte getPeriodes(idAnnee) ou getPeriodes({ id_annee }).
export function getPeriodes(filter = null) {
  const idAnnee = filter && typeof filter === "object" ? filter.id_annee ?? filter.idAnnee : filter;
  return apiGet("/periodes/", { id_annee: idAnnee });
}
export const createPeriode = (data) => apiPost("/periodes/", data);
