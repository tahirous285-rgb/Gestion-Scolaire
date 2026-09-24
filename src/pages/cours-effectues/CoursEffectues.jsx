import { useReferenceOptions } from "../../hooks/useReferenceOptions";
import CrudPage from "../../components/common/CrudPage";
import { userId } from "../../services/apiClient";
import { createCoursEffectue, getCoursEffectues } from "../../services/cahierMaitreApi";
import { getAnnees } from "../../services/anneesApi";
import { getClasses } from "../../services/classesApi";
import { getMatieres } from "../../services/matieresApi";
import { getEnseignants } from "../../services/enseignantsApi";
import { optionsFrom, formatDate } from "../pageUtils";

export default function CoursEffectues() {
  const refs = useReferenceOptions({ annees: getAnnees, enseignants: getEnseignants, classes: getClasses, matieres: getMatieres }, "cours-effectues");
  const fields = [
    { name: "id_annee", label: "Année scolaire", type: "select", required: true, options: optionsFrom(refs.annees, "id_annee", "libelle") },
    { name: "id_enseignant", label: "Enseignant", type: "select", required: true, options: optionsFrom(refs.enseignants, "id_enseignant", (row) => `${row.matricule} — ${row.nom} ${row.prenom}`) },
    { name: "id_classe", label: "Classe", type: "select", required: true, options: optionsFrom(refs.classes, "id_classe", "nom") },
    { name: "id_matiere", label: "Matière", type: "select", required: true, options: optionsFrom(refs.matieres, "id_matiere", (row) => `${row.code} — ${row.nom}`) },
    { name: "date_cours", label: "Date du cours", type: "date", required: true },
    { name: "heures_prevues", label: "Heures prévues", type: "number", min: 0, step: "0.01" },
    { name: "heures_effectuees", label: "Heures effectuées", type: "number", min: 0, step: "0.01" },
    { name: "statut", label: "Statut", default: "effectue" },
    { name: "observation", label: "Observation", type: "textarea", full: true },
  ];
  return (
    <CrudPage
      title="Cours effectués"
      subtitle="Trace des cours réalisés par les enseignants."
      icon="📖"
      columns={[{ key: "id_annee", label: "Année" }, { key: "id_enseignant", label: "Enseignant" }, { key: "id_classe", label: "Classe" }, { key: "id_matiere", label: "Matière" }, { key: "date_cours", label: "Date", render: (row) => formatDate(row.date_cours) }, { key: "heures_effectuees", label: "Heures" }, { key: "statut", label: "Statut" }]}
      fields={fields}
      initialForm={{ id_annee: "", id_enseignant: "", id_classe: "", id_matiere: "", date_cours: "", heures_prevues: "", heures_effectuees: "", statut: "effectue", observation: "" }}
      load={() => getCoursEffectues()}
      create={createCoursEffectue}
      createPayload={(data) => ({ ...data, id_utilisateur: userId() })}
      canUpdate={false}
      canDelete={false}
      rowKey="id_cours"
      createLabel="Nouveau cours"
      searchKeys={["date_cours", "statut", "id_enseignant", "id_classe", "id_matiere"]}
      emptyText="Aucun cours effectué."
    />
  );
}
