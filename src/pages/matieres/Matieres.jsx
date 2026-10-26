import CrudPage from "../../components/common/CrudPage";
import { establishmentId } from "../../services/apiClient";
import { createMatiere, deleteMatiere, getMatieres, updateMatiere } from "../../services/matieresApi";

const createFields = [
  { name: "nom", label: "Nom", required: true },
  { name: "description", label: "Description", type: "textarea", full: true, help: "Informations complémentaires sur la matière." },
  { name: "actif", label: "Matière active", type: "checkbox", default: true, help: "Disponible pour les affectations scolaires." },
];

const editFields = [
  { name: "code", label: "Code de la matière", required: true },
  ...createFields.map((field) => ({ ...field, required: false })),
];

export default function Matieres() {
  const idEtablissement = establishmentId();
  return (
    <CrudPage
      title="Matières"
      subtitle="Catalogue des matières enseignées."
      icon="📚"
      columns={[{ key: "code", label: "Code" }, { key: "nom", label: "Nom" }, { key: "description", label: "Description" }, { key: "actif", label: "Statut", render: (row) => row.actif ? "Active" : "Inactive" }]}
      createFields={createFields}
      editFields={editFields}
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
