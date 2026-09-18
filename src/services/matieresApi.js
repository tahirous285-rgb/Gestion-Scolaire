const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api/v1";

const MATIERES_URL = `${API_URL}/matieres`;

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
    // Rien à faire
  }

  throw new Error(message);
}

export async function getMatieres() {
  const response = await fetch(`${MATIERES_URL}/`);
  return handleResponse(response);
}

export async function getMatiere(idMatiere) {
  const response = await fetch(
    `${MATIERES_URL}/${idMatiere}`
  );

  return handleResponse(response);
}

export async function createMatiere(data) {
  const response = await fetch(`${MATIERES_URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return handleResponse(response);
}

export async function updateMatiere(
  idMatiere,
  data
) {
  const response = await fetch(
    `${MATIERES_URL}/${idMatiere}`,
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

export async function deleteMatiere(idMatiere) {
  const response = await fetch(
    `${MATIERES_URL}/${idMatiere}`,
    {
      method: "DELETE",
    }
  );

  return handleResponse(response);
}