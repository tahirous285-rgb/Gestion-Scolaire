const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api/v1";

const URL =
  `${API_URL}/annees-scolaires`;

async function handleResponse(response) {
  if (response.ok) {
    return await response.json();
  }

  let message =
    `Erreur HTTP ${response.status}`;

  try {
    const data = await response.json();

    if (typeof data?.detail === "string") {
      message = data.detail;
    }
  } catch {
    // Rien
  }

  throw new Error(message);
}

export async function getAnnees() {
  const response =
    await fetch(`${URL}/`);

  return handleResponse(response);
}

export async function getAnnee(
  idAnnee
) {
  const response =
    await fetch(`${URL}/${idAnnee}`);

  return handleResponse(response);
}

export async function createAnnee(data) {
  const response = await fetch(`${URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return handleResponse(response);
}