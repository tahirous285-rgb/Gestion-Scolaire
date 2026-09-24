import CrudPage from "../../components/common/CrudPage";
import { createEtablissement, deleteEtablissement, getEtablissements, updateEtablissement } from "../../services/administrationApi";

const fields = [
  { name: "nom", label: "Nom", required: true },
  { name: "code", label: "Code", required: true },
  { name: "adresse", label: "Adresse", full: true },
  { name: "telephone", label: "Téléphone" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "site_web", label: "Site web", type: "url" },
  { name: "logo", label: "Logo (URL)" },
  { name: "devise", label: "Devise", default: "FCFA" },
  { name: "langue", label: "Langue", default: "fr" },
  { name: "fuseau_horaire", label: "Fuseau horaire", default: "Africa/Bamako" },
  { name: "actif", label: "Établissement actif", type: "checkbox", default: true },
];

const initialForm = {
  nom: "", code: "", adresse: "", telephone: "", email: "", site_web: "", logo: "",
  devise: "FCFA", langue: "fr", fuseau_horaire: "Africa/Bamako", actif: true,
};

export default function Etablissements() {
  return (
    <CrudPage
      title="Établissements"
      subtitle="Les établissements autorisés à utiliser l’application."
      icon="🏫"
      columns={[
        { key: "nom", label: "Établissement" },
        { key: "code", label: "Code" },
        { key: "telephone", label: "Téléphone" },
        { key: "email", label: "E-mail" },
        { key: "actif", label: "Statut", render: (row) => row.actif ? "Actif" : "Inactif" },
      ]}
      createFields={fields}
      editFields={fields.map((field) => ({ ...field, required: false }))}
      initialForm={initialForm}
      load={getEtablissements}
      pagination={{ pageSize: 100 }}
      create={createEtablissement}
      update={updateEtablissement}
      remove={deleteEtablissement}
      rowKey="id_etablissement"
      createLabel="Nouvel établissement"
      searchKeys={["nom", "code", "email", "telephone"]}
      emptyText="Aucun établissement enregistré."
    />
  );
}
