import { useMemo } from "react";
import CrudPage from "../../components/common/CrudPage";
import { establishmentId, userId } from "../../services/apiClient";
import { createJournalEntry, getJournal } from "../../services/administrationApi";
import { formatDateTime } from "../pageUtils";

const fields = [
  { name: "action", label: "Action", required: true },
  { name: "module", label: "Module" },
  { name: "table_cible", label: "Table cible" },
  { name: "id_cible", label: "ID cible", type: "number" },
  { name: "ancienne_valeur", label: "Ancienne valeur", type: "textarea", full: true },
  { name: "nouvelle_valeur", label: "Nouvelle valeur", type: "textarea", full: true },
  { name: "adresse_ip", label: "Adresse IP" },
];

export default function JournalActivite() {
  const idEtablissement = establishmentId();
  const load = useMemo(() => () => getJournal({ idEtablissement, limit: 100 }), [idEtablissement]);
  return (
    <CrudPage
      title="Journal d’activité"
      subtitle="Les dernières opérations enregistrées par l’API."
      icon="🧾"
      columns={[
        { key: "date_action", label: "Date", render: (row) => formatDateTime(row.date_action) },
        { key: "action", label: "Action" },
        { key: "module", label: "Module" },
        { key: "table_cible", label: "Cible" },
        { key: "id_utilisateur", label: "Utilisateur" },
      ]}
      fields={fields}
      initialForm={{ action: "", module: "", table_cible: "", id_cible: "", ancienne_valeur: "", nouvelle_valeur: "", adresse_ip: "" }}
      load={load}
      create={createJournalEntry}
      createPayload={(data) => ({ ...data, id_etablissement: idEtablissement, id_utilisateur: userId() })}
      canUpdate={false}
      canDelete={false}
      rowKey="id_journal"
      createLabel="Nouvelle entrée"
      searchKeys={["action", "module", "table_cible", "adresse_ip"]}
      emptyText="Aucune activité pour cet établissement."
    />
  );
}
