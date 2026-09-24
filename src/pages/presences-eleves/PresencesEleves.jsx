import { useReferenceOptions } from "../../hooks/useReferenceOptions";
import CrudPage from "../../components/common/CrudPage";
import { getInscriptions } from "../../services/inscriptionsApi";
import { userId } from "../../services/apiClient";
import { createPresenceEleve, getPresencesEleves, updatePresenceEleve } from "../../services/presencesElevesApi";
import { formatDate, optionsFrom } from "../pageUtils";

export default function PresencesEleves() {
  const refs = useReferenceOptions({ inscriptions: getInscriptions }, "presences-eleves");
  const inscriptionOptions = optionsFrom(refs.inscriptions, "id_inscription", (row) => `Inscription #${row.id_inscription} — élève #${row.id_eleve}`);
  const fields = [
    { name: "id_inscription", label: "Inscription", type: "select", required: true, options: inscriptionOptions },
    { name: "date_presence", label: "Date", type: "date", required: true },
    { name: "statut", label: "Statut", type: "select", required: true, options: ["PRESENT", "ABSENT", "RETARD", "EXCUSE"].map((value) => ({ value, label: value })) },
    { name: "heure_arrivee", label: "Heure d’arrivée", type: "time" },
    { name: "heure_depart", label: "Heure de départ", type: "time" },
    { name: "motif", label: "Motif" },
    { name: "justifiee", label: "Absence justifiée", type: "checkbox" },
    { name: "observation", label: "Observation", type: "textarea", full: true },
  ];
  const editFields = fields.filter((field) => !["id_inscription", "date_presence"].includes(field.name)).map((field) => ({ ...field, required: false }));
  return (
    <CrudPage
      title="Présences élèves"
      subtitle="Pointage quotidien par inscription. Le backend empêche les doublons date–inscription."
      icon="🟢"
      columns={[{ key: "id_inscription", label: "Inscription" }, { key: "date_presence", label: "Date", render: (row) => formatDate(row.date_presence) }, { key: "statut", label: "Statut" }, { key: "heure_arrivee", label: "Arrivée" }, { key: "heure_depart", label: "Départ" }, { key: "justifiee", label: "Justifiée", render: (row) => row.justifiee ? "Oui" : "Non" }, { key: "motif", label: "Motif" }]}
      createFields={fields}
      editFields={editFields}
      initialForm={{ id_inscription: "", date_presence: "", statut: "", heure_arrivee: "", heure_depart: "", motif: "", justifiee: false, observation: "" }}
      load={() => getPresencesEleves()}
      create={createPresenceEleve}
      createPayload={(data) => ({ ...data, id_utilisateur: userId() })}
      update={updatePresenceEleve}
      rowKey="id_presence"
      createLabel="Nouvelle présence"
      searchKeys={["id_inscription", "date_presence", "statut", "motif"]}
      emptyText="Aucune présence élève."
    />
  );
}
