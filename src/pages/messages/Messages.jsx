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
  return <CrudPage referenceError={refs.error} title="Messages" subtitle="Messages envoyés et reçus par l’utilisateur connecté." icon="💬" columns={[{ key: "id_expediteur", label: "Expéditeur", render: (row) => { const user = refs.utilisateurs?.find((item) => item.id_utilisateur === row.id_expediteur); return user ? `${user.nom} ${user.prenom}` : `Utilisateur #${row.id_expediteur}`; } }, { key: "id_destinataire", label: "Destinataire" }, { key: "objet", label: "Objet" }, { key: "contenu", label: "Contenu" }, { key: "date_envoi", label: "Envoyé le", render: (row) => formatDateTime(row.date_envoi) }, { key: "lu", label: "Lu", render: (row) => row.lu ? "Oui" : "Non" }]} fields={fields} initialForm={{ id_etablissement: idEtablissement || "", id_expediteur: userId() || "", id_destinataire: "", objet: "", contenu: "" }} load={async () => {
    const [received, sent] = await Promise.all([getMessages({ id_destinataire: userId() }), getMessages({ id_expediteur: userId() })]);
    return [...new Map([...received, ...sent].map((message) => [message.id_message, message])).values()];
  }} create={createMessage} createPayload={(data) => ({ ...data, id_etablissement: idEtablissement, id_expediteur: userId() })} extraActions={(row, { runAction, busy }) => !row.lu && Number(row.id_destinataire) === userId() && <button type="button" disabled={busy} onClick={() => runAction(() => markMessageRead(row.id_message))}>✓ Marquer lu</button>} canUpdate={false} canDelete={false} rowKey="id_message" createLabel="Nouveau message" searchKeys={["objet", "contenu", "id_expediteur", "id_destinataire"]} emptyText="Aucun message." />;
}
