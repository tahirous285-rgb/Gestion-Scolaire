import { useReferenceOptions } from "../../hooks/useReferenceOptions";
import CrudPage from "../../components/common/CrudPage";
import { establishmentId } from "../../services/apiClient";
import { createTypeFrais, getFrais, getTypesFrais, createFrais } from "../../services/financeApi";
import { getAnnees } from "../../services/anneesApi";
import { getInscriptions } from "../../services/inscriptionsApi";
import { optionsFrom, formatDate, formatMoney } from "../pageUtils";

export default function FraisScolaires() {
  const idEtablissement = establishmentId();
  const refs = useReferenceOptions({ types: () => getTypesFrais(idEtablissement), annees: getAnnees, inscriptions: getInscriptions }, "frais");
  const typeFields = [
    { name: "code", label: "Code", required: true }, { name: "libelle", label: "Libellé", required: true },
    { name: "description", label: "Description", type: "textarea", full: true }, { name: "actif", label: "Type actif", type: "checkbox", default: true },
  ];
  const feeFields = [
    { name: "id_annee", label: "Année scolaire", type: "select", required: true, options: optionsFrom(refs.annees, "id_annee", "libelle") },
    { name: "id_inscription", label: "Inscription", type: "select", required: true, options: optionsFrom(refs.inscriptions, "id_inscription", (row) => `Inscription #${row.id_inscription} — élève #${row.id_eleve}`) },
    { name: "id_type_frais", label: "Type de frais", type: "select", required: true, options: optionsFrom(refs.types, "id_type_frais", (row) => `${row.code} — ${row.libelle}`) },
    { name: "montant_du", label: "Montant dû", type: "number", min: 0, step: "0.01", required: true },
    { name: "date_echeance", label: "Date d’échéance", type: "date" },
    { name: "obligatoire", label: "Obligatoire", type: "checkbox", default: true },
    { name: "description", label: "Description", type: "textarea", full: true },
  ];
  return (
    <div className="stacked-pages">
      <CrudPage title="Types de frais" subtitle="Référentiel des types de frais de l’établissement." icon="🏷️" columns={[{ key: "code", label: "Code" }, { key: "libelle", label: "Libellé" }, { key: "description", label: "Description" }, { key: "actif", label: "Statut", render: (row) => row.actif ? "Actif" : "Inactif" }]} fields={typeFields} initialForm={{ id_etablissement: idEtablissement || "", code: "", libelle: "", description: "", actif: true }} load={() => getTypesFrais(idEtablissement)} create={createTypeFrais} createPayload={(data) => ({ ...data, id_etablissement: idEtablissement })} canUpdate={false} canDelete={false} rowKey="id_type_frais" createLabel="Nouveau type" searchKeys={["code", "libelle", "description"]} emptyText="Aucun type de frais." />
      <CrudPage title="Frais scolaires" subtitle="Frais affectés à une inscription." icon="💰" columns={[{ key: "id_annee", label: "Année" }, { key: "id_inscription", label: "Inscription" }, { key: "id_type_frais", label: "Type" }, { key: "montant_du", label: "Montant dû", render: (row) => formatMoney(row.montant_du) }, { key: "date_echeance", label: "Échéance", render: (row) => formatDate(row.date_echeance) }, { key: "obligatoire", label: "Obligatoire", render: (row) => row.obligatoire ? "Oui" : "Non" }]} fields={feeFields} initialForm={{ id_annee: "", id_inscription: "", id_type_frais: "", montant_du: "", date_echeance: "", obligatoire: true, description: "" }} load={getFrais} create={createFrais} canUpdate={false} canDelete={false} rowKey="id_frais" createLabel="Nouveau frais" searchKeys={["id_annee", "id_inscription", "id_type_frais", "description"]} emptyText="Aucun frais scolaire." />
    </div>
  );
}
