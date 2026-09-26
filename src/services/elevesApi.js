import { apiDelete, apiGet, apiPost, apiPut, onlyCurrentEstablishment } from "./apiClient";

export const getEleves = ({ skip = 0, limit = 1000 } = {}) =>
  apiGet("/eleves/", { skip, limit }).then(onlyCurrentEstablishment);
export const getEleve = (id) => apiGet(`/eleves/${id}`);
export const createEleve = (data) => apiPost("/eleves/", data);
export const updateEleve = (id, data) => apiPut(`/eleves/${id}`, data);
export const deleteEleve = (id) => apiDelete(`/eleves/${id}`);
