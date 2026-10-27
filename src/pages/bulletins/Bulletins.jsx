import { useState } from "react";
import { useReferenceOptions } from "../../hooks/useReferenceOptions";
import BulletinBatchGenerator from "./BulletinBatchGenerator";
import CrudPage from "../../components/common/CrudPage";
import { getPeriodes } from "../../services/anneesApi";
import { getInscription, getInscriptions } from "../../services/inscriptionsApi";
import { getEvaluations } from "../../services/evaluationsApi";
import { getNotes } from "../../services/notesApi";
import {
  createBulletin,
  generateBulletinPdf,
  getBulletins,
  updateBulletin,
} from "../../services/bulletinsApi";
import { formatDateTime, optionsFrom } from "../pageUtils";
import { printBulletin } from "../../utils/printBulletinsCartes";
import { computeClassResults, isEligibleInscription } from "../../utils/bulletinCalculations";

const API_LIST_LIMIT = 100;

async function generateIndividualBulletin(data, references) {
  const inscriptionId = Number(data.id_inscription);
  const periodeId = Number(data.id_periode);
  const inscription = await getInscription(inscriptionId);
  const periode = (references.periodes || []).find((row) => Number(row.id_periode) === periodeId);
  if (!periode) throw new Error("La période sélectionnée est introuvable. Actualisez la page et réessayez.");
  if (Number(periode.id_annee) !== Number(inscription.id_annee)) {
    throw new Error("La période sélectionnée n’appartient pas à l’année scolaire de cette inscription.");
  }

  const [allInscriptions, rawEvaluations] = await Promise.all([
    getInscriptions({ id_annee: Number(inscription.id_annee), limit: 1000 }),
    getEvaluations({ id_classe: Number(inscription.id_classe), id_periode: periodeId }),
  ]);
  if (allInscriptions.length >= 1000) {
    throw new Error("La liste d’inscriptions dépasse la limite de l’API; le rang ne peut pas être calculé de façon fiable.");
  }
  if (rawEvaluations.length >= API_LIST_LIMIT) {
    throw new Error("La liste des évaluations peut être tronquée; le bulletin n’a pas été généré.");
  }

  const inscriptions = allInscriptions.filter((row) =>
    Number(row.id_annee) === Number(inscription.id_annee) &&
    Number(row.id_classe) === Number(inscription.id_classe) &&
    isEligibleInscription(row),
  );
  const evaluations = rawEvaluations.filter((row) =>
    Number(row.id_annee) === Number(inscription.id_annee) &&
    Number(row.id_classe) === Number(inscription.id_classe) &&
    Number(row.id_periode) === periodeId,
  );
  if (!inscriptions.some((row) => Number(row.id_inscription) === inscriptionId)) {
    throw new Error("L’inscription sélectionnée n’est pas active dans cette classe et cette année.");
  }
  if (!evaluations.length) {
    throw new Error("Aucune évaluation n’a été enregistrée pour cette classe et cette période.");
  }

  const noteSets = await Promise.all(evaluations.map(async (evaluation) => {
    const notes = await getNotes({ id_evaluation: Number(evaluation.id_evaluation) });
    if (notes.length >= API_LIST_LIMIT) {
      throw new Error("La liste des notes peut être tronquée; le bulletin n’a pas été généré.");
    }
    return [Number(evaluation.id_evaluation), notes];
  }));
  const results = computeClassResults(inscriptions, evaluations, new Map(noteSets));
  const result = results.find((row) => Number(row.id_inscription) === inscriptionId);
  if (!result || result.moyenne_generale === null) {
    throw new Error("Aucune note exploitable n’a été enregistrée pour cet élève dans cette période.");
  }

  const existing = await getBulletins({ id_inscription: inscriptionId, id_periode: periodeId });
  if (existing.length > 1) {
    throw new Error("Plusieurs bulletins existent déjà pour cet élève et cette période. Corrigez les doublons avant de continuer.");
  }
  if (existing[0]?.valide && !window.confirm(
    "Ce bulletin est déjà validé. Le recalcul va remplacer sa moyenne et son rang et retirer sa validation. Continuer ?",
  )) {
    throw new Error("Génération annulée. Le bulletin validé n’a pas été modifié.");
  }
  const payload = {
    id_inscription: inscriptionId,
    id_periode: periodeId,
    moyenne_generale: result.moyenne_generale,
    rang: result.rang,
    appreciation: data.appreciation,
    decision: data.decision,
    valide: Boolean(data.valide),
    id_validateur: data.id_validateur,
  };
  if (existing[0]?.valide) {
    payload.valide = false;
    payload.id_validateur = null;
  }

  return existing.length
    ? updateBulletin(Number(existing[0].id_bulletin), payload)
    : createBulletin(payload);
}

async function generateServerPdf(idBulletin) {
  try {
    // L’endpoint renvoie un objet JSON avec le champ pdf (chemin), pas un flux binaire.
    return await generateBulletinPdf(idBulletin);
  } catch (error) {
    throw new Error(`Génération PDF serveur impossible : ${error.message || "erreur réseau"}`, { cause: error });
  }
}

export default function Bulletins() {
  const [refreshKey, setRefreshKey] = useState(0);
  const refs = useReferenceOptions({ inscriptions: getInscriptions, periodes: getPeriodes }, "bulletins");
  const createFields = [
    { name: "id_inscription", label: "Inscription", type: "select", required: true, options: optionsFrom(refs.inscriptions, "id_inscription", (row) => `Inscription #${row.id_inscription} — élève #${row.id_eleve}`) },
    { name: "id_periode", label: "Période", type: "select", required: true, options: optionsFrom(refs.periodes, "id_periode", "libelle") },
    { name: "appreciation", label: "Appréciation", type: "textarea", full: true },
    { name: "decision", label: "Décision" },
    { name: "valide", label: "Bulletin validé", type: "checkbox" },
    { name: "id_validateur", label: "ID validateur", type: "number" },
  ];
  const editFields = createFields.filter((field) => !["id_inscription", "id_periode"].includes(field.name));

  return (
    <CrudPage
      refreshTrigger={refreshKey}
      title="Bulletins"
      subtitle="Consultez, imprimez et gérez les bulletins individuels, ou générez les bulletins de toute une classe à partir des notes enregistrées."
      toolbarActions={<BulletinBatchGenerator onGenerated={() => setRefreshKey((current) => current + 1)} />}
      icon="📑"
      columns={[
        { key: "id_inscription", label: "Inscription" },
        { key: "id_periode", label: "Période" },
        { key: "moyenne_generale", label: "Moyenne" },
        { key: "rang", label: "Rang" },
        { key: "valide", label: "Validé", render: (row) => row.valide ? "Oui" : "Non" },
        { key: "date_generation", label: "Généré le", render: (row) => formatDateTime(row.date_generation) },
        { key: "pdf", label: "PDF serveur", render: (row) => row.pdf ? "Chemin enregistré" : "—" },
      ]}
      createFields={createFields}
      editFields={editFields}
      initialForm={{ id_inscription: "", id_periode: "", appreciation: "", decision: "", valide: false, id_validateur: "" }}
      load={() => getBulletins()}
      create={(data) => generateIndividualBulletin(data, refs)}
      update={updateBulletin}
      extraActions={(row, { runAction, busy }) => (
        <>
          <button type="button" disabled={busy} onClick={() => runAction(() => printBulletin(row))}>🖨 Imprimer / PDF</button>
          <button type="button" disabled={busy} onClick={() => runAction(() => generateServerPdf(row.id_bulletin))}>📄 Générer PDF serveur</button>
        </>
      )}
      rowKey="id_bulletin"
      createLabel="Générer un bulletin"
      searchKeys={["id_inscription", "id_periode", "moyenne_generale", "decision"]}
      emptyText="Aucun bulletin enregistré."
    />
  );
}
