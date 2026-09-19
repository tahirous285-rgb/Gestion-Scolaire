const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api/v1";

const NOTES_URL = `${API_URL}/notes`;

async function handleResponse(response) {
  if (response.ok) {
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  }

  let message = `Erreur HTTP ${response.status}`;

  try {
    const errorData = await response.json();

    if (typeof errorData?.detail === "string") {
      message = errorData.detail;
    } else if (Array.isArray(errorData?.detail)) {
      message = errorData.detail
        .map((error) => error.msg)
        .join(", ");
    }
  } catch {
    // Réponse non JSON
  }

  throw new Error(message);
}

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

  const response = await fetch(
    `${NOTES_URL}/${query}`
  );

  return handleResponse(response);
}

export async function getNote(idNote) {
  const response = await fetch(
    `${NOTES_URL}/${idNote}`
  );

  return handleResponse(response);
}

export async function createNote(data) {
  const response = await fetch(
    `${NOTES_URL}/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  return handleResponse(response);
}

export async function updateNote(idNote, data) {
  const response = await fetch(
    `${NOTES_URL}/${idNote}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  return handleResponse(response);
}

export async function deleteNote(idNote) {
  const response = await fetch(
    `${NOTES_URL}/${idNote}`,
    {
      method: "DELETE",
    }
  );

  return handleResponse(response);
}