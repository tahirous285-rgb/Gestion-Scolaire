import { useReferenceOptions } from "../../hooks/useReferenceOptions";
import CrudPage from "../../components/common/CrudPage";
import { getAnnees } from "../../services/anneesApi";
import { getClasses } from "../../services/classesApi";
import { getMatieres } from "../../services/matieresApi";
import { getEnseignants } from "../../services/enseignantsApi";
import { createEvaluation, getEvaluations } from "../../services/evaluationsApi";
import { getPeriodes } from "../../services/anneesApi";
import { optionsFrom, formatDate } from "../pageUtils";

export default function Evaluations() {
  const refs = useReferenceOptions({ annees: getAnnees, periodes: getPeriodes, classes: getClasses, matieres: getMatieres, enseignants: getEnseignants }, "evaluations");
  const fields = [
    { name: "id_annee", label: "Année scolaire", type: "select", required: true, options: optionsFrom(refs.annees, "id_annee", "libelle") },
    { name: "id_periode", label: "Période", type: "select", required: true, options: optionsFrom(refs.periodes, "id_periode", (row) => `${row.code} — ${row.libelle}`) },
    { name: "id_classe", label: "Classe", type: "select", required: true, options: optionsFrom(refs.classes, "id_classe", "nom") },
    { name: "id_matiere", label: "Matière", type: "select", required: true, options: optionsFrom(refs.matieres, "id_matiere", (row) => `${row.code} — ${row.nom}`) },
    { name: "id_enseignant", label: "Enseignant", type: "select", required: true, options: optionsFrom(refs.enseignants, "id_enseignant", (row) => `${row.matricule} — ${row.nom} ${row.prenom}`) },
    { name: "libelle", label: "Libellé", required: true },
    { name: "type_evaluation", label: "Type d’évaluation" },
    { name: "date_evaluation", label: "Date", type: "date" },
    { name: "bareme", label: "Barème", type: "number", required: true, min: 0, step: "0.01", default: 20 },
    { name: "coefficient", label: "Coefficient", type: "number", required: true, min: 0, step: "0.01", default: 1 },
    { name: "observation", label: "Observation", type: "textarea", full: true },
  ];
  return (
    <CrudPage
      title="Évaluations"
      subtitle="Évaluations rattachées à une année, une période, une classe et une matière."
      icon="📄"
      columns={[{ key: "libelle", label: "Évaluation" }, { key: "type_evaluation", label: "Type" }, { key: "date_evaluation", label: "Date", render: (row) => formatDate(row.date_evaluation) }, { key: "bareme", label: "Barème" }, { key: "coefficient", label: "Coef." }, { key: "id_classe", label: "Classe" }, { key: "id_matiere", label: "Matière" }]}
      fields={fields}
      initialForm={{ id_annee: "", id_periode: "", id_classe: "", id_matiere: "", id_enseignant: "", libelle: "", type_evaluation: "", date_evaluation: "", bareme: 20, coefficient: 1, observation: "" }}
      load={() => getEvaluations()}
      create={createEvaluation}
      canUpdate={false}
      canDelete={false}
      rowKey="id_evaluation"
      createLabel="Nouvelle évaluation"
      searchKeys={["libelle", "type_evaluation", "id_classe", "id_matiere", "date_evaluation"]}
      emptyText="Aucune évaluation enregistrée."
    />
  );
}
