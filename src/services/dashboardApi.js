const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api/v1";

const DASHBOARD_URL = `${API_URL}/dashboard`;

/**
 * Gestion centralisée des réponses API
 */
async function handleResponse(response) {
  if (response.ok) {
    return await response.json();
  }

  let message = `Erreur HTTP ${response.status}`;

  try {
    const data = await response.json();

    if (typeof data?.detail === "string") {
      message = data.detail;
    } else if (Array.isArray(data?.detail)) {
      message = data.detail
        .map((error) => error.msg)
        .join(", ");
    }
  } catch {
    // Réponse non JSON
  }

  throw new Error(message);
}

/**
 * Récupérer les statistiques du Dashboard
 *
 * Endpoint backend :
 * GET /api/v1/dashboard/?id_etablissement=...
 */
export async function getDashboard(idEtablissement) {
  if (!idEtablissement) {
    throw new Error(
      "L'identifiant de l'établissement est obligatoire."
    );
  }

  const params = new URLSearchParams({
    id_etablissement: String(idEtablissement),
  });

  const response = await fetch(
    `${DASHBOARD_URL}/?${params.toString()}`
  );

  return handleResponse(response);
}