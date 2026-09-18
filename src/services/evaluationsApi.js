const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api/v1";

const EVALUATIONS_URL =
  `${API_URL}/evaluations`;

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

export async function getEvaluations({
  idClasse = null,
  idPeriode = null,
} = {}) {
  const params = new URLSearchParams();

  if (idClasse) {
    params.set(
      "id_classe",
      String(idClasse)
    );
  }

  if (idPeriode) {
    params.set(
      "id_periode",
      String(idPeriode)
    );
  }

  const query = params.toString()
    ? `?${params.toString()}`
    : "";

  const response = await fetch(
    `${EVALUATIONS_URL}/${query}`
  );

  return handleResponse(response);
}

export async function getEvaluation(
  idEvaluation
) {
  const response = await fetch(
    `${EVALUATIONS_URL}/${idEvaluation}`
  );

  return handleResponse(response);
}

export async function createEvaluation(data) {
  const response = await fetch(
    `${EVALUATIONS_URL}/`,
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