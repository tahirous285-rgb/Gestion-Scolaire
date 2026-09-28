import { apiGet, apiPost } from "./apiClient";

// Le routeur observations_enseignants est enregistré dans app/api/v1/api.py
// (backend `Projet-Ecole`, commit « Ajout du module Observations enseignants »).
// Il n'expose que la liste filtrable et la création : pas de PUT ni de DELETE.
export const getObservations = (id_enseignant) =>
  apiGet("/observations-enseignants/", { id_enseignant });
export const createObservation = (data) => apiPost("/observations-enseignants/", data);
