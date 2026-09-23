import { apiGet, apiPost } from "./apiClient";

const EVALUATIONS_URL = "/evaluations";

export async function getEvaluations({
  idClasse = null,
  idPeriode = null,
} = {}) {
  const params = new URLSearchParams();

  if (idClasse) {
    params.set(
      "id_classe",
      String(idClasse)
    );
  }

  if (idPeriode) {
    params.set(
      "id_periode",
      String(idPeriode)
    );
  }

  const query = params.toString()
    ? `?${params.toString()}`
    : "";

  return apiGet(`${EVALUATIONS_URL}/${query}`);
}

export async function getEvaluation(
  idEvaluation
) {
  return apiGet(`${EVALUATIONS_URL}/${idEvaluation}`);
}

export async function createEvaluation(data) {
  return apiPost(`${EVALUATIONS_URL}/`, data);
}