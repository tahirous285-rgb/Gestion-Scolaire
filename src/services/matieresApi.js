import { apiDelete, apiGet, apiPost, apiPut } from "./apiClient";

const MATIERES_URL = "/matieres";

export async function getMatieres() {
  return apiGet(`${MATIERES_URL}/`);
}

export async function getMatiere(idMatiere) {
  return apiGet(`${MATIERES_URL}/${idMatiere}`);
}

export async function createMatiere(data) {
  return apiPost(`${MATIERES_URL}/`, data);
}

export async function updateMatiere(
  idMatiere,
  data
) {
  return apiPut(`${MATIERES_URL}/${idMatiere}`, data);
}

export async function deleteMatiere(idMatiere) {
  return apiDelete(`${MATIERES_URL}/${idMatiere}`);
}