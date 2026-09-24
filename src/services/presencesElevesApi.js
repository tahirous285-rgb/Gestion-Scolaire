import { apiGet, apiPost, apiPut } from "./apiClient";

export const getPresencesEleves = (id_inscription) =>
  apiGet("/presences-eleves/", { id_inscription });
export const createPresenceEleve = (data) => apiPost("/presences-eleves/", data);
export const updatePresenceEleve = (id, data) => apiPut(`/presences-eleves/${id}`, data);
