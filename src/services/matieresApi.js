import { apiDelete, apiGet, apiPost, apiPut, onlyCurrentEstablishment } from "./apiClient";

export const getMatieres = () => apiGet("/matieres/", { skip: 0, limit: 1000 }).then(onlyCurrentEstablishment);
export const getMatiere = (id) => apiGet(`/matieres/${id}`);
export const createMatiere = (data) => apiPost("/matieres/", data);
export const updateMatiere = (id, data) => apiPut(`/matieres/${id}`, data);
export const deleteMatiere = (id) => apiDelete(`/matieres/${id}`);
