const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api/v1";

const CLASSES_URL = `${API_URL}/classes`;

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
    // Rien à faire si la réponse n'est pas du JSON
  }

  throw new Error(message);
}

export async function getClasses() {
  const response = await fetch(`${CLASSES_URL}/`);
  return handleResponse(response);
}

export async function getClasse(idClasse) {
  const response = await fetch(`${CLASSES_URL}/${idClasse}`);
  return handleResponse(response);
}

export async function createClasse(data) {
  const response = await fetch(`${CLASSES_URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return handleResponse(response);
}

export async function updateClasse(idClasse, data) {
  const response = await fetch(`${CLASSES_URL}/${idClasse}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return handleResponse(response);
}

export async function deleteClasse(idClasse) {
  const response = await fetch(`${CLASSES_URL}/${idClasse}`, {
    method: "DELETE",
  });

  return handleResponse(response);
}