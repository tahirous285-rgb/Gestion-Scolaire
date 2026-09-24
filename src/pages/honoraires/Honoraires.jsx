import { useReferenceOptions } from "../../hooks/useReferenceOptions";
import CrudPage from "../../components/common/CrudPage";
import { getAnnees } from "../../services/anneesApi";
import { createMois, createHonoraire, getHonoraires, getMois, updateHonoraire } from "../../services/honorairesApi";
import { getEnseignants } from "../../services/enseignantsApi";
import { formatDateTime, formatMoney, optionsFrom } from "../pageUtils";

export default function Honoraires() {
  const refs = useReferenceOptions({ enseignants: getEnseignants, annees: getAnnees, mois: getMois }, "honoraires");
  const monthFields = [
    { name: "numero", label: "Numéro", type: "number", min: 1, max: 12, required: true },
    { name: "libelle", label: "Libellé", required: true },
  ];
  const honorariumFields = [
    { name: "id_enseignant", label: "Enseignant", type: "select", required: true, options: optionsFrom(refs.enseignants, "id_enseignant", (row) => `${row.matricule} — ${row.nom} ${row.prenom}`) },
    { name: "id_annee", label: "Année scolaire", type: "select", required: true, options: optionsFrom(refs.annees, "id_annee", "libelle") },
    { name: "id_mois", label: "Mois", type: "select", required: true, options: optionsFrom(refs.mois, "id_mois", (row) => `${row.numero} — ${row.libelle}`) },
    { name: "heures_prevues", label: "Heures prévues", type: "number", min: 0, step: "0.01" },
    { name: "heures_effectuees", label: "Heures effectuées", type: "number", min: 0, step: "0.01" },
    { name: "taux_horaire", label: "Taux horaire", type: "number", min: 0, step: "0.01", required: true },
    { name: "retenues", label: "Retenues", type: "number", min: 0, step: "0.01", default: 0 },
  ];
  const editFields = [
    { name: "heures_effectuees", label: "Heures effectuées", type: "number", min: 0, step: "0.01" },
    { name: "retenues", label: "Retenues", type: "number", min: 0, step: "0.01" },
    { name: "statut", label: "Statut" },
    { name: "id_validateur", label: "ID validateur", type: "number" },
    { name: "observation", label: "Observation", type: "textarea", full: true },
  ];
  return (
    <div className="stacked-pages">
      <CrudPage
        title="Mois"
        subtitle="Référentiel des mois utilisé par les honoraires."
        icon="🗓️"
        columns={[{ key: "numero", label: "N°" }, { key: "libelle", label: "Libellé" }]}
        fields={monthFields}
        initialForm={{ numero: "", libelle: "" }}
        load={getMois}
        create={createMois}
        canUpdate={false}
        canDelete={false}
        rowKey="id_mois"
        createLabel="Nouveau mois"
        searchKeys={["numero", "libelle"]}
        emptyText="Aucun mois configuré."
      />
      <CrudPage
        title="Honoraires"
        subtitle="Calculs d’honoraires par enseignant, année et mois."
        icon="💼"
        columns={[{ key: "id_enseignant", label: "Enseignant" }, { key: "id_annee", label: "Année" }, { key: "id_mois", label: "Mois" }, { key: "montant_brut", label: "Brut", render: (row) => formatMoney(row.montant_brut) }, { key: "montant_net", label: "Net", render: (row) => formatMoney(row.montant_net) }, { key: "solde", label: "Solde", render: (row) => formatMoney(row.solde) }, { key: "statut", label: "Statut" }, { key: "date_calcul", label: "Calculé le", render: (row) => formatDateTime(row.date_calcul) }]}
        createFields={honorariumFields}
        editFields={editFields}
        initialForm={{ id_enseignant: "", id_annee: "", id_mois: "", heures_prevues: "", heures_effectuees: "", taux_horaire: "", retenues: 0, statut: "", id_validateur: "", observation: "" }}
        load={() => getHonoraires()}
        create={createHonoraire}
        update={updateHonoraire}
        rowKey="id_honoraire"
        createLabel="Nouvel honoraire"
        searchKeys={["id_enseignant", "id_annee", "id_mois", "statut"]}
        emptyText="Aucun honoraire enregistré."
      />
    </div>
  );
}
