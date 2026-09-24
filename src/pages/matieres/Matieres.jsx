import CrudPage from "../../components/common/CrudPage";
import { establishmentId } from "../../services/apiClient";
import { createMatiere, deleteMatiere, getMatieres, updateMatiere } from "../../services/matieresApi";

const fields = [
  { name: "code", label: "Code", required: true },
  { name: "nom", label: "Nom", required: true },
  { name: "description", label: "Description", type: "textarea", full: true },
  { name: "actif", label: "Matière active", type: "checkbox", default: true },
];

export default function Matieres() {
  const idEtablissement = establishmentId();
  return (
    <CrudPage
      title="Matières"
      subtitle="Catalogue des matières enseignées."
      icon="📚"
      columns={[{ key: "code", label: "Code" }, { key: "nom", label: "Nom" }, { key: "description", label: "Description" }, { key: "actif", label: "Statut", render: (row) => row.actif ? "Active" : "Inactive" }]}
      createFields={fields}
      editFields={fields.map((field) => ({ ...field, required: false }))}
      initialForm={{ id_etablissement: idEtablissement || "", code: "", nom: "", description: "", actif: true }}
      load={getMatieres}
      create={createMatiere}
      update={updateMatiere}
      remove={deleteMatiere}
      createPayload={(data) => ({ ...data, id_etablissement: idEtablissement })}
      rowKey="id_matiere"
      createLabel="Nouvelle matière"
      searchKeys={["code", "nom", "description"]}
      emptyText="Aucune matière enregistrée."
    />
  );
}
