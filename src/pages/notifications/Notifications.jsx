import CrudPage from "../../components/common/CrudPage";
import { establishmentId, userId } from "../../services/apiClient";
import { createNotification, getNotifications, markNotificationRead } from "../../services/communicationApi";
import { formatDateTime } from "../pageUtils";

const fields = [
  { name: "titre", label: "Titre", required: true },
  { name: "contenu", label: "Contenu", type: "textarea", full: true },
  { name: "type", label: "Type" },
  { name: "lien", label: "Lien" },
];

export default function Notifications() {
  const idEtablissement = establishmentId();
  const idUtilisateur = userId();
  return <CrudPage title="Notifications" subtitle="Notifications reçues par l’utilisateur connecté." icon="🔔" columns={[{ key: "titre", label: "Titre" }, { key: "contenu", label: "Contenu" }, { key: "type", label: "Type" }, { key: "date_creation", label: "Créée le", render: (row) => formatDateTime(row.date_creation) }, { key: "lue", label: "Lue", render: (row) => row.lue ? "Oui" : "Non" }]} fields={fields} initialForm={{ id_etablissement: idEtablissement || "", id_utilisateur: idUtilisateur || "", titre: "", contenu: "", type: "", lien: "" }} load={() => getNotifications(idUtilisateur)} create={createNotification} createPayload={(data) => ({ ...data, id_etablissement: idEtablissement, id_utilisateur: idUtilisateur })} extraActions={(row, { runAction, busy }) => !row.lue && <button type="button" disabled={busy} onClick={() => runAction(() => markNotificationRead(row.id_notification))}>✓ Marquer lue</button>} canUpdate={false} canDelete={false} rowKey="id_notification" createLabel="Nouvelle notification" searchKeys={["titre", "contenu", "type"]} emptyText="Aucune notification." />;
}
