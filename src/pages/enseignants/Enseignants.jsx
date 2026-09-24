import CrudPage from "../../components/common/CrudPage";
import { establishmentId } from "../../services/apiClient";
import { createEnseignant, deleteEnseignant, getEnseignants, updateEnseignant } from "../../services/enseignantsApi";
import { formatDate, formatMoney } from "../pageUtils";

const fields = [
  { name: "matricule", label: "Matricule", required: true },
  { name: "nom", label: "Nom", required: true },
  { name: "prenom", label: "Prénom", required: true },
  { name: "sexe", label: "Sexe" },
  { name: "date_naissance", label: "Date de naissance", type: "date" },
  { name: "telephone", label: "Téléphone" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "adresse", label: "Adresse", full: true },
  { name: "date_embauche", label: "Date d’embauche", type: "date" },
  { name: "statut", label: "Statut", default: "actif" },
  { name: "taux_horaire", label: "Taux horaire", type: "number", min: 0, step: "0.01" },
  { name: "actif", label: "Enseignant actif", type: "checkbox", default: true },
];

export default function Enseignants() {
  const idEtablissement = establishmentId();
  return (
    <CrudPage
      title="Enseignants"
      subtitle="Dossier des enseignants et intervenants."
      icon="🧑‍🏫"
      columns={[
        { key: "matricule", label: "Matricule" }, { key: "nom", label: "Nom" }, { key: "prenom", label: "Prénom" },
        { key: "telephone", label: "Téléphone" }, { key: "taux_horaire", label: "Taux horaire", render: (row) => formatMoney(row.taux_horaire) },
        { key: "date_embauche", label: "Embauche", render: (row) => formatDate(row.date_embauche) }, { key: "statut", label: "Statut" },
      ]}
      createFields={fields}
      editFields={fields.filter((field) => field.name !== "date_embauche").map((field) => ({ ...field, required: false }))}
      initialForm={{ id_etablissement: idEtablissement || "", matricule: "", nom: "", prenom: "", sexe: "", date_naissance: "", telephone: "", email: "", adresse: "", date_embauche: "", statut: "actif", taux_horaire: "", actif: true }}
      load={getEnseignants}
      pagination={{ pageSize: 100 }}
      create={createEnseignant}
      update={updateEnseignant}
      remove={deleteEnseignant}
      createPayload={(data) => ({ ...data, id_etablissement: idEtablissement })}
      rowKey="id_enseignant"
      createLabel="Nouvel enseignant"
      searchKeys={["matricule", "nom", "prenom", "telephone", "email", "statut"]}
      emptyText="Aucun enseignant enregistré."
    />
  );
}
