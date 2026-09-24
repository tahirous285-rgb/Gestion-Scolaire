import { apiDelete, apiGet, apiPost, apiPut } from "./apiClient";

export const getEtablissements = ({ skip = 0, limit = 100 } = {}) =>
  apiGet("/etablissements/", { skip, limit });
export const getEtablissement = (id) => apiGet(`/etablissements/${id}`);
export const createEtablissement = (data) => apiPost("/etablissements/", data);
export const updateEtablissement = (id, data) => apiPut(`/etablissements/${id}`, data);
export const deleteEtablissement = (id) => apiDelete(`/etablissements/${id}`);

export const getRoles = () => apiGet("/roles/");
export const createRole = (data) => apiPost("/roles/", data);

export const getUtilisateurs = ({ skip = 0, limit = 100 } = {}) =>
  apiGet("/utilisateurs/", { skip, limit });
export const getUtilisateur = (id) => apiGet(`/utilisateurs/${id}`);
export const createUtilisateur = (data) => apiPost("/utilisateurs/", data);
export const updateUtilisateur = (id, data) => apiPut(`/utilisateurs/${id}`, data);
export const deleteUtilisateur = (id) => apiDelete(`/utilisateurs/${id}`);

export const getParametres = (idEtablissement) =>
  apiGet("/parametres/", { id_etablissement: idEtablissement });
export const createParametre = (data) => apiPost("/parametres/", data);
export const updateParametre = (id, data) => apiPut(`/parametres/${id}`, data);

export const getJournal = ({ idEtablissement, limit = 20 }) =>
  apiGet("/journal/", { id_etablissement: idEtablissement, limit });
export const createJournalEntry = (data) => apiPost("/journal/", data);
