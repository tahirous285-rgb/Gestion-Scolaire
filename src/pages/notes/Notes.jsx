import { useEffect, useMemo, useState } from "react";
import { getAnnees } from "../../services/anneesApi";
import { getClasses } from "../../services/classesApi";
import { getMatieres } from "../../services/matieresApi";
import { getEleve } from "../../services/elevesApi";
import { getInscriptions } from "../../services/inscriptionsApi";
import { getEvaluations } from "../../services/evaluationsApi";
import { getNotes, saveEvaluationNotes } from "../../services/notesApi";
import "./Notes.css";

const EMPTY_LIST = [];
const inactiveStatuses = new Set(["inactive", "inactif", "inactife", "annule", "annulé", "annulée", "supprime", "supprimé", "supprimée", "radie", "radié", "radiée"]);

function isActiveRegistration(row) {
  return !inactiveStatuses.has(String(row.statut || "active").trim().toLowerCase());
}

function studentName(student, registration) {
  return [student?.prenom, student?.nom].filter(Boolean).join(" ").trim() || `Élève #${registration.id_eleve}`;
}

export default function Notes() {
  const [references, setReferences] = useState({ annees: EMPTY_LIST, classes: EMPTY_LIST, matieres: EMPTY_LIST });
  const [loadingReferences, setLoadingReferences] = useState(true);
  const [referenceError, setReferenceError] = useState("");
  const [filters, setFilters] = useState({ id_annee: "", id_classe: "", id_matiere: "", id_evaluation: "" });
  const [evaluations, setEvaluations] = useState([]);
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);
  const [roster, setRoster] = useState([]);
  const [rows, setRows] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [rosterReloadKey, setRosterReloadKey] = useState(0);
  const [savingMode, setSavingMode] = useState("");
  const [validated, setValidated] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [rosterNotice, setRosterNotice] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getAnnees(), getClasses(), getMatieres()])
      .then(([annees, classes, matieres]) => {
        if (active) setReferences({ annees, classes, matieres });
      })
      .catch((requestError) => { if (active) setReferenceError(requestError.message || "Impossible de charger les listes de référence."); })
      .finally(() => { if (active) setLoadingReferences(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!filters.id_annee || !filters.id_classe || !filters.id_matiere) return undefined;

    let active = true;
    getEvaluations({
      id_annee: Number(filters.id_annee),
      id_classe: Number(filters.id_classe),
      id_matiere: Number(filters.id_matiere),
      limit: 1000,
    })
      .then((items) => {
        if (active) setEvaluations(Array.isArray(items) ? items : []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Impossible de charger les évaluations de cette sélection.");
      })
      .finally(() => { if (active) setLoadingEvaluations(false); });
    return () => { active = false; };
  }, [filters.id_annee, filters.id_classe, filters.id_matiere]);

  useEffect(() => {
    if (!filters.id_evaluation) return undefined;

    let active = true;
    const evaluation = evaluations.find((item) => Number(item.id_evaluation) === Number(filters.id_evaluation));
    if (!evaluation) return undefined;

    Promise.all([
      getInscriptions({ id_annee: Number(evaluation.id_annee), limit: 1000 }),
      getNotes({ id_evaluation: Number(evaluation.id_evaluation), limit: 1000 }),
    ])
      .then(async ([allRegistrations, savedNotes]) => {
        if (allRegistrations.length >= 1000) throw new Error("La liste dépasse 1 000 inscriptions; rechargez avec une liste complète avant la saisie.");
        const yearRegistrations = allRegistrations.filter(isActiveRegistration);
        const activeRoster = yearRegistrations.filter((row) => Number(row.id_classe) === Number(evaluation.id_classe));
        const otherClassesCount = yearRegistrations.filter((row) => Number(row.id_classe) !== Number(evaluation.id_classe)).length;
        const byStudent = new Map(await Promise.all(activeRoster.map(async (registration) => {
          try { return [Number(registration.id_inscription), await getEleve(Number(registration.id_eleve))]; }
          catch { return [Number(registration.id_inscription), null]; }
        })));
        const notesByRegistration = new Map(savedNotes.map((note) => [Number(note.id_inscription), note]));
        const savedIds = new Set(savedNotes.map((note) => Number(note.id_inscription)));
        const draftRows = activeRoster.map((registration) => {
          const note = notesByRegistration.get(Number(registration.id_inscription));
          return {
            id_inscription: Number(registration.id_inscription),
            inscription: registration,
            student: byStudent.get(Number(registration.id_inscription)),
            valeur: note?.valeur ?? "",
            absence: Boolean(note?.absence),
          };
        });
        if (active) {
          setRoster(activeRoster);
          setRows(draftRows);
          setValidated(Boolean(evaluation.notes_validees));
          setRosterNotice(otherClassesCount ? `${otherClassesCount} élève(s) ont une inscription active dans une autre classe de cette année et ne sont donc pas inclus dans ce relevé.` : "");
          if (savedIds.size > draftRows.length) setRosterNotice((current) => `${current ? `${current} ` : ""}Des notes existent pour des élèves qui ne sont plus inscrits dans cette classe. Elles ne seront pas modifiées par ce relevé.`);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || "Impossible de charger les élèves et les notes.");
          setRoster([]);
          setRows([]);
        }
      })
      .finally(() => { if (active) setLoadingRoster(false); });
    return () => { active = false; };
  }, [filters.id_evaluation, evaluations, rosterReloadKey]);

  const evaluation = useMemo(() => evaluations.find((item) => Number(item.id_evaluation) === Number(filters.id_evaluation)) || null, [evaluations, filters.id_evaluation]);
  const validCount = rows.filter((row) => !row.absence && row.valeur !== "" && row.valeur !== null).length;
  const absentCount = rows.filter((row) => row.absence).length;
  const periodLabel = evaluation ? `Période #${evaluation.id_periode}` : "";

  function updateFilter(event) {
    const { name, value } = event.target;
    const next = {
      ...filters,
      [name]: value,
      ...(name === "id_annee" ? { id_classe: "", id_matiere: "", id_evaluation: "" } : {}),
      ...(name === "id_classe" ? { id_evaluation: "" } : {}),
      ...(name === "id_matiere" ? { id_evaluation: "" } : {}),
    };
    if (["id_annee", "id_classe", "id_matiere"].includes(name)) {
      setEvaluations([]);
      setLoadingEvaluations(Boolean(next.id_annee && next.id_classe && next.id_matiere));
    }
    if (name === "id_annee" || name === "id_classe" || name === "id_matiere" || name === "id_evaluation") {
      setRoster([]);
      setRows([]);
      setValidated(false);
      setRosterNotice("");
      setLoadingRoster(Boolean(next.id_evaluation));
      setError("");
      setMessage("");
    }
    setFilters(next);
  }

  function updateRow(idInscription, changes) {
    setRows((current) => current.map((row) => row.id_inscription === idInscription ? { ...row, ...changes } : row));
    if (validated) {
      setValidated(false);
      setMessage("Les notes ont été modifiées. Enregistrez le brouillon ou validez-les de nouveau.");
    }
  }

  async function saveNotes(valider) {
    if (!evaluation || savingMode) return;
    setError("");
    setMessage("");
    if (valider && rows.some((row) => !row.absence && (row.valeur === "" || row.valeur === null))) {
      setError("Renseignez une note ou cochez « Absent » pour chaque élève avant de valider.");
      return;
    }
    const invalid = rows.some((row) => !row.absence && row.valeur !== "" && (
      !Number.isFinite(Number(row.valeur)) || Number(row.valeur) < 0 || Number(row.valeur) > Number(evaluation.bareme)
    ));
    if (invalid) {
      setError(`Les notes doivent être comprises entre 0 et ${evaluation.bareme}.`);
      return;
    }

    setSavingMode(valider ? "validate" : "draft");
    try {
      const result = await saveEvaluationNotes(Number(evaluation.id_evaluation), {
        valider,
        notes: rows.map((row) => ({
          id_inscription: row.id_inscription,
          valeur: row.absence || row.valeur === "" ? null : Number(row.valeur),
          absence: Boolean(row.absence),
        })),
      });
      setValidated(Boolean(result.notes_validees));
      setMessage(valider ? "Les notes sont validées." : "Le brouillon a été enregistré.");
    } catch (requestError) {
      setError(requestError.message || "Impossible d’enregistrer les notes.");
    } finally {
      setSavingMode("");
    }
  }

  const evaluationsForSelection = evaluations;
  const students = references.classes || EMPTY_LIST;
  const subjectList = references.matieres || EMPTY_LIST;

  return (
    <main className="notes-page">
      <header className="notes-header">
        <div><p className="crud-eyebrow">PÉDAGOGIE</p><h1>Saisie des notes</h1><p>Sélectionnez une classe et une évaluation pour saisir les résultats des élèves.</p></div>
      </header>

      {referenceError && <div className="crud-alert" role="alert">{referenceError}</div>}
      {error && <div className="crud-alert" role="alert">{error}</div>}
      {message && <div className="success-message" role="status">{message}</div>}

      <section className="inline-panel notes-filters">
        <div className="notes-filter-grid">
          <label>Année scolaire *<select name="id_annee" value={filters.id_annee} onChange={updateFilter} required disabled={loadingReferences}><option value="">Sélectionner une année</option>{references.annees.map((row) => <option key={row.id_annee} value={row.id_annee}>{row.libelle}</option>)}</select></label>
          <label>Classe *<select name="id_classe" value={filters.id_classe} onChange={updateFilter} required disabled={!filters.id_annee}><option value="">Sélectionner une classe</option>{students.map((row) => <option key={row.id_classe} value={row.id_classe}>{row.nom}</option>)}</select></label>
          <label>Matière *<select name="id_matiere" value={filters.id_matiere} onChange={updateFilter} required disabled={!filters.id_classe}><option value="">Sélectionner une matière</option>{subjectList.map((row) => <option key={row.id_matiere} value={row.id_matiere}>{row.nom}</option>)}</select></label>
          <label>Évaluation *<select name="id_evaluation" value={filters.id_evaluation} onChange={updateFilter} required disabled={!filters.id_matiere || loadingEvaluations}><option value="">{loadingEvaluations ? "Chargement…" : "Sélectionner une évaluation"}</option>{evaluationsForSelection.map((row) => <option key={row.id_evaluation} value={row.id_evaluation}>{row.libelle} · {row.type_evaluation || "Évaluation"}</option>)}</select></label>
        </div>
        {evaluation && <div className="notes-evaluation-summary"><span>Barème maximal</span><strong>/{evaluation.bareme}</strong><span>Sur 20</span><button type="button" className="crud-secondary notes-load-button" onClick={() => { setLoadingRoster(true); setRosterReloadKey((current) => current + 1); }} disabled={loadingRoster}>{loadingRoster ? "Chargement…" : "Charger les élèves"}</button><span className={`notes-validation-badge ${validated ? "is-validated" : ""}`}>{validated ? "Notes validées" : "Brouillon"}</span></div>}
      </section>

      {!evaluation ? <section className="crud-table-card notes-empty-state"><h2>{filters.id_classe && !evaluations.length && !loadingEvaluations ? "Aucune évaluation pour cette sélection" : "Choisissez une évaluation"}</h2><p>{filters.id_classe && !evaluations.length && !loadingEvaluations ? "Créez d’abord une évaluation dans le module Évaluations." : "Les élèves inscrits apparaîtront après le chargement de l’évaluation."}</p></section> : <section className="crud-table-card notes-roster-card">
        <div className="notes-roster-heading"><div><p className="crud-eyebrow">LISTE DES ÉLÈVES</p><h2>{subjectList.find((row) => Number(row.id_matiere) === Number(evaluation.id_matiere))?.nom || "Matière"} · {students.find((row) => Number(row.id_classe) === Number(evaluation.id_classe))?.nom || "Classe"} · {evaluation.libelle}</h2><p>{periodLabel}</p></div><strong>{loadingRoster ? "Chargement…" : `${roster.length} élève(s)`}</strong></div>
        {rosterNotice && <div className="roster-info" role="note">{rosterNotice}</div>}
        {loadingRoster ? <div className="crud-state"><h3>Chargement des élèves inscrits…</h3></div> : !roster.length ? <div className="crud-state"><h3>Aucun élève inscrit dans cette classe pour l’année choisie</h3></div> : <>
          <div className="notes-counters"><article><span>Notes renseignées</span><strong>{validCount}/{roster.length}</strong></article><article><span>Absents</span><strong>{absentCount}</strong></article></div>
          <div className="crud-table-wrap"><table className="crud-table notes-table"><thead><tr><th>Élève</th><th>Note / {evaluation.bareme}</th><th>Absent</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id_inscription}><td><strong>{studentName(row.student, row.inscription)}</strong><small>{row.student?.matricule || row.inscription.numero_inscription || `Inscription #${row.id_inscription}`}</small></td><td><input aria-label={`Note de ${studentName(row.student, row.inscription)}`} type="number" min="0" max={evaluation.bareme} step="0.01" value={row.absence ? "" : row.valeur} disabled={row.absence || savingMode === "validate"} onChange={(event) => updateRow(row.id_inscription, { valeur: event.target.value })} placeholder={`/${evaluation.bareme}`} /></td><td><label className="notes-absence-control"><input type="checkbox" checked={row.absence} disabled={savingMode === "validate"} onChange={(event) => updateRow(row.id_inscription, { absence: event.target.checked, valeur: event.target.checked ? "" : row.valeur })} /> Absent</label></td></tr>)}</tbody></table></div>
          <div className="notes-actions"><span>{validated ? "Les notes ont été validées. Toute modification nécessitera une nouvelle validation." : "Enregistrez un brouillon ou validez les notes saisies."}</span><div><button type="button" className="crud-secondary" onClick={() => saveNotes(false)} disabled={Boolean(savingMode)}>{savingMode === "draft" ? "Enregistrement…" : "Enregistrer brouillon"}</button><button type="button" className="crud-primary" onClick={() => saveNotes(true)} disabled={Boolean(savingMode) || validated}>{savingMode === "validate" ? "Validation…" : validated ? "Notes validées" : "Valider les notes"}</button></div></div>
  </>}
      </section>}
    </main>
  );
}
