import { apiGet, apiPost } from "./apiClient";
export {
  getPresencesEnseignants,
  createPresenceEnseignant,
  updatePresenceEnseignant,
} from "./presencesEnseignantsApi";

export const getCoursEffectues = ({ id_enseignant, id_classe } = {}) =>
  apiGet("/cours-effectues/", { id_enseignant, id_classe });
export const createCoursEffectue = (data) => apiPost("/cours-effectues/", data);
