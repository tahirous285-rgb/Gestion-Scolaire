import { apiGet, apiPost } from "./apiClient";

export const getEvaluations = ({ id_classe, id_periode, idClasse, idPeriode } = {}) =>
  apiGet("/evaluations/", { id_classe: id_classe ?? idClasse, id_periode: id_periode ?? idPeriode });
export const getEvaluation = (id) => apiGet(`/evaluations/${id}`);
export const createEvaluation = (data) => apiPost("/evaluations/", data);
