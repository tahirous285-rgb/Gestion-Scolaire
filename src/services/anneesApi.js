import { apiGet, apiPost } from "./apiClient";

const URL = "/annees-scolaires";

export async function getAnnees() {
  return apiGet(`${URL}/`);
}

export async function getAnnee(
  idAnnee
) {
  return apiGet(`${URL}/${idAnnee}`);
}

export async function createAnnee(data) {
  return apiPost(`${URL}/`, data);
}