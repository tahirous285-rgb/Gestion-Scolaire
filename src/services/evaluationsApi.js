import { apiGet, apiPost } from "./apiClient";

export const getEvaluations = ({ id_classe, id_periode } = {}) =>
  apiGet("/evaluations/", { id_classe, id_periode });
export const getEvaluation = (id) => apiGet(`/evaluations/${id}`);
export const createEvaluation = (data) => apiPost("/evaluations/", data);
