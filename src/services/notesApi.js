import { apiDelete, apiGet, apiPost, apiPut } from "./apiClient";

export const getNotes = ({ id_evaluation, id_inscription, skip = 0, limit = 1000 } = {}) =>
  apiGet("/notes/", { id_evaluation, id_inscription, skip, limit });
export const getNote = (id) => apiGet(`/notes/${id}`);
export const saveEvaluationNotes = (idEvaluation, data) =>
  apiPut(`/notes/evaluation/${idEvaluation}/saisie`, data);
export const createNote = (data) => apiPost("/notes/", data);
export const updateNote = (id, data) => apiPut(`/notes/${id}`, data);
export const deleteNote = (id) => apiDelete(`/notes/${id}`);
