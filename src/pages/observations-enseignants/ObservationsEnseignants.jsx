import { useMemo } from "react";
import { useReferenceOptions } from "../../hooks/useReferenceOptions";
import CrudPage from "../../components/common/CrudPage";
import { userId } from "../../services/apiClient";
import { createObservation, getObservations } from "../../services/observationsApi";
import { getEnseignants } from "../../services/enseignantsApi";
import { formatDate, formatDateTime, mapBy, optionsFrom } from "../pageUtils";

export default function ObservationsEnseignants() {
  const refs = useReferenceOptions({ enseignants: getEnseignants }, "observations-enseignants");
  const enseignantsParId = useMemo(() => mapBy(refs.enseignants, "id_enseignant"), [refs.enseignants]);
  const nomEnseignant = (row) => {
    const enseignant = enseignantsParId.get(String(row.id_enseignant));
    return enseignant
      ? `${enseignant.matricule} — ${enseignant.nom} ${enseignant.prenom}`
      : `Enseignant #${row.id_enseignant}`;
  };
  const fields = [
    {
      name: "id_enseignant",
      label: "Enseignant",
      type: "select",
      required: true,
      options: optionsFrom(refs.enseignants, "id_enseignant", (row) => `${row.matricule} — ${row.nom} ${row.prenom}`),
    },
    { name: "date_observation", label: "Date d’observation", type: "date", help: "Optionnelle : le backend accepte une observation non datée." },
    { name: "confidentialite", label: "Confidentialité", default: "interne", help: "Texte libre côté backend, « interne » par défaut." },
    { name: "contenu", label: "Contenu", type: "textarea", required: true, full: true, rows: 5 },
  ];
  return (
    <CrudPage referenceError={refs.error}
      title="Observations enseignants"
      subtitle="Suivi des observations individuelles consignées dans le cahier des maîtres."
      icon="🗒️"
      columns={[
        { key: "id_enseignant", label: "Enseignant", render: (row) => nomEnseignant(row) },
        { key: "date_observation", label: "Date", render: (row) => formatDate(row.date_observation) },
        { key: "contenu", label: "Contenu" },
        { key: "confidentialite", label: "Confidentialité" },
        { key: "date_creation", label: "Consignée le", render: (row) => formatDateTime(row.date_creation) },
      ]}
      fields={fields}
      initialForm={{ id_enseignant: "", date_observation: "", confidentialite: "interne", contenu: "" }}
      load={() => getObservations()}
      create={createObservation}
      createPayload={(data) => ({ ...data, id_auteur: userId() })}
      canUpdate={false}
      canDelete={false}
      rowKey="id_observation"
      createLabel="Nouvelle observation"
      searchKeys={["contenu", "confidentialite", "id_enseignant", "date_observation"]}
      emptyText="Aucune observation enseignant."
    />
  );
}
