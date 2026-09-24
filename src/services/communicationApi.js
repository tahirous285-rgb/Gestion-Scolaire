import { apiGet, apiPost, apiPut } from "./apiClient";

export const getAnnonces = (id_etablissement) =>
  apiGet("/communication/annonces", { id_etablissement });
export const createAnnonce = (data) => apiPost("/communication/annonces", data);

export const getMessages = ({ id_destinataire, id_expediteur } = {}) =>
  apiGet("/communication/messages", { id_destinataire, id_expediteur });
export const createMessage = (data) => apiPost("/communication/messages", data);
export const markMessageRead = (id) => apiPut(`/communication/messages/${id}/lire`);

export const getNotifications = (id_utilisateur) =>
  apiGet("/communication/notifications", { id_utilisateur });
export const createNotification = (data) =>
  apiPost("/communication/notifications", data);
export const markNotificationRead = (id) =>
  apiPut(`/communication/notifications/${id}/lire`);
