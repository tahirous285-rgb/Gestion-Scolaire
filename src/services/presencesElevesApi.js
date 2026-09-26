import { apiGet, apiPost, apiPut } from "./apiClient";

function inscriptionParam(value) {
  if (value && typeof value === "object") return value.id_inscription ?? value.idInscription;
  return value;
}

export const getPresencesEleves = (filter) =>
  apiGet("/presences-eleves/", { id_inscription: inscriptionParam(filter) });
export const createPresenceEleve = (data) => apiPost("/presences-eleves/", data);
export const updatePresenceEleve = (id, data) => apiPut(`/presences-eleves/${id}`, data);

// Alias utilisés par les anciennes pages.
export const getPresences = getPresencesEleves;
export const createPresence = createPresenceEleve;
export const updatePresence = updatePresenceEleve;
