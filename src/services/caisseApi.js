import { apiGet, apiPost } from "./apiClient";

export const getCaisseResume = (id_etablissement, date_jour) =>
  apiGet("/caisse/resume", { id_etablissement, date_jour });

export const getCaisseMouvements = ({
  id_etablissement,
  date_debut,
  date_fin,
  sens,
}) => apiGet("/caisse/mouvements", {
  id_etablissement,
  date_debut,
  date_fin,
  sens,
});

export const getCaisseClotures = (id_etablissement) =>
  apiGet("/caisse/clotures", { id_etablissement });

export const initialiserCaisse = (data) => apiPost("/caisse/initialiser", data);

export const cloturerCaisse = (data) => apiPost("/caisse/clotures", data);

export const rouvrirCaisse = (id, motif_reouverture) =>
  apiPost(`/caisse/clotures/${encodeURIComponent(id)}/reouvrir`, {
    motif_reouverture,
  });
