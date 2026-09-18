const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api/v1";

const INSCRIPTIONS_URL =
  `${API_URL}/inscriptions`;

/**
 * Gestion des réponses API
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
    // Rien
  }

  throw new Error(message);
}

/**
 * Toutes les inscriptions
 */
export async function getInscriptions({
  id_eleve = null,
  id_annee = null,
} = {}) {
  const params = new URLSearchParams();

  if (id_eleve) {
    params.append(
      "id_eleve",
      String(id_eleve)
    );
  }

  if (id_annee) {
    params.append(
      "id_annee",
      String(id_annee)
    );
  }

  const query =
    params.toString();

  const url = query
    ? `${INSCRIPTIONS_URL}/?${query}`
    : `${INSCRIPTIONS_URL}/`;

  const response = await fetch(url);

  return handleResponse(response);
}

/**
 * Une inscription
 */
export async function getInscription(
  idInscription
) {
  const response = await fetch(
    `${INSCRIPTIONS_URL}/${idInscription}`
  );

  return handleResponse(response);
}

/**
 * Créer une inscription
 */
export async function createInscription(
  data
) {
  const response = await fetch(
    `${INSCRIPTIONS_URL}/`,
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
 * Modifier une inscription
 */
export async function updateInscription(
  idInscription,
  data
) {
  const response = await fetch(
    `${INSCRIPTIONS_URL}/${idInscription}`,
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
 * Supprimer une inscription
 */
export async function deleteInscription(
  idInscription
) {
  const response = await fetch(
    `${INSCRIPTIONS_URL}/${idInscription}`,
    {
      method: "DELETE",
    }
  );

  return handleResponse(response);
}