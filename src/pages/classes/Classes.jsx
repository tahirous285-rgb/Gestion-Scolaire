import CrudPage from "../../components/common/CrudPage";
import { establishmentId } from "../../services/apiClient";
import { createClasse, deleteClasse, getClasses, updateClasse } from "../../services/classesApi";

const fields = [
  { name: "nom", label: "Nom", required: true },
  { name: "niveau", label: "Niveau" },
  { name: "capacite", label: "Capacité", type: "number", min: 0 },
  { name: "salle", label: "Salle" },
  { name: "actif", label: "Classe active", type: "checkbox", default: true },
];

export default function Classes() {
  const idEtablissement = establishmentId();
  return (
    <CrudPage
      title="Classes"
      subtitle="Groupes pédagogiques de l’établissement."
      icon="🏷️"
      columns={[{ key: "nom", label: "Nom" }, { key: "niveau", label: "Niveau" }, { key: "capacite", label: "Capacité" }, { key: "salle", label: "Salle" }, { key: "actif", label: "Statut", render: (row) => row.actif ? "Active" : "Inactive" }]}
      createFields={fields}
      editFields={fields.map((field) => ({ ...field, required: false }))}
      initialForm={{ id_etablissement: idEtablissement || "", nom: "", niveau: "", capacite: "", salle: "", actif: true }}
      load={getClasses}
      create={createClasse}
      update={updateClasse}
      remove={deleteClasse}
      createPayload={(data) => ({ ...data, id_etablissement: idEtablissement })}
      rowKey="id_classe"
      createLabel="Nouvelle classe"
      searchKeys={["nom", "niveau", "salle"]}
      emptyText="Aucune classe enregistrée."
    />
  );
}
