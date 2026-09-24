import CrudPage from "../../components/common/CrudPage";
import BackendUnavailable from "../../components/common/BackendUnavailable";
import { createRole, getRoles } from "../../services/administrationApi";

const fields = [
  { name: "nom", label: "Nom", required: true },
  { name: "code", label: "Code", required: true },
  { name: "description", label: "Description", type: "textarea", full: true },
];

export default function RolesPermissions() {
  return (
    <>
      <CrudPage
        title="Rôles & permissions"
        subtitle="Les rôles exposés par l’API."
        icon="🛡️"
        columns={[
          { key: "nom", label: "Nom" },
          { key: "code", label: "Code" },
          { key: "description", label: "Description" },
        ]}
        fields={fields}
        initialForm={{ nom: "", code: "", description: "" }}
        load={getRoles}
        create={createRole}
        canUpdate={false}
        canDelete={false}
        rowKey="id_role"
        createLabel="Nouveau rôle"
        searchKeys={["nom", "code", "description"]}
        emptyText="Aucun rôle enregistré."
      />
      <div className="page-note"><BackendUnavailable>la gestion des permissions et leur association aux rôles n’est pas exposée par un endpoint backend.</BackendUnavailable></div>
    </>
  );
}
