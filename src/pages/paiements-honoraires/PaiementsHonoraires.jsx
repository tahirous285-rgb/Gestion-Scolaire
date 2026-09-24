import { useState } from "react";
import CrudPage from "../../components/common/CrudPage";
import { getHonoraires, createPaiementHonoraire, getPaiementsHonoraire } from "../../services/honorairesApi";
import { optionsFrom, formatDateTime, formatMoney } from "../pageUtils";
import { useReferenceOptions } from "../../hooks/useReferenceOptions";
import { userId } from "../../services/apiClient";

const fields = [
  { name: "id_honoraire", label: "Honoraire", type: "select", required: true },
  { name: "reference", label: "Référence", required: true },
  { name: "date_paiement", label: "Date de paiement", type: "datetime-local", required: true },
  { name: "montant", label: "Montant", type: "number", min: 0, step: "0.01", required: true },
  { name: "mode_paiement", label: "Mode de paiement" },
  { name: "commentaire", label: "Commentaire", type: "textarea", full: true },
];

export default function PaiementsHonoraires() {
  const refs = useReferenceOptions({ honoraires: getHonoraires }, "paiements-honoraires");
  const [honoraireId, setHonoraireId] = useState("");
  const honoraires = refs.honoraires || [];
  const honorariumOptions = optionsFrom(honoraires, "id_honoraire", (row) => `Honoraire #${row.id_honoraire} — ${formatMoney(row.montant_net)}`);
  const formFields = fields.map((field) => field.name === "id_honoraire" ? { ...field, options: honorariumOptions } : field);
  const load = () => honoraireId ? getPaiementsHonoraire(honoraireId) : Promise.resolve([]);
  return (
    <div className="crud-page">
      <div className="crud-header"><div><div className="crud-eyebrow">Honoraires</div><h1>💳 Paiements honoraires</h1><p>Le backend expose les paiements par honoraire, pas de liste globale.</p></div></div>
      <section className="inline-panel"><label>Honoraire à consulter<select value={honoraireId} onChange={(event) => setHonoraireId(event.target.value)}><option value="">Sélectionner…</option>{honorariumOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label></section>
      <CrudPage
        key={honoraireId || "aucun-honoraire"}
        title="Paiements honoraires"
        subtitle={honoraireId ? `Paiements de l’honoraire #${honoraireId}.` : "Sélectionnez un honoraire pour consulter ses paiements."}
        icon="💳"
        columns={[{ key: "reference", label: "Référence" }, { key: "date_paiement", label: "Date", render: (row) => formatDateTime(row.date_paiement) }, { key: "montant", label: "Montant", render: (row) => formatMoney(row.montant) }, { key: "mode_paiement", label: "Mode" }, { key: "statut", label: "Statut" }]}
        fields={formFields}
        initialForm={{ id_honoraire: honoraireId, reference: "", date_paiement: "", montant: "", mode_paiement: "", commentaire: "" }}
        load={load}
        create={createPaiementHonoraire}
        createPayload={(data) => ({ ...data, id_honoraire: Number(data.id_honoraire), id_utilisateur: userId() })}
        canUpdate={false}
        canDelete={false}
        canCreate={Boolean(honoraireId)}
        rowKey="id_paiement_honoraire"
        createLabel="Nouveau paiement"
        searchKeys={["reference", "mode_paiement", "statut"]}
        emptyText={honoraireId ? "Aucun paiement pour cet honoraire." : "Sélectionnez un honoraire."}
      />
    </div>
  );
}
