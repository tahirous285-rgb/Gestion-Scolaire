import { apiDelete, apiGet, apiPost, apiPut } from "./apiClient";

const PARENTS_URL = "/parents";

/**
 * Récupérer tous les parents
 */
export async function getParents() {
  return apiGet(`${PARENTS_URL}/`);
}

/**
 * Récupérer un parent
 */
export async function getParent(idParent) {
  return apiGet(`${PARENTS_URL}/${idParent}`);
}

/**
 * Créer un parent
 */
export async function createParent(data) {
  return apiPost(`${PARENTS_URL}/`, data);
}

/**
 * Modifier un parent
 */
export async function updateParent(idParent, data) {
  return apiPut(`${PARENTS_URL}/${idParent}`, data);
}

/**
 * Supprimer un parent
 */
export async function deleteParent(idParent) {
  return apiDelete(`${PARENTS_URL}/${idParent}`);
}

/**
 * Lier un parent à un élève
 */
export async function linkParentToEleve(data) {
  return apiPost(`${PARENTS_URL}/lier`, data);
}

/**
 * Récupérer les parents d'un élève
 */
export async function getParentsOfEleve(idEleve) {
  return apiGet(`${PARENTS_URL}/eleve/${idEleve}/parents`);
}