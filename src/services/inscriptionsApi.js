import { apiDelete, apiGet, apiPost, apiPut, establishmentId } from "./apiClient";
import { getEleves } from "./elevesApi";

// Les inscriptions n'ont pas d'id_etablissement : on ne garde que celles
// dont l'élève appartient à l'établissement de la session.
export const getInscriptions = async ({ id_eleve, id_annee, idEleve, idAnnee } = {}) => {
  const [inscriptions, eleves] = await Promise.all([
    apiGet("/inscriptions/", { id_eleve: id_eleve ?? idEleve, id_annee: id_annee ?? idAnnee }),
    establishmentId() ? getEleves().catch(() => null) : null,
  ]);
  if (!Array.isArray(inscriptions) || !Array.isArray(eleves)) return inscriptions;
  const ids = new Set(eleves.map((e) => String(e.id_eleve)));
  return inscriptions.filter((i) => ids.has(String(i.id_eleve)));
};
export const getInscription = (id) => apiGet(`/inscriptions/${id}`);
export const createInscription = (data) => apiPost("/inscriptions/", data);
export const updateInscription = (id, data) => apiPut(`/inscriptions/${id}`, data);
export const deleteInscription = (id) => apiDelete(`/inscriptions/${id}`);
