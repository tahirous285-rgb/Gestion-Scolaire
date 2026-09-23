import { apiDelete, apiGet, apiPost, apiPut } from "./apiClient";

const CLASSES_URL = "/classes";

export async function getClasses() {
  return apiGet(`${CLASSES_URL}/`);
}

export async function getClasse(idClasse) {
  return apiGet(`${CLASSES_URL}/${idClasse}`);
}

export async function createClasse(data) {
  return apiPost(`${CLASSES_URL}/`, data);
}

export async function updateClasse(idClasse, data) {
  return apiPut(`${CLASSES_URL}/${idClasse}`, data);
}

export async function deleteClasse(idClasse) {
  return apiDelete(`${CLASSES_URL}/${idClasse}`);
}