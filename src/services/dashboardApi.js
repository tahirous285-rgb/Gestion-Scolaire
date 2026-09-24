import { apiGet } from "./apiClient";

export const getDashboard = (id_etablissement) =>
  apiGet("/dashboard/", { id_etablissement });
