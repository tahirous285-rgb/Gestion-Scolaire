import { apiGet } from "./apiClient";

export const getDashboard = (idEtablissement) => {
  const id = Number(idEtablissement);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("L’établissement de la session est manquant ou invalide.");
  }

  return apiGet("/dashboard/", { id_etablissement: id });
};
