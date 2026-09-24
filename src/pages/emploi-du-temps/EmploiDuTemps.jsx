import { useReferenceOptions } from "../../hooks/useReferenceOptions";
import CrudPage from "../../components/common/CrudPage";
import { getAnnees } from "../../services/anneesApi";
import { getClasses } from "../../services/classesApi";
import { getMatieres } from "../../services/matieresApi";
import { getEnseignants } from "../../services/enseignantsApi";
import { createEmploi, deleteEmploi, getEmplois, updateEmploi } from "../../services/emploiTempsApi";
import { optionsFrom } from "../pageUtils";

export default function EmploiDuTemps() {
  const refs = useReferenceOptions({ annees: getAnnees, classes: getClasses, enseignants: getEnseignants, matieres: getMatieres }, "emploi-temps");
  const createFields = [
    { name: "id_annee", label: "Année scolaire", type: "select", required: true, options: optionsFrom(refs.annees, "id_annee", "libelle") },
    { name: "id_classe", label: "Classe", type: "select", required: true, options: optionsFrom(refs.classes, "id_classe", "nom") },
    { name: "id_enseignant", label: "Enseignant", type: "select", required: true, options: optionsFrom(refs.enseignants, "id_enseignant", (row) => `${row.matricule} — ${row.nom} ${row.prenom}`) },
    { name: "id_matiere", label: "Matière", type: "select", required: true, options: optionsFrom(refs.matieres, "id_matiere", (row) => `${row.code} — ${row.nom}`) },
    { name: "jour_semaine", label: "Jour", required: true },
    { name: "heure_debut", label: "Heure de début", type: "time", required: true },
    { name: "heure_fin", label: "Heure de fin", type: "time", required: true },
    { name: "salle", label: "Salle" },
    { name: "observation", label: "Observation", type: "textarea", full: true },
  ];
  const editFields = createFields.filter((field) => !["id_annee", "id_classe"].includes(field.name)).map((field) => ({ ...field, required: false }));
  return (
    <CrudPage
      title="Emploi du temps"
      subtitle="Créneaux rattachés à une année, une classe, un enseignant et une matière."
      icon="🗓️"
      columns={[{ key: "id_annee", label: "Année" }, { key: "id_classe", label: "Classe" }, { key: "id_enseignant", label: "Enseignant" }, { key: "id_matiere", label: "Matière" }, { key: "jour_semaine", label: "Jour" }, { key: "heure_debut", label: "Début" }, { key: "heure_fin", label: "Fin" }, { key: "salle", label: "Salle" }]}
      createFields={createFields}
      editFields={editFields}
      initialForm={{ id_annee: "", id_classe: "", id_enseignant: "", id_matiere: "", jour_semaine: "", heure_debut: "", heure_fin: "", salle: "", observation: "" }}
      load={() => getEmplois()}
      create={createEmploi}
      update={updateEmploi}
      remove={deleteEmploi}
      rowKey="id_emploi"
      createLabel="Nouveau créneau"
      searchKeys={["jour_semaine", "heure_debut", "heure_fin", "salle", "id_classe", "id_enseignant"]}
      emptyText="Aucun créneau enregistré."
    />
  );
}
