import { apiGet, apiPost } from "./apiClient";

export const getEvaluations = ({
  id_annee,
  id_classe,
  id_matiere,
  id_enseignant,
  id_periode,
  skip = 0,
  limit = 1000,
} = {}) => apiGet("/evaluations/", {
  id_annee,
  id_classe,
  id_matiere,
  id_enseignant,
  id_periode,
  skip,
  limit,
});
export const getEvaluation = (id) => apiGet(`/evaluations/${id}`);
export const createEvaluation = (data) => apiPost("/evaluations/", data);
