import { useReferenceOptions } from "../../hooks/useReferenceOptions";
import CrudPage from "../../components/common/CrudPage";
import { getEvaluations } from "../../services/evaluationsApi";
import { getInscriptions } from "../../services/inscriptionsApi";
import { createNote, deleteNote, getNotes, updateNote } from "../../services/notesApi";
import { formatDateTime, optionsFrom } from "../pageUtils";

export default function Notes() {
  const refs = useReferenceOptions({ evaluations: getEvaluations, inscriptions: getInscriptions }, "notes");
  const evaluationOptions = optionsFrom(refs.evaluations, "id_evaluation", (row) => `${row.libelle} (#${row.id_evaluation})`);
  const inscriptionOptions = optionsFrom(refs.inscriptions, "id_inscription", (row) => `Inscription #${row.id_inscription} — élève #${row.id_eleve}`);
  const createFields = [
    { name: "id_evaluation", label: "Évaluation", type: "select", required: true, options: evaluationOptions },
    { name: "id_inscription", label: "Inscription", type: "select", required: true, options: inscriptionOptions },
    { name: "valeur", label: "Valeur", type: "number", min: 0, step: "0.01", help: "Le backend vérifie la valeur par rapport au barème de l’évaluation." },
    { name: "absence", label: "Absent", type: "checkbox" },
    { name: "observation", label: "Observation", type: "textarea", full: true },
  ];
  const editFields = createFields.filter((field) => !["id_evaluation", "id_inscription"].includes(field.name));
  return (
    <CrudPage
      title="Notes"
      subtitle="Une note par élève et par évaluation, avec contrôle du barème côté backend."
      icon="✅"
      columns={[{ key: "id_evaluation", label: "Évaluation" }, { key: "id_inscription", label: "Inscription" }, { key: "valeur", label: "Valeur" }, { key: "absence", label: "Absence", render: (row) => row.absence ? "Oui" : "Non" }, { key: "date_creation", label: "Saisie le", render: (row) => formatDateTime(row.date_creation) }, { key: "observation", label: "Observation" }]}
      createFields={createFields}
      editFields={editFields}
      initialForm={{ id_evaluation: "", id_inscription: "", valeur: "", absence: false, observation: "" }}
      load={() => getNotes()}
      create={createNote}
      update={updateNote}
      remove={deleteNote}
      rowKey="id_note"
      createLabel="Saisir une note"
      searchKeys={["id_evaluation", "id_inscription", "valeur", "observation"]}
      emptyText="Aucune note enregistrée."
    />
  );
}
