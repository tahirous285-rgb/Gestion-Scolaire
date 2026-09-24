import CrudPage from "../../components/common/CrudPage";
import { establishmentId, userId } from "../../services/apiClient";
import { createDepense, getDepenses } from "../../services/financeApi";
import { formatDate, formatMoney } from "../pageUtils";

const fields = [
  { name: "date_depense", label: "Date", type: "date", required: true },
  { name: "categorie", label: "Catégorie" },
  { name: "libelle", label: "Libellé", required: true },
  { name: "montant", label: "Montant", type: "number", min: 0, step: "0.01", required: true },
  { name: "fournisseur", label: "Fournisseur" },
  { name: "reference_piece", label: "Référence pièce" },
  { name: "mode_paiement", label: "Mode de paiement" },
  { name: "justificatif", label: "Justificatif (URL)" },
  { name: "observation", label: "Observation", type: "textarea", full: true },
];

export default function Depenses() {
  const idEtablissement = establishmentId();
  return <CrudPage title="Dépenses" subtitle="Dépenses enregistrées pour l’établissement." icon="📉" columns={[{ key: "date_depense", label: "Date", render: (row) => formatDate(row.date_depense) }, { key: "categorie", label: "Catégorie" }, { key: "libelle", label: "Libellé" }, { key: "montant", label: "Montant", render: (row) => formatMoney(row.montant) }, { key: "fournisseur", label: "Fournisseur" }, { key: "mode_paiement", label: "Mode" }]} fields={fields} initialForm={{ id_etablissement: idEtablissement || "", date_depense: "", categorie: "", libelle: "", montant: "", fournisseur: "", reference_piece: "", mode_paiement: "", justificatif: "", observation: "" }} load={() => getDepenses(idEtablissement)} create={createDepense} createPayload={(data) => ({ ...data, id_etablissement: idEtablissement, id_utilisateur: userId() })} canUpdate={false} canDelete={false} rowKey="id_depense" createLabel="Nouvelle dépense" searchKeys={["date_depense", "categorie", "libelle", "fournisseur", "mode_paiement"]} emptyText="Aucune dépense enregistrée." />;
}
