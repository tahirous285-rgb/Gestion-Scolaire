import { useReferenceOptions } from "../../hooks/useReferenceOptions";
import CrudPage from "../../components/common/CrudPage";
import { createPresenceEnseignant, getPresencesEnseignants, updatePresenceEnseignant } from "../../services/cahierMaitreApi";
import { getEnseignants } from "../../services/enseignantsApi";
import { getAnnees } from "../../services/anneesApi";
import { formatDate, optionsFrom } from "../pageUtils";

const baseFields = [
  { name: "id_enseignant", label: "Enseignant", type: "select", required: true },
  { name: "id_annee", label: "Année scolaire", type: "select", required: true },
  { name: "date_presence", label: "Date", type: "date", required: true },
  { name: "heure_arrivee", label: "Heure d’arrivée", type: "time" },
  { name: "heure_depart", label: "Heure de départ", type: "time" },
  { name: "statut", label: "Statut", type: "select", required: true, options: ["PRESENT", "ABSENT", "RETARD", "PERMISSION", "MISSION", "CONGE", "AUTRE"].map((value) => ({ value, label: value })) },
  { name: "motif", label: "Motif" },
  { name: "justification", label: "Justification", type: "textarea", full: true },
  { name: "justificatif", label: "Justificatif (URL)" },
  { name: "validee", label: "Présence validée", type: "checkbox" },
  { name: "id_validateur", label: "ID validateur", type: "number" },
  { name: "observation", label: "Observation", type: "textarea", full: true },
];

export default function CahierMaitre() {
  const refs = useReferenceOptions({ enseignants: getEnseignants, annees: getAnnees }, "presence-enseignants");
  const fields = baseFields.map((field) => field.name === "id_enseignant" ? { ...field, options: optionsFrom(refs.enseignants, "id_enseignant", (row) => `${row.matricule} — ${row.nom} ${row.prenom}`) } : field.name === "id_annee" ? { ...field, options: optionsFrom(refs.annees, "id_annee", "libelle") } : field);
  const editFields = fields.filter((field) => !["id_enseignant", "id_annee", "date_presence"].includes(field.name)).map((field) => ({ ...field, required: false }));
  return (
    <CrudPage
      title="Présences enseignants"
      subtitle="Pointage quotidien des enseignants. Les statuts sont des chaînes validées par le backend."
      icon="✅"
      columns={[{ key: "id_enseignant", label: "ID enseignant" }, { key: "id_annee", label: "ID année" }, { key: "date_presence", label: "Date", render: (row) => formatDate(row.date_presence) }, { key: "statut", label: "Statut" }, { key: "heure_arrivee", label: "Arrivée" }, { key: "heure_depart", label: "Départ" }, { key: "validee", label: "Validée", render: (row) => row.validee ? "Oui" : "Non" }]}
      createFields={fields}
      editFields={editFields}
      initialForm={{ id_enseignant: "", id_annee: "", date_presence: "", heure_arrivee: "", heure_depart: "", statut: "", motif: "", justification: "", justificatif: "", validee: false, id_validateur: "", observation: "" }}
      load={() => getPresencesEnseignants()}
      create={createPresenceEnseignant}
      update={updatePresenceEnseignant}
      rowKey="id_presence"
      createLabel="Nouvelle présence"
      searchKeys={["id_enseignant", "date_presence", "statut", "motif"]}
      emptyText="Aucune présence enseignant."
    />
  );
}
