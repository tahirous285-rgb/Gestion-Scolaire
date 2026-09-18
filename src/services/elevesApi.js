const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api/v1";

const ELEVE_URL = `${API_URL}/eleves`;

/**
 * Gestion centralisée des réponses API
 */
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

/**
 * Liste des élèves
 */
export async function getEleves({
  skip = 0,
  limit = 100,
} = {}) {
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });

  const response = await fetch(
    `${ELEVE_URL}/?${params.toString()}`
  );

  return handleResponse(response);
}

/**
 * Un élève
 */
export async function getEleve(idEleve) {
  const response = await fetch(
    `${ELEVE_URL}/${idEleve}`
  );

  return handleResponse(response);
}

/**
 * Créer un élève
 */
export async function createEleve(data) {
  const response = await fetch(
    `${ELEVE_URL}/`,
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

/**
 * Modifier un élève
 */
export async function updateEleve(
  idEleve,
  data
) {
  const response = await fetch(
    `${ELEVE_URL}/${idEleve}`,
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

/**
 * Supprimer un élève
 */
export async function deleteEleve(idEleve) {
  const response = await fetch(
    `${ELEVE_URL}/${idEleve}`,
    {
      method: "DELETE",
    }
  );

  return handleResponse(response);
}