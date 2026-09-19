const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api/v1";

const PRESENCES_URL =
  `${API_URL}/presences-enseignants`;

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
 * Récupérer les présences des enseignants.
 * Le backend accepte un filtre facultatif par enseignant.
 */
export async function getPresencesEnseignants({
  idEnseignant = null,
} = {}) {
  const params = new URLSearchParams();

  if (idEnseignant) {
    params.set(
      "id_enseignant",
      String(idEnseignant)
    );
  }

  const query = params.toString()
    ? `?${params.toString()}`
    : "";

  const response = await fetch(
    `${PRESENCES_URL}/${query}`
  );

  return handleResponse(response);
}

/**
 * Récupérer une présence précise.
 * Attention : cette route n'est pas exposée actuellement
 * par le backend. Fonction conservée pour usage futur.
 */
export async function getPresenceEnseignant(
  idPresence
) {
  const response = await fetch(
    `${PRESENCES_URL}/${idPresence}`
  );

  return handleResponse(response);
}

/**
 * Créer une présence enseignant.
 */
export async function createPresenceEnseignant(
  data
) {
  const response = await fetch(
    `${PRESENCES_URL}/`,
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
 * Modifier une présence enseignant.
 */
export async function updatePresenceEnseignant(
  idPresence,
  data
) {
  const response = await fetch(
    `${PRESENCES_URL}/${idPresence}`,
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