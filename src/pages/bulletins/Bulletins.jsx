import { userId } from "../../services/apiClient";
import { useReferenceOptions } from "../../hooks/useReferenceOptions";
import CrudPage from "../../components/common/CrudPage";
import { getPeriodes } from "../../services/anneesApi";
import { getInscriptions } from "../../services/inscriptionsApi";
import { createBulletin, generateBulletinPdf, getBulletins, updateBulletin } from "../../services/bulletinsApi";
import { formatDateTime, optionsFrom } from "../pageUtils";
import { printBulletin } from "../../utils/printBulletinsCartes";

export default function Bulletins() {
  const refs = useReferenceOptions({ inscriptions: getInscriptions, periodes: getPeriodes }, "bulletins");
  const createFields = [
    { name: "id_inscription", label: "Inscription", type: "select", required: true, options: optionsFrom(refs.inscriptions, "id_inscription", (row) => row.label) },
    { name: "id_periode", label: "Période", type: "select", required: true, options: optionsFrom(refs.periodes, "id_periode", (row) => `${row.code} — ${row.libelle}`), dependsOn: ["id_inscription"], optionsFor: (form) => optionsFrom(refs.periodes?.filter((period) => period.id_annee === refs.inscriptions?.find((item) => String(item.id_inscription) === String(form.id_inscription))?.id_annee), "id_periode", "libelle") },
    { name: "moyenne_generale", label: "Moyenne générale", type: "number", min: 0, step: "0.01" },
    { name: "rang", label: "Rang", type: "number", min: 1 },
    { name: "appreciation", label: "Appréciation", type: "textarea", full: true },
    { name: "decision", label: "Décision" },
    { name: "valide", label: "Bulletin validé", type: "checkbox" },
  ];
  const editFields = createFields.filter((field) => !["id_inscription", "id_periode"].includes(field.name));
  return (
    <CrudPage referenceError={refs.error}
      title="Bulletins"
      subtitle="Impression frontend avec photo élève. Le PDF serveur actuel ne contient pas la photo ; son chemin est retourné sans route de téléchargement."
      icon="📑"
      columns={[{ key: "id_inscription", label: "Inscription" }, { key: "id_periode", label: "Période" }, { key: "moyenne_generale", label: "Moyenne" }, { key: "rang", label: "Rang" }, { key: "valide", label: "Validé", render: (row) => row.valide ? "Oui" : "Non" }, { key: "date_generation", label: "Généré le", render: (row) => formatDateTime(row.date_generation) }, { key: "pdf", label: "PDF", render: (row) => row.pdf || "Non généré" }]}
      createFields={createFields}
      editFields={editFields}
      initialForm={{ id_inscription: "", id_periode: "", moyenne_generale: "", rang: "", appreciation: "", decision: "", valide: false, id_validateur: "" }}
      load={() => getBulletins()}
      create={createBulletin}
      createPayload={(data) => ({ ...data, id_validateur: data.valide ? userId() : null })}
      update={updateBulletin}
      updatePayload={(data, previous) => ({ ...data, id_validateur: data.valide ? (previous.valide ? previous.id_validateur || userId() : userId()) : null })}
      extraActions={(row, { runAction, busy }) => (
        <>
          <button type="button" disabled={busy} onClick={() => runAction(() => printBulletin(row), { refresh: false })}>🖨 Imprimer / PDF</button>
          <button type="button" disabled={busy} onClick={() => runAction(() => generateBulletinPdf(row.id_bulletin))}>📄 Générer PDF serveur</button>
        </>
      )}
      rowKey="id_bulletin"
      createLabel="Nouveau bulletin"
      searchKeys={["id_inscription", "id_periode", "moyenne_generale", "decision"]}
      emptyText="Aucun bulletin enregistré."
    />
  );
}
