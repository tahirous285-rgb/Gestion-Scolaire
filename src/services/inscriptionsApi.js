import { apiDelete, apiGet, apiPost, apiPut } from "./apiClient";

const INSCRIPTIONS_URL = "/inscriptions";

/**
 * Gestion des réponses API
 */
/**
 * Toutes les inscriptions
 */
export async function getInscriptions({
  id_eleve = null,
  id_annee = null,
} = {}) {
  const params = new URLSearchParams();

  if (id_eleve) {
    params.append(
      "id_eleve",
      String(id_eleve)
    );
  }

  if (id_annee) {
    params.append(
      "id_annee",
      String(id_annee)
    );
  }

  const query =
    params.toString();

  const url = query
    ? `${INSCRIPTIONS_URL}/?${query}`
    : `${INSCRIPTIONS_URL}/`;

  return apiGet(url);
}

/**
 * Une inscription
 */
export async function getInscription(
  idInscription
) {
  return apiGet(`${INSCRIPTIONS_URL}/${idInscription}`);
}

/**
 * Créer une inscription
 */
export async function createInscription(
  data
) {
  return apiPost(`${INSCRIPTIONS_URL}/`, data);
}

/**
 * Modifier une inscription
 */
export async function updateInscription(
  idInscription,
  data
) {
  return apiPut(`${INSCRIPTIONS_URL}/${idInscription}`, data);
}

/**
 * Supprimer une inscription
 */
export async function deleteInscription(
  idInscription
) {
  return apiDelete(`${INSCRIPTIONS_URL}/${idInscription}`);
}