import { apiGet } from "./apiClient";

const DASHBOARD_URL = "/dashboard/";

/**
 * Récupérer les statistiques du Dashboard
 *
 * @param {number|null} idEtablissement - ID de l'établissement
 * @returns {Promise<Object>}
 */
export async function getDashboard(idEtablissement) {
  if (!idEtablissement) {
    throw new Error(
      "Aucun établissement n'est associé à la session actuelle."
    );
  }

  const params = new URLSearchParams({
    id_etablissement: String(idEtablissement),
  });

  return apiGet(`${DASHBOARD_URL}?${params.toString()}`);
}