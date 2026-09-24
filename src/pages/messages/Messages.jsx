import CrudPage from "../../components/common/CrudPage";
import { establishmentId, userId } from "../../services/apiClient";
import { createMessage, getMessages, markMessageRead } from "../../services/communicationApi";
import { getUtilisateurs } from "../../services/administrationApi";
import { optionsFrom, formatDateTime } from "../pageUtils";
import { useReferenceOptions } from "../../hooks/useReferenceOptions";

export default function Messages() {
  const idEtablissement = establishmentId();
  const refs = useReferenceOptions({ utilisateurs: getUtilisateurs }, "messages");
  const fields = [
    { name: "id_destinataire", label: "Destinataire", type: "select", required: true, options: optionsFrom(refs.utilisateurs, "id_utilisateur", (row) => `${row.prenom} ${row.nom} (#${row.id_utilisateur})`) },
    { name: "objet", label: "Objet" },
    { name: "contenu", label: "Contenu", type: "textarea", required: true, full: true },
  ];
  return <CrudPage title="Messages" subtitle="Messages envoyés et reçus par les utilisateurs de l’établissement." icon="💬" columns={[{ key: "id_expediteur", label: "Expéditeur" }, { key: "id_destinataire", label: "Destinataire" }, { key: "objet", label: "Objet" }, { key: "contenu", label: "Contenu" }, { key: "date_envoi", label: "Envoyé le", render: (row) => formatDateTime(row.date_envoi) }, { key: "lu", label: "Lu", render: (row) => row.lu ? "Oui" : "Non" }]} fields={fields} initialForm={{ id_etablissement: idEtablissement || "", id_expediteur: userId() || "", id_destinataire: "", objet: "", contenu: "" }} load={() => getMessages()} create={createMessage} createPayload={(data) => ({ ...data, id_etablissement: idEtablissement, id_expediteur: userId() })} extraActions={(row, { runAction, busy }) => !row.lu && <button type="button" disabled={busy} onClick={() => runAction(() => markMessageRead(row.id_message))}>✓ Marquer lu</button>} canUpdate={false} canDelete={false} rowKey="id_message" createLabel="Nouveau message" searchKeys={["objet", "contenu", "id_expediteur", "id_destinataire"]} emptyText="Aucun message." />;
}
