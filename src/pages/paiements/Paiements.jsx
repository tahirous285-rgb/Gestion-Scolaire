import { useReferenceOptions } from "../../hooks/useReferenceOptions";
import CrudPage from "../../components/common/CrudPage";
import { userId } from "../../services/apiClient";
import { getInscriptions } from "../../services/inscriptionsApi";
import { getFrais, getPaiements, createPaiement } from "../../services/financeApi";
import { formatDateTime, formatMoney, optionsFrom } from "../pageUtils";

export default function Paiements() {
  const refs = useReferenceOptions({ inscriptions: getInscriptions, frais: getFrais }, "paiements");
  const fields = [
    { name: "id_inscription", label: "Inscription", type: "select", required: true, options: optionsFrom(refs.inscriptions, "id_inscription", (row) => `Inscription #${row.id_inscription} — élève #${row.id_eleve}`) },
    { name: "id_frais", label: "Frais scolaire", type: "select", options: optionsFrom(refs.frais, "id_frais", (row) => `Frais #${row.id_frais} — ${formatMoney(row.montant_du)}`) },
    { name: "reference", label: "Référence", required: true },
    { name: "date_paiement", label: "Date de paiement", type: "datetime-local", required: true },
    { name: "montant", label: "Montant", type: "number", min: 0, step: "0.01", required: true },
    { name: "mode_paiement", label: "Mode de paiement" },
    { name: "commentaire", label: "Commentaire", type: "textarea", full: true },
  ];
  return (
    <CrudPage title="Paiements scolaires" subtitle="Paiements enregistrés par inscription. Le reçu est consultable dans le module Reçus." icon="💳" columns={[{ key: "reference", label: "Référence" }, { key: "id_inscription", label: "Inscription" }, { key: "id_frais", label: "Frais" }, { key: "date_paiement", label: "Date", render: (row) => formatDateTime(row.date_paiement) }, { key: "montant", label: "Montant", render: (row) => formatMoney(row.montant) }, { key: "mode_paiement", label: "Mode" }, { key: "statut", label: "Statut" }]} fields={fields} initialForm={{ id_inscription: "", id_frais: "", reference: "", date_paiement: "", montant: "", mode_paiement: "", commentaire: "" }} load={() => getPaiements()} create={createPaiement} createPayload={(data) => ({ ...data, id_utilisateur: userId() })} canUpdate={false} canDelete={false} rowKey="id_paiement" createLabel="Nouveau paiement" searchKeys={["reference", "id_inscription", "id_frais", "mode_paiement", "statut"]} emptyText="Aucun paiement enregistré." />
  );
}
