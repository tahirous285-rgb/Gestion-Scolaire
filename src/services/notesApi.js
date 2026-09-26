import { apiDelete, apiGet, apiPost, apiPut } from "./apiClient";

export const getNotes = ({ id_evaluation, id_inscription, idEvaluation, idInscription } = {}) =>
  apiGet("/notes/", {
    id_evaluation: id_evaluation ?? idEvaluation,
    id_inscription: id_inscription ?? idInscription,
  });
export const getNote = (id) => apiGet(`/notes/${id}`);
export const createNote = (data) => apiPost("/notes/", data);
export const updateNote = (id, data) => apiPut(`/notes/${id}`, data);
export const deleteNote = (id) => apiDelete(`/notes/${id}`);
