import { useReferenceOptions } from "../../hooks/useReferenceOptions";
import CrudPage from "../../components/common/CrudPage";
import { userId } from "../../services/apiClient";
import { createCarte, generateCarteQr, getCartes, reimprimerCarte } from "../../services/cartesApi";
import { getInscriptions } from "../../services/inscriptionsApi";
import { formatDateTime, formatDate, optionsFrom } from "../pageUtils";

export default function CartesScolaires() {
  const refs = useReferenceOptions({ inscriptions: getInscriptions }, "cartes");
  const fields = [
    { name: "id_inscription", label: "Inscription", type: "select", required: true, options: optionsFrom(refs.inscriptions, "id_inscription", (row) => `Inscription #${row.id_inscription} — élève #${row.id_eleve}`) },
    { name: "date_expiration", label: "Date d’expiration", type: "date" },
  ];
  return <CrudPage title="Cartes scolaires" subtitle="Génération et réimpression des cartes d’inscription." icon="🪪" columns={[{ key: "numero_carte", label: "N° carte" }, { key: "id_inscription", label: "Inscription" }, { key: "date_generation", label: "Générée le", render: (row) => formatDateTime(row.date_generation) }, { key: "date_expiration", label: "Expiration", render: (row) => formatDate(row.date_expiration) }, { key: "statut", label: "Statut" }, { key: "nombre_reeditions", label: "Rééditions" }, { key: "fichier", label: "Fichier", render: (row) => row.fichier ? "Disponible" : "—" }]} fields={fields} initialForm={{ id_inscription: "", date_expiration: "" }} load={() => getCartes()} create={createCarte} createPayload={(data) => ({ ...data, id_generateur: userId() })} extraActions={(row, { runAction, busy }) => <><button type="button" disabled={busy} onClick={() => runAction(() => reimprimerCarte(row.id_carte))}>🖨 Réimprimer</button><button type="button" disabled={busy} onClick={() => runAction(() => generateCarteQr(row.id_carte))}>▣ Générer QR</button></>} canUpdate={false} canDelete={false} rowKey="id_carte" createLabel="Nouvelle carte" searchKeys={["numero_carte", "id_inscription", "statut", "qr_token"]} emptyText="Aucune carte scolaire." />;
}
