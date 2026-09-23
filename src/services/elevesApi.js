import { apiDelete, apiGet, apiPost, apiPut } from "./apiClient";

const ELEVE_URL = "/eleves";

/**
 * Liste des élèves
 */
export async function getEleves({
  skip = 0,
  limit = 100,
} = {}) {
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });

  return apiGet(`${ELEVE_URL}/?${params.toString()}`);
}

/**
 * Un élève
 */
export async function getEleve(idEleve) {
  return apiGet(`${ELEVE_URL}/${idEleve}`);
}

/**
 * Créer un élève
 */
export async function createEleve(data) {
  return apiPost(`${ELEVE_URL}/`, data);
}

/**
 * Modifier un élève
 */
export async function updateEleve(
  idEleve,
  data
) {
  return apiPut(`${ELEVE_URL}/${idEleve}`, data);
}

/**
 * Supprimer un élève
 */
export async function deleteEleve(idEleve) {
  return apiDelete(`${ELEVE_URL}/${idEleve}`);
}