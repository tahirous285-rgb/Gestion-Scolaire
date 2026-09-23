import CrudPage from "../../components/common/CrudPage";
import {
  createNote,
  deleteNote,
  getNotes,
  updateNote,
} from "../../services/notesApi";

import "./Notes.css";

const columns = [
  { key: "id_note", label: "ID" },
  { key: "id_evaluation", label: "Évaluation" },
  { key: "id_inscription", label: "Inscription" },
  { key: "valeur", label: "Note" },
  { key: "absence", label: "Absence", render: (row) => row.absence ? "Oui" : "Non" },
  { key: "observation", label: "Observation" },
];

const fields = [
  { name: "id_evaluation", label: "Évaluation", type: "number", required: true },
  { name: "id_inscription", label: "Inscription", type: "number", required: true },
  { name: "valeur", label: "Note", type: "number", required: true, min: 0, step: 0.01 },
  { name: "absence", label: "Absence", type: "checkbox", checkLabel: "Élève absent" },
  { name: "observation", label: "Observation", type: "textarea", full: true },
];

export default function Notes() {
  return (
    <CrudPage
      title="Notes"
      subtitle="Gérez les notes des élèves."
      icon="📝"
      columns={columns}
      fields={fields}
      load={getNotes}
      create={createNote}
      update={updateNote}
      remove={deleteNote}
      rowKey="id_note"
      searchKeys={["id_note", "id_evaluation", "id_inscription", "valeur", "observation"]}
      initialForm={{ id_evaluation: "", id_inscription: "", valeur: "", absence: false, observation: "" }}
    />
  );
}
