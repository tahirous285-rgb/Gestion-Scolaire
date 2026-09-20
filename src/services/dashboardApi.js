import { apiGet } from "./apiClient";

export const getDashboard = (idEtablissement) =>
  apiGet(`/dashboard/?id_etablissement=${encodeURIComponent(idEtablissement)}`);
