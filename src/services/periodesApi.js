const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api/v1";

const PERIODES_URL =
  `${API_URL}/periodes`;

async function handleResponse(response) {
  if (response.ok) {
    return await response.json();
  }

  let message = `Erreur HTTP ${response.status}`;

  try {
    const data = await response.json();

    if (typeof data?.detail === "string") {
      message = data.detail;
    }
  } catch {}

  throw new Error(message);
}

export async function getPeriodes(
  idAnnee = null
) {
  const params = new URLSearchParams();

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
    `${PERIODES_URL}/${query}`
  );

  return handleResponse(response);
}

export async function createPeriode(data) {
  const response = await fetch(`${PERIODES_URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return handleResponse(response);
}