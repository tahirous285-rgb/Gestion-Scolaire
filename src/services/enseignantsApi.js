const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api/v1";

const ENSEIGNANTS_URL = `${API_URL}/enseignants`;

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

export async function getEnseignants({
  skip = 0,
  limit = 1000,
} = {}) {
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });

  const response = await fetch(
    `${ENSEIGNANTS_URL}/?${params.toString()}`
  );

  return handleResponse(response);
}

export async function getEnseignant(idEnseignant) {
  const response = await fetch(
    `${ENSEIGNANTS_URL}/${idEnseignant}`
  );

  return handleResponse(response);
}

export async function createEnseignant(data) {
  const response = await fetch(
    `${ENSEIGNANTS_URL}/`,
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

export async function updateEnseignant(
  idEnseignant,
  data
) {
  const response = await fetch(
    `${ENSEIGNANTS_URL}/${idEnseignant}`,
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

export async function deleteEnseignant(
  idEnseignant
) {
  const response = await fetch(
    `${ENSEIGNANTS_URL}/${idEnseignant}`,
    {
      method: "DELETE",
    }
  );

  return handleResponse(response);
}

export async function linkEnseignantMatiere(data) {
  const response = await fetch(
    `${ENSEIGNANTS_URL}/matieres`,
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

export async function getMatieresOfEnseignant(
  idEnseignant
) {
  const response = await fetch(
    `${ENSEIGNANTS_URL}/${idEnseignant}/matieres`
  );

  return handleResponse(response);
}

export async function linkEnseignantClasse(data) {
  const response = await fetch(
    `${ENSEIGNANTS_URL}/classes`,
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

export async function getClassesOfEnseignant(
  idEnseignant,
  idAnnee = null
) {
  const params = new URLSearchParams();

  if (idAnnee) {
    params.set("id_annee", String(idAnnee));
  }

  const query = params.toString()
    ? `?${params.toString()}`
    : "";

  const response = await fetch(
    `${ENSEIGNANTS_URL}/${idEnseignant}/classes${query}`
  );

  return handleResponse(response);
}