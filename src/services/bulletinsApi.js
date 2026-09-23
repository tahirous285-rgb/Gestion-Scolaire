const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api/v1";

const BULLETINS_URL =
  `${API_URL}/bulletins`;

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

export async function getBulletins({
  idInscription = null,
  idPeriode = null,
} = {}) {
  const params = new URLSearchParams();

  if (idInscription) {
    params.set(
      "id_inscription",
      String(idInscription)
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
    `${BULLETINS_URL}/${query}`
  );

  return handleResponse(response);
}

export async function getBulletin(idBulletin) {
  const response = await fetch(
    `${BULLETINS_URL}/${idBulletin}`
  );

  return handleResponse(response);
}

export async function createBulletin(data) {
  const response = await fetch(
    `${BULLETINS_URL}/`,
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

export async function updateBulletin(
  idBulletin,
  data
) {
  const response = await fetch(
    `${BULLETINS_URL}/${idBulletin}`,
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

export async function generateBulletinPdf(idBulletin) {
  const response = await fetch(
    `${BULLETINS_URL}/${idBulletin}/generer-pdf`,
    {
      method: "PUT",
    }
  );

  return handleResponse(response);
}