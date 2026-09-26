import { apiDelete, apiGet, apiPost, apiPut, onlyCurrentEstablishment } from "./apiClient";

export const getClasses = () => apiGet("/classes/", { skip: 0, limit: 1000 }).then(onlyCurrentEstablishment);
export const getClasse = (id) => apiGet(`/classes/${id}`);
export const createClasse = (data) => apiPost("/classes/", data);
export const updateClasse = (id, data) => apiPut(`/classes/${id}`, data);
export const deleteClasse = (id) => apiDelete(`/classes/${id}`);
