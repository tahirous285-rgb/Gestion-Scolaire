import { apiDelete, apiGet, apiPost, apiPut } from "./apiClient";

export const getEleves = ({ skip = 0, limit = 100 } = {}) =>
  apiGet("/eleves/", { skip, limit });
export const getEleve = (id) => apiGet(`/eleves/${id}`);
export const createEleve = (data) => apiPost("/eleves/", data);
export const updateEleve = (id, data) => apiPut(`/eleves/${id}`, data);
export const deleteEleve = (id) => apiDelete(`/eleves/${id}`);
