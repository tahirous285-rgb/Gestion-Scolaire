import { apiGet, apiPost, apiPut } from "./apiClient";

export const getAnnonces = (id_etablissement) =>
  apiGet("/communication/annonces", { id_etablissement });
export const createAnnonce = (data) => apiPost("/communication/annonces", data);

export const getMessages = ({ id_destinataire, id_expediteur } = {}) =>
  apiGet("/communication/messages", { id_destinataire, id_expediteur });
export async function getMessagesForUser(idUtilisateur) {
  const userId = Number(idUtilisateur);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("L’utilisateur de la session est introuvable.");
  }

  const [received, sent] = await Promise.all([
    getMessages({ id_destinataire: userId }),
    getMessages({ id_expediteur: userId }),
  ]);
  return [...new Map([...received, ...sent].map((message) => [message.id_message, message])).values()];
}
export const createMessage = (data) => apiPost("/communication/messages", data);
export const markMessageRead = (id) => apiPut(`/communication/messages/${id}/lire`);

export const getNotifications = (id_utilisateur) =>
  apiGet("/communication/notifications", { id_utilisateur });
export const createNotification = (data) =>
  apiPost("/communication/notifications", data);
export const markNotificationRead = (id) =>
  apiPut(`/communication/notifications/${id}/lire`);
