const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api/v1";

const PARENTS_URL = `${API_URL}/parents`;

async function handleResponse(response) {
  if (response.ok) {
    if (response.status === 204) {
      return null;
    }

    return response.json();
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
    // Rien à faire si la réponse n'est pas du JSON
  }

  throw new Error(message);
}

/**
 * Récupérer tous les parents
 */
export async function getParents() {
  const response = await fetch(`${PARENTS_URL}/`);

  return handleResponse(response);
}

/**
 * Récupérer un parent
 */
export async function getParent(idParent) {
  const response = await fetch(
    `${PARENTS_URL}/${idParent}`
  );

  return handleResponse(response);
}

/**
 * Créer un parent
 */
export async function createParent(data) {
  const response = await fetch(`${PARENTS_URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return handleResponse(response);
}

/**
 * Modifier un parent
 */
export async function updateParent(idParent, data) {
  const response = await fetch(
    `${PARENTS_URL}/${idParent}`,
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
 * Supprimer un parent
 */
export async function deleteParent(idParent) {
  const response = await fetch(
    `${PARENTS_URL}/${idParent}`,
    {
      method: "DELETE",
    }
  );

  return handleResponse(response);
}

/**
 * Lier un parent à un élève
 */
export async function linkParentToEleve(data) {
  const response = await fetch(
    `${PARENTS_URL}/lier`,
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
 * Récupérer les parents d'un élève
 */
export async function getParentsOfEleve(idEleve) {
  const response = await fetch(
    `${PARENTS_URL}/eleve/${idEleve}/parents`
  );

  return handleResponse(response);
}