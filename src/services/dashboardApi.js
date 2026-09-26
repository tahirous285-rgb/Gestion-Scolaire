import { apiGet } from "./apiClient";

export function getDashboard(idEtablissement) {
  if (!idEtablissement) {
    return Promise.reject(new Error("Aucun établissement n'est associé à la session actuelle."));
  }
  return apiGet("/dashboard/", { id_etablissement: idEtablissement });
}
