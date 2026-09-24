import { useReferenceOptions } from "../../hooks/useReferenceOptions";
import CrudPage from "../../components/common/CrudPage";
import { getPeriodes } from "../../services/anneesApi";
import { getInscriptions } from "../../services/inscriptionsApi";
import { createBulletin, generateBulletinPdf, getBulletins, updateBulletin } from "../../services/bulletinsApi";
import { formatDateTime, optionsFrom } from "../pageUtils";

export default function Bulletins() {
  const refs = useReferenceOptions({ inscriptions: getInscriptions, periodes: getPeriodes }, "bulletins");
  const createFields = [
    { name: "id_inscription", label: "Inscription", type: "select", required: true, options: optionsFrom(refs.inscriptions, "id_inscription", (row) => `Inscription #${row.id_inscription} — élève #${row.id_eleve}`) },
    { name: "id_periode", label: "Période", type: "select", required: true, options: optionsFrom(refs.periodes, "id_periode", (row) => `${row.code} — ${row.libelle}`) },
    { name: "moyenne_generale", label: "Moyenne générale", type: "number", min: 0, step: "0.01" },
    { name: "rang", label: "Rang", type: "number", min: 1 },
    { name: "appreciation", label: "Appréciation", type: "textarea", full: true },
    { name: "decision", label: "Décision" },
    { name: "valide", label: "Bulletin validé", type: "checkbox" },
    { name: "id_validateur", label: "ID validateur", type: "number" },
  ];
  const editFields = createFields.filter((field) => !["id_inscription", "id_periode"].includes(field.name));
  return (
    <CrudPage
      title="Bulletins"
      subtitle="Bulletins par inscription et période, avec génération PDF disponible côté backend."
      icon="📑"
      columns={[{ key: "id_inscription", label: "Inscription" }, { key: "id_periode", label: "Période" }, { key: "moyenne_generale", label: "Moyenne" }, { key: "rang", label: "Rang" }, { key: "valide", label: "Validé", render: (row) => row.valide ? "Oui" : "Non" }, { key: "date_generation", label: "Généré le", render: (row) => formatDateTime(row.date_generation) }, { key: "pdf", label: "PDF", render: (row) => row.pdf ? "Disponible" : "—" }]}
      createFields={createFields}
      editFields={editFields}
      initialForm={{ id_inscription: "", id_periode: "", moyenne_generale: "", rang: "", appreciation: "", decision: "", valide: false, id_validateur: "" }}
      load={() => getBulletins()}
      create={createBulletin}
      update={updateBulletin}
      extraActions={(row, { runAction, busy }) => <button type="button" disabled={busy} onClick={() => runAction(() => generateBulletinPdf(row.id_bulletin))}>📄 Générer PDF</button>}
      rowKey="id_bulletin"
      createLabel="Nouveau bulletin"
      searchKeys={["id_inscription", "id_periode", "moyenne_generale", "decision"]}
      emptyText="Aucun bulletin enregistré."
    />
  );
}
