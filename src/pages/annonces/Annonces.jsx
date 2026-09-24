import CrudPage from "../../components/common/CrudPage";
import { establishmentId, userId } from "../../services/apiClient";
import { createAnnonce, getAnnonces } from "../../services/communicationApi";
import { formatDateTime } from "../pageUtils";

const fields = [
  { name: "titre", label: "Titre", required: true },
  { name: "contenu", label: "Contenu", type: "textarea", required: true, full: true },
  { name: "date_expiration", label: "Date d’expiration", type: "datetime-local" },
  { name: "publiee", label: "Annonce publiée", type: "checkbox", default: true },
];

export default function Annonces() {
  const idEtablissement = establishmentId();
  return <CrudPage title="Annonces" subtitle="Communications publiées pour l’établissement." icon="📣" columns={[{ key: "titre", label: "Titre" }, { key: "contenu", label: "Contenu" }, { key: "date_publication", label: "Publiée le", render: (row) => formatDateTime(row.date_publication) }, { key: "date_expiration", label: "Expire le", render: (row) => formatDateTime(row.date_expiration) }, { key: "publiee", label: "Publiée", render: (row) => row.publiee ? "Oui" : "Non" }]} fields={fields} initialForm={{ id_etablissement: idEtablissement || "", id_auteur: userId() || "", titre: "", contenu: "", date_expiration: "", publiee: true }} load={() => getAnnonces(idEtablissement)} create={createAnnonce} createPayload={(data) => ({ ...data, id_etablissement: idEtablissement, id_auteur: userId() })} canUpdate={false} canDelete={false} rowKey="id_annonce" createLabel="Nouvelle annonce" searchKeys={["titre", "contenu"]} emptyText="Aucune annonce." />;
}
