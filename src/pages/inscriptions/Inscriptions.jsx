import { useReferenceOptions } from "../../hooks/useReferenceOptions";
import CrudPage from "../../components/common/CrudPage";
import { createInscription, deleteInscription, getInscriptions, updateInscription } from "../../services/inscriptionsApi";
import { getAnnees } from "../../services/anneesApi";
import { getClasses } from "../../services/classesApi";
import { getEleves } from "../../services/elevesApi";
import { optionsFrom, formatDate } from "../pageUtils";

export default function Inscriptions() {
  const references = useReferenceOptions({ eleves: getEleves, annees: getAnnees, classes: getClasses }, "inscriptions-references");
  const eleveOptions = optionsFrom(references.eleves, "id_eleve", (row) => `${row.matricule} — ${row.nom} ${row.prenom}`);
  const anneeOptions = optionsFrom(references.annees, "id_annee", "libelle");
  const classeOptions = optionsFrom(references.classes, "id_classe", (row) => `${row.nom}${row.niveau ? ` — ${row.niveau}` : ""}`);
  const createFields = [
    { name: "id_eleve", label: "Élève", type: "select", required: true, options: eleveOptions },
    { name: "id_annee", label: "Année scolaire", type: "select", required: true, options: anneeOptions },
    { name: "id_classe", label: "Classe", type: "select", required: true, options: classeOptions },
    { name: "numero_inscription", label: "N° inscription" },
    { name: "date_inscription", label: "Date d’inscription", type: "date" },
    { name: "statut", label: "Statut", default: "active" },
    { name: "redoublant", label: "Redoublant", type: "checkbox" },
    { name: "observation", label: "Observation", type: "textarea", full: true },
  ];
  const editFields = createFields.filter((field) => !["id_eleve", "id_annee", "date_inscription"].includes(field.name)).map((field) => ({ ...field, required: false }));
  return (
    <CrudPage
      title="Inscriptions"
      subtitle="Affectation d’un élève à une année et une classe."
      icon="📝"
      columns={[
        { key: "id_eleve", label: "ID élève" }, { key: "id_annee", label: "ID année" }, { key: "id_classe", label: "ID classe" },
        { key: "numero_inscription", label: "N° inscription" }, { key: "date_inscription", label: "Date", render: (row) => formatDate(row.date_inscription) },
        { key: "statut", label: "Statut" }, { key: "redoublant", label: "Redoublant", render: (row) => row.redoublant ? "Oui" : "Non" },
      ]}
      createFields={createFields}
      editFields={editFields}
      initialForm={{ id_eleve: "", id_annee: "", id_classe: "", numero_inscription: "", date_inscription: "", statut: "active", redoublant: false, observation: "" }}
      load={getInscriptions}
      create={createInscription}
      update={updateInscription}
      remove={deleteInscription}
      rowKey="id_inscription"
      createLabel="Nouvelle inscription"
      searchKeys={["numero_inscription", "statut", "id_eleve", "id_classe"]}
      emptyText="Aucune inscription enregistrée."
    />
  );
}
