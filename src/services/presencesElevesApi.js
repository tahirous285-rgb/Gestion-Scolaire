import { apiGet, apiPost, apiPut } from "./apiClient";

export const getPresencesEleves = ({ id_inscription, id_annee, id_classe, date_presence } = {}) =>
  apiGet("/presences-eleves/", { id_inscription, id_annee, id_classe, date_presence });
export const saveAppelPresences = (data) => apiPost("/presences-eleves/appel", data);
export const createPresenceEleve = (data) => apiPost("/presences-eleves/", data);
export const updatePresenceEleve = (id, data) => apiPut(`/presences-eleves/${id}`, data);
