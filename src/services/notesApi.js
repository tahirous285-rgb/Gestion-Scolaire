import { apiDelete, apiGet, apiPost, apiPut } from "./apiClient";

const NOTES_URL = "/notes";

export async function getNotes({
  idEvaluation = null,
  idInscription = null,
} = {}) {
  const params = new URLSearchParams();

  if (idEvaluation) {
    params.set(
      "id_evaluation",
      String(idEvaluation)
    );
  }

  if (idInscription) {
    params.set(
      "id_inscription",
      String(idInscription)
    );
  }

  const query = params.toString()
    ? `?${params.toString()}`
    : "";

  return apiGet(`${NOTES_URL}/${query}`);
}

export async function getNote(idNote) {
  return apiGet(`${NOTES_URL}/${idNote}`);
}

export async function createNote(data) {
  return apiPost(`${NOTES_URL}/`, data);
}

export async function updateNote(idNote, data) {
  return apiPut(`${NOTES_URL}/${idNote}`, data);
}

export async function deleteNote(idNote) {
  return apiDelete(`${NOTES_URL}/${idNote}`);
}