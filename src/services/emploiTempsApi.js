const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api/v1";

const EMPLOI_URL =
  `${API_URL}/emploi-temps`;

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
  } catch {}

  throw new Error(message);
}

export async function getEmplois({
  idClasse = null,
  idEnseignant = null,
  idAnnee = null,
} = {}) {
  const params = new URLSearchParams();

  if (idClasse) {
    params.set(
      "id_classe",
      String(idClasse)
    );
  }

  if (idEnseignant) {
    params.set(
      "id_enseignant",
      String(idEnseignant)
    );
  }

  if (idAnnee) {
    params.set(
      "id_annee",
      String(idAnnee)
    );
  }

  const query = params.toString()
    ? `?${params.toString()}`
    : "";

  const response = await fetch(
    `${EMPLOI_URL}/${query}`
  );

  return handleResponse(response);
}

export async function getEmploi(idEmploi) {
  const response = await fetch(
    `${EMPLOI_URL}/${idEmploi}`
  );

  return handleResponse(response);
}

export async function createEmploi(data) {
  const response = await fetch(
    `${EMPLOI_URL}/`,
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

export async function updateEmploi(
  idEmploi,
  data
) {
  const response = await fetch(
    `${EMPLOI_URL}/${idEmploi}`,
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

export async function deleteEmploi(idEmploi) {
  const response = await fetch(
    `${EMPLOI_URL}/${idEmploi}`,
    {
      method: "DELETE",
    }
  );

  return handleResponse(response);
}