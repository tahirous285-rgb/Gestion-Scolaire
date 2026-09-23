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
  { key: "date_presence", label: "Date" },
  { key: "statut", label: "Statut" },
  { key: "justifiee", label: "Justifiée", render: (row) => row.justifiee ? "Oui" : "Non" },
  { key: "observation", label: "Observation" },
];

const fields = [
  { name: "id_inscription", label: "Inscription", type: "number", required: true },
  { name: "date_presence", label: "Date", type: "date", required: true },
  { name: "statut", label: "Statut", required: true },
  { name: "heure_arrivee", label: "Heure d’arrivée", type: "time" },
  { name: "heure_depart", label: "Heure de départ", type: "time" },
  { name: "motif", label: "Motif" },
  { name: "justifiee", label: "Justifiée", type: "checkbox" },
  { name: "observation", label: "Observation", type: "textarea", full: true },
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
      searchKeys={["id_presence", "id_inscription", "date_presence", "statut", "motif", "observation"]}
      initialForm={{ id_inscription: "", date_presence: "", statut: "", heure_arrivee: "", heure_depart: "", motif: "", justifiee: false, observation: "" }}
    />
  );
}
