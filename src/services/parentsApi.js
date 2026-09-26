import { apiDelete, apiGet, apiPost, apiPut, onlyCurrentEstablishment } from "./apiClient";

export const getParents = () => apiGet("/parents/", { skip: 0, limit: 1000 }).then(onlyCurrentEstablishment);
export const getParent = (id) => apiGet(`/parents/${id}`);
export const createParent = (data) => apiPost("/parents/", data);
export const updateParent = (id, data) => apiPut(`/parents/${id}`, data);
export const deleteParent = (id) => apiDelete(`/parents/${id}`);
export const linkParentToEleve = (data) => apiPost("/parents/lier", data);
export const getParentsOfEleve = (idEleve) => apiGet(`/parents/eleve/${idEleve}/parents`);
