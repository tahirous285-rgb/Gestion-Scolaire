import CrudPage from "../../components/common/CrudPage";
import { createRole, getRoles } from "../../services/administrationApi";

const fields = [
  { name: "nom", label: "Nom", required: true },
  { name: "code", label: "Code", required: true },
  { name: "description", label: "Description", type: "textarea", full: true },
];

function roleErrorMessage(error, fallback) {
  if (error?.status === 401) {
    return "Session expirée ou invalide. Veuillez vous reconnecter.";
  }
  if (error?.status === 403) {
    return `Accès refusé : votre compte ne dispose pas des droits nécessaires. ${error.message || ""}`.trim();
  }
  return error?.message || fallback;
}

export default function RolesPermissions() {
  function showMutationSuccess(action) {
    if (action === "create") return "Le rôle a été créé.";
    if (action === "update") return "Le rôle a été modifié.";
    if (action === "delete") return "Le rôle a été supprimé.";
    return "L’opération a réussi.";
  }

  return (
    <>
      <CrudPage
        title="Rôles & permissions"
        subtitle="Rôles renvoyés par l’API de l’établissement."
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
        canView
        formatError={roleErrorMessage}
        onSuccess={showMutationSuccess}
        canUpdate={false}
        canDelete={false}
        rowKey="id_role"
        createLabel="Nouveau rôle"
        searchKeys={["nom", "code", "description"]}
        emptyText="Aucun rôle enregistré."
      />
      <div className="page-note">
        <div className="crud-alert info-alert" role="status">
          <span>
            Le backend présent dans ce dépôt expose la liste et la création des rôles. La
            consultation affichée reprend les champs complets renvoyés par cette liste.
            Les routes de détail, de modification et de suppression des rôles, ainsi que
            toutes les routes de permissions et d’association, ne sont pas déclarées dans
            cette version : ces opérations restent indisponibles. Vérifiez la version de
            l’API réellement déployée avant de les activer.
          </span>
        </div>
      </div>
    </>
  );
}
