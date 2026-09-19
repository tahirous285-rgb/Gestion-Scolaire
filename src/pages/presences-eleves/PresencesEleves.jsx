import CrudPage from "../../components/common/CrudPage";
import {
  createPresence,
  getPresences,
  updatePresence,
} from "../../services/presencesElevesApi";

import "./Presences-eleves.css";

const columns = [
  { key: "id_presence", label: "ID" },
  { key: "id_inscription", label: "Inscription" },
  { key: "date", label: "Date" },
  { key: "statut", label: "Statut" },
  { key: "justification", label: "Justification" },
];

const fields = [
  { name: "id_inscription", label: "Inscription", type: "number", required: true },
  { name: "date", label: "Date", type: "date", required: true },
  {
    name: "statut",
    label: "Statut",
    type: "select",
    required: true,
    options: [
      { value: "present", label: "Présent" },
      { value: "absent", label: "Absent" },
      { value: "retard", label: "Retard" },
      { value: "excuse", label: "Excusé" },
    ],
  },
  { name: "justification", label: "Justification", type: "textarea", full: true },
];

export default function PresencesEleves() {
  return (
    <CrudPage
      title="Présences des élèves"
      subtitle="Suivez les présences et absences quotidiennes."
      icon="📋"
      columns={columns}
      fields={fields}
      load={getPresences}
      create={createPresence}
      update={updatePresence}
      rowKey="id_presence"
      searchKeys={["id_presence", "id_inscription", "date", "statut", "justification"]}
      initialForm={{ id_inscription: "", date: "", statut: "present", justification: "" }}
    />
  );
}
