import { useMemo } from "react";
import CrudPage from "../../components/common/CrudPage";
import { establishmentId } from "../../services/apiClient";
import { createParametre, getParametres, updateParametre } from "../../services/administrationApi";
import { formatDateTime } from "../pageUtils";

const createFields = [
  { name: "cle", label: "Clé", required: true },
  { name: "valeur", label: "Valeur", type: "textarea", full: true },
  { name: "description", label: "Description", type: "textarea", full: true },
];
const editFields = createFields.filter((field) => field.name !== "cle");

export default function Parametres() {
  const idEtablissement = establishmentId();
  const load = useMemo(() => () => getParametres(idEtablissement), [idEtablissement]);
  return (
    <CrudPage
      title="Paramètres"
      subtitle="Valeurs de configuration propres à l’établissement connecté."
      icon="⚙️"
      columns={[
        { key: "cle", label: "Clé" },
        { key: "valeur", label: "Valeur" },
        { key: "description", label: "Description" },
        { key: "date_modification", label: "Modifié le", render: (row) => formatDateTime(row.date_modification) },
      ]}
      createFields={createFields}
      editFields={editFields}
      initialForm={{ cle: "", valeur: "", description: "" }}
      load={load}
      create={createParametre}
      update={updateParametre}
      createPayload={(data) => ({ ...data, id_etablissement: idEtablissement })}
      rowKey="id_parametre"
      createLabel="Nouveau paramètre"
      searchKeys={["cle", "valeur", "description"]}
      emptyText="Aucun paramètre configuré."
    />
  );
}
