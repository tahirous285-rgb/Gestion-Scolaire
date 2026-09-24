import { apiGet, apiPost, apiPut } from "./apiClient";

export const getBulletins = ({ id_inscription, id_periode } = {}) =>
  apiGet("/bulletins/", { id_inscription, id_periode });
export const getBulletin = (id) => apiGet(`/bulletins/${id}`);
export const createBulletin = (data) => apiPost("/bulletins/", data);
export const updateBulletin = (id, data) => apiPut(`/bulletins/${id}`, data);
export const generateBulletinPdf = (id) => apiPut(`/bulletins/${id}/generer-pdf`);
