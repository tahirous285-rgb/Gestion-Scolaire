import CrudPage from "../../components/common/CrudPage";
import { establishmentId } from "../../services/apiClient";
import { createEleve, deleteEleve, getEleves, updateEleve } from "../../services/elevesApi";
import { photoUrl } from "../../utils/imageFile";
import { formatDate } from "../pageUtils";

const fields = [
  { name: "matricule", label: "Matricule", required: true },
  { name: "nom", label: "Nom", required: true },
  { name: "prenom", label: "Prénom", required: true },
  { name: "sexe", label: "Sexe" },
  { name: "date_naissance", label: "Date de naissance", type: "date" },
  { name: "lieu_naissance", label: "Lieu de naissance" },
  { name: "nationalite", label: "Nationalité" },
  { name: "adresse", label: "Adresse", full: true },
  { name: "telephone", label: "Téléphone" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "photo", label: "Photo de l’élève", type: "image", full: true, help: "Importer depuis l’explorateur de fichiers. La photo est conservée dans le champ photo et réutilisée pour les cartes et les bulletins imprimés." },
  { name: "actif", label: "Élève actif", type: "checkbox", default: true },
];

export default function Eleves() {
  const idEtablissement = establishmentId();
  return (
    <CrudPage
      title="Élèves"
      subtitle="Dossier administratif des élèves de l’établissement connecté."
      icon="🎓"
      columns={[
        { key: "photo", label: "Photo", render: (row) => (
          photoUrl(row.photo)
            ? <img src={photoUrl(row.photo)} alt="" width={36} height={36} style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 8 }} />
            : "—"
        ) },
        { key: "matricule", label: "Matricule" },
        { key: "nom", label: "Nom" },
        { key: "prenom", label: "Prénom" },
        { key: "sexe", label: "Sexe" },
        { key: "date_naissance", label: "Naissance", render: (row) => formatDate(row.date_naissance) },
        { key: "telephone", label: "Téléphone" },
        { key: "actif", label: "Statut", render: (row) => row.actif ? "Actif" : "Inactif" },
      ]}
      createFields={fields}
      editFields={fields}
      initialForm={{ id_etablissement: idEtablissement || "", matricule: "", nom: "", prenom: "", sexe: "", date_naissance: "", lieu_naissance: "", nationalite: "", adresse: "", telephone: "", email: "", photo: "", actif: true }}
      load={getEleves}
      pagination={{ pageSize: 100 }}
      create={createEleve}
      update={updateEleve}
      remove={deleteEleve}
      createPayload={(data) => ({ ...data, id_etablissement: idEtablissement })}
      rowKey="id_eleve"
      createLabel="Nouvel élève"
      searchKeys={["matricule", "nom", "prenom", "telephone", "email"]}
      emptyText="Aucun élève enregistré."
    />
  );
}
