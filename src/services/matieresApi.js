import { apiDelete, apiGet, apiPost, apiPut } from "./apiClient";

export const getMatieres = () => apiGet("/matieres/");
export const getMatiere = (id) => apiGet(`/matieres/${id}`);
export const createMatiere = (data) => apiPost("/matieres/", data);
export const updateMatiere = (id, data) => apiPut(`/matieres/${id}`, data);
export const deleteMatiere = (id) => apiDelete(`/matieres/${id}`);
