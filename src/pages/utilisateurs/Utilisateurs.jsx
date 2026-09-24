import { useReferenceOptions } from "../../hooks/useReferenceOptions";
import CrudPage from "../../components/common/CrudPage";
import { establishmentId } from "../../services/apiClient";
import { createUtilisateur, deleteUtilisateur, getRoles, getUtilisateurs, updateUtilisateur } from "../../services/administrationApi";
import { optionsFrom } from "../pageUtils";

const baseFields = [
  { name: "nom", label: "Nom", required: true },
  { name: "prenom", label: "Prénom", required: true },
  { name: "email", label: "E-mail", type: "email", required: true },
  { name: "telephone", label: "Téléphone" },
  { name: "login", label: "Identifiant", required: true },
  { name: "statut", label: "Statut", default: "actif", help: "L’authentification backend accepte notamment le statut actif." },
];

export default function Utilisateurs() {
  const references = useReferenceOptions({ roles: getRoles }, "roles");
  const roleOptions = optionsFrom(references.roles, "id_role", (role) => `${role.nom} (${role.code})`);
  const idEtablissement = establishmentId();
  const createFields = [
    { name: "id_etablissement", label: "ID établissement", type: "number", required: true, default: idEtablissement || "", help: "Identifiant réel attendu par l’API." },
    { name: "id_role", label: "Rôle", type: "select", required: true, options: roleOptions },
    ...baseFields,
    { name: "mot_de_passe", label: "Mot de passe", type: "password", required: true },
  ];
  const editFields = [
    { name: "id_role", label: "Rôle", type: "select", required: true, options: roleOptions },
    ...baseFields.filter((field) => !["login"].includes(field.name)).map((field) => ({ ...field, required: false })),
  ];

  return (
    <CrudPage
      title="Utilisateurs"
      subtitle="Comptes utilisateurs et rôles de l’établissement."
      icon="👥"
      columns={[
        { key: "nom", label: "Nom" },
        { key: "prenom", label: "Prénom" },
        { key: "login", label: "Identifiant" },
        { key: "email", label: "E-mail" },
        { key: "id_role", label: "ID rôle" },
        { key: "statut", label: "Statut" },
      ]}
      createFields={createFields}
      editFields={editFields}
      initialForm={{ id_etablissement: idEtablissement || "", id_role: "", nom: "", prenom: "", email: "", telephone: "", login: "", statut: "actif", mot_de_passe: "" }}
      load={getUtilisateurs}
      pagination={{ pageSize: 100 }}
      create={createUtilisateur}
      update={updateUtilisateur}
      remove={deleteUtilisateur}
      rowKey="id_utilisateur"
      createLabel="Nouvel utilisateur"
      searchKeys={["nom", "prenom", "login", "email", "statut"]}
      emptyText="Aucun utilisateur enregistré."
    />
  );
}
