import { useEffect, useMemo, useState } from "react";
import { getAnnees, getPeriodes } from "../../services/anneesApi";
import { getClasses } from "../../services/classesApi";
import { getMatieres } from "../../services/matieresApi";
import { getEnseignants, getEnseignantsAffectes, getEnseignantsDeClasse, linkEnseignantMatiere } from "../../services/enseignantsApi";
import { getEleve, getEleves } from "../../services/elevesApi";
import { getInscriptions } from "../../services/inscriptionsApi";
import { createEvaluation, getEvaluations } from "../../services/evaluationsApi";
import { createNote, getNotes, updateNote } from "../../services/notesApi";
import { formatDate } from "../pageUtils";
import "./Evaluations.css";

const EMPTY_REFERENCES = { annees: [], periodes: [], classes: [], matieres: [], enseignants: [] };
const TYPE_OPTIONS = ["Devoir", "Interrogation", "Composition", "Examen", "Autre"];

function activeInscription(inscription) {
  return !["inactive", "inactif", "annule", "annulée", "supprimé", "radié"].includes(
    String(inscription.statut || "active").trim().toLowerCase(),
  );
}

function statusFor(evaluation, noteCount, studentCount) {
  const today = new Date().toISOString().slice(0, 10);
  if (evaluation.date_evaluation && evaluation.date_evaluation > today) return "À venir";
  if (studentCount > 0 && noteCount >= studentCount) return "Terminée";
  if (noteCount > 0) return "Saisie en cours";
  return "Brouillon";
}

function studentName(student, inscription) {
  return [student?.prenom, student?.nom].filter(Boolean).join(" ").trim() || `Élève #${inscription.id_eleve}`;
}

export default function Evaluations() {
  const [references, setReferences] = useState(EMPTY_REFERENCES);
  const [loadingReferences, setLoadingReferences] = useState(true);
  const [referenceError, setReferenceError] = useState("");
  const [evaluations, setEvaluations] = useState([]);
  const [evaluationStates, setEvaluationStates] = useState({});
  const [loadingEvaluations, setLoadingEvaluations] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savingEvaluation, setSavingEvaluation] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [classTeachers, setClassTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [filters, setFilters] = useState({ id_annee: "", id_classe: "", id_matiere: "", id_enseignant: "", id_periode: "", statut: "" });
  const [form, setForm] = useState({ id_annee: "", id_classe: "", id_matiere: "", id_enseignant: "", id_periode: "", libelle: "", type_evaluation: "Devoir", date_evaluation: "", bareme: "20", coefficient: "1", observation: "" });
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [students, setStudents] = useState([]);
  const [rosterNote, setRosterNote] = useState("");
  const [gradeRows, setGradeRows] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [savingGrades, setSavingGrades] = useState(false);
  const [gradeError, setGradeError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getAnnees(), getPeriodes(), getClasses(), getMatieres(), getEnseignants({ limit: 1000 })])
      .then(([annees, periodes, classes, matieres, enseignants]) => {
        if (active) setReferences({ annees, periodes, classes, matieres, enseignants });
      })
      .catch((requestError) => { if (active) setReferenceError(requestError.message || "Impossible de charger les listes nécessaires."); })
      .finally(() => { if (active) setLoadingReferences(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      getEvaluations({
        id_annee: filters.id_annee || undefined,
        id_classe: filters.id_classe || undefined,
        id_matiere: filters.id_matiere || undefined,
        id_enseignant: filters.id_enseignant || undefined,
        id_periode: filters.id_periode || undefined,
        limit: 1000,
      }),
      getNotes({ limit: 1000 }),
    ])
      .then(async ([evaluationRows, noteRows]) => {
        const years = [...new Set(evaluationRows.map((row) => Number(row.id_annee)))];
        const enrolmentsByYear = new Map(await Promise.all(years.map(async (yearId) => {
          const rows = await getInscriptions({ id_annee: yearId, limit: 1000 });
          return [yearId, rows.filter(activeInscription)];
        })));
        const noteCounts = new Map();
        noteRows.forEach((note) => noteCounts.set(Number(note.id_evaluation), (noteCounts.get(Number(note.id_evaluation)) || 0) + 1));
        const states = Object.fromEntries(evaluationRows.map((row) => {
          const roster = (enrolmentsByYear.get(Number(row.id_annee)) || []).filter((item) => Number(item.id_classe) === Number(row.id_classe));
          const count = noteCounts.get(Number(row.id_evaluation)) || 0;
          return [row.id_evaluation, { status: statusFor(row, count, roster.length), noteCount: count, studentCount: roster.length }];
        }));
        if (active) { setEvaluations(evaluationRows); setEvaluationStates(states); setError(""); }
      })
      .catch((requestError) => { if (active) setError(requestError.message || "Impossible de charger les évaluations."); })
      .finally(() => { if (active) setLoadingEvaluations(false); });
    return () => { active = false; };
  }, [refreshKey, filters.id_annee, filters.id_classe, filters.id_matiere, filters.id_enseignant, filters.id_periode]);

  useEffect(() => {
    if (!form.id_annee || !form.id_classe || !form.id_matiere || !references.enseignants.length) return undefined;
    let active = true;
    Promise.all([
      getEnseignantsAffectes({ id_annee: Number(form.id_annee), id_classe: Number(form.id_classe), id_matiere: Number(form.id_matiere) }),
      getEnseignantsDeClasse({ id_annee: Number(form.id_annee), id_classe: Number(form.id_classe) }),
    ])
      .then(([assignedTeachers, teachersInClass]) => {
        if (active) {
          setTeacherAssignments(Array.isArray(assignedTeachers) ? assignedTeachers : []);
          setClassTeachers(Array.isArray(teachersInClass) ? teachersInClass : []);
        }
      })
      .catch((requestError) => { if (active) setError(requestError.message || "Impossible de vérifier les affectations des enseignants."); })
      .finally(() => { if (active) setLoadingTeachers(false); });
    return () => { active = false; };
  }, [form.id_annee, form.id_classe, form.id_matiere, references.enseignants]);

  async function assignSubjectToTeacher(teacher) {
    setError("");
    setLoadingTeachers(true);
    try {
      await linkEnseignantMatiere({
        id_enseignant: Number(teacher.id_enseignant),
        id_matiere: Number(form.id_matiere),
        principal: false,
      });
      setForm((current) => ({ ...current, id_enseignant: String(teacher.id_enseignant) }));
      const assignedTeachers = await getEnseignantsAffectes({
        id_annee: Number(form.id_annee),
        id_classe: Number(form.id_classe),
        id_matiere: Number(form.id_matiere),
      });
      setTeacherAssignments(Array.isArray(assignedTeachers) ? assignedTeachers : []);
      setSuccess(`${teacher.prenom} ${teacher.nom} est maintenant affecté à cette matière.`);
    } catch (requestError) {
      setError(requestError.message || "Impossible d’affecter cette matière à l’enseignant.");
    } finally {
      setLoadingTeachers(false);
    }
  }

  const periodsForForm = useMemo(() => references.periodes.filter((row) => !form.id_annee || Number(row.id_annee) === Number(form.id_annee)), [references.periodes, form.id_annee]);
  const periodsForFilter = useMemo(() => references.periodes.filter((row) => !filters.id_annee || Number(row.id_annee) === Number(filters.id_annee)), [references.periodes, filters.id_annee]);
  const filteredEvaluations = useMemo(() => evaluations.filter((row) => {
    const status = evaluationStates[row.id_evaluation]?.status || "Brouillon";
    return (!filters.id_annee || Number(row.id_annee) === Number(filters.id_annee))
      && (!filters.id_classe || Number(row.id_classe) === Number(filters.id_classe))
      && (!filters.id_matiere || Number(row.id_matiere) === Number(filters.id_matiere))
      && (!filters.id_enseignant || Number(row.id_enseignant) === Number(filters.id_enseignant))
      && (!filters.id_periode || Number(row.id_periode) === Number(filters.id_periode))
      && (!filters.statut || status === filters.statut);
  }), [evaluations, evaluationStates, filters]);

  function changeForm(event) {
    const { name, value } = event.target;
    const nextValues = { ...form, [name]: value };
    if (name === "id_annee") Object.assign(nextValues, { id_periode: "", id_classe: "", id_matiere: "", id_enseignant: "" });
    if (name === "id_classe" || name === "id_matiere") nextValues.id_enseignant = "";
    if (name === "id_annee" || name === "id_classe" || name === "id_matiere") {
      setTeacherAssignments([]);
      setClassTeachers([]);
      setLoadingTeachers(Boolean(nextValues.id_annee && nextValues.id_classe && nextValues.id_matiere && references.enseignants.length));
    }
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "id_annee") Object.assign(next, { id_periode: "", id_classe: "", id_matiere: "", id_enseignant: "" });
      if (name === "id_classe" || name === "id_matiere") next.id_enseignant = "";
      return next;
    });
  }

  function changeFilter(event, filterName) {
    setLoadingEvaluations(true);
    setFilters((current) => ({
      ...current,
      [filterName]: event.target.value,
      ...(filterName === "id_annee" ? { id_periode: "" } : {}),
    }));
  }

  async function submitEvaluation(event) {
    event.preventDefault(); setError(""); setSuccess(""); setSavingEvaluation(true);
    try {
      const created = await createEvaluation({ ...form, id_annee: Number(form.id_annee), id_periode: Number(form.id_periode), id_classe: Number(form.id_classe), id_matiere: Number(form.id_matiere), id_enseignant: Number(form.id_enseignant), bareme: Number(form.bareme), coefficient: Number(form.coefficient) });
      setForm((current) => ({ ...current, libelle: "", type_evaluation: "Devoir", date_evaluation: "", observation: "" }));
      setShowCreate(false); setSuccess("L’évaluation a été créée. Vous pouvez maintenant saisir les notes."); setRefreshKey((current) => current + 1); openGradeEntry(created);
    } catch (requestError) { setError(requestError.message || "La création de l’évaluation a échoué."); }
    finally { setSavingEvaluation(false); }
  }

  async function openGradeEntry(evaluation) {
    setSelectedEvaluation(evaluation); setLoadingGrades(true); setGradeError("");
    try {
      const [allInscriptions, notes, allStudents] = await Promise.all([
        getInscriptions({ id_annee: Number(evaluation.id_annee), limit: 1000 }),
        getNotes({ id_evaluation: Number(evaluation.id_evaluation), limit: 1000 }),
        getEleves({ limit: 1000 }),
      ]);
      if (allInscriptions.length >= 1000) throw new Error("La liste dépasse 1 000 élèves; la saisie est interrompue pour éviter une liste incomplète.");
      const activeYearInscriptions = allInscriptions.filter(activeInscription);
      const roster = activeYearInscriptions.filter((row) => Number(row.id_classe) === Number(evaluation.id_classe));
      const enrolledStudentIds = new Set(activeYearInscriptions.map((row) => Number(row.id_eleve)));
      const registeredElsewhere = activeYearInscriptions.filter((row) => Number(row.id_classe) !== Number(evaluation.id_classe)).length;
      const notRegisteredThisYear = allStudents.filter((student) => !enrolledStudentIds.has(Number(student.id_eleve))).length;
      setRosterNote([
        registeredElsewhere ? `${registeredElsewhere} élève(s) ont une inscription active dans une autre classe de cette année.` : "",
        notRegisteredThisYear ? `${notRegisteredThisYear} fiche(s) élève ne sont pas inscrites pour cette année scolaire.` : "",
        "Seuls les élèves inscrits dans la classe et l’année de l’évaluation apparaissent ici. Gérez les inscriptions ou utilisez « Changer de classe » dans le module Inscriptions.",
      ].filter(Boolean).join(" "));
      const namedStudents = await Promise.all(roster.map(async (row) => {
        try { return [Number(row.id_inscription), await getEleve(Number(row.id_eleve))]; }
        catch { return [Number(row.id_inscription), null]; }
      }));
      const names = new Map(namedStudents); const notesByInscription = new Map(notes.map((row) => [Number(row.id_inscription), row]));
      setStudents(roster);
      setGradeRows(roster.map((inscription) => {
        const note = notesByInscription.get(Number(inscription.id_inscription));
        return { id_inscription: Number(inscription.id_inscription), inscription, student: names.get(Number(inscription.id_inscription)), id_note: note?.id_note || null, valeur: note?.valeur ?? "", absence: Boolean(note?.absence) };
      }));
    } catch (requestError) { setGradeError(requestError.message || "Impossible de charger les élèves et les notes."); setStudents([]); setGradeRows([]); setRosterNote(""); }
    finally { setLoadingGrades(false); }
  }

  async function saveGrades(event) {
    event.preventDefault();
    if (!selectedEvaluation || savingGrades) return;
    setGradeError("");
    const invalid = gradeRows.some((row) => !row.absence && row.valeur !== "" && (!Number.isFinite(Number(row.valeur)) || Number(row.valeur) < 0 || Number(row.valeur) > Number(selectedEvaluation.bareme)));
    if (invalid) { setGradeError(`Chaque note doit être comprise entre 0 et ${selectedEvaluation.bareme}.`); return; }
    setSavingGrades(true);
    try {
      for (const row of gradeRows) {
        if (!row.id_note && !row.absence && row.valeur === "") continue;
        const noteValues = { valeur: row.absence || row.valeur === "" ? null : Number(row.valeur), absence: Boolean(row.absence) };
        if (row.id_note) {
          await updateNote(row.id_note, noteValues);
        } else {
          const created = await createNote({ id_evaluation: Number(selectedEvaluation.id_evaluation), id_inscription: row.id_inscription, ...noteValues });
          setGradeRows((current) => current.map((item) => item.id_inscription === row.id_inscription ? { ...item, id_note: created.id_note } : item));
        }
      }
      setSuccess("Les notes ont été enregistrées."); setRefreshKey((current) => current + 1); await openGradeEntry(selectedEvaluation);
    } catch (requestError) { setGradeError(requestError.message || "Certaines notes n’ont pas pu être enregistrées. Vérifiez la liste avant de réessayer."); setRefreshKey((current) => current + 1); }
    finally { setSavingGrades(false); }
  }

  const validNotesCount = gradeRows.filter((row) => !row.absence && row.valeur !== "").length;
  const labelFor = (rows, key, id, labelKey = "nom") => rows.find((row) => Number(row[key]) === Number(id))?.[labelKey] || "—";

  return (
    <div className="crud-page evaluation-page">
      <header className="crud-header evaluation-header"><div><div className="crud-eyebrow">Pédagogie</div><h1>Évaluations</h1><p>Créez un devoir, puis saisissez les notes de la classe.</p></div><button type="button" className="crud-primary" onClick={() => { setShowCreate((value) => !value); setSuccess(""); }}>{showCreate ? "Fermer le formulaire" : "Nouvelle évaluation"}</button></header>
      {referenceError && <div className="crud-alert" role="alert">{referenceError}</div>}{error && <div className="crud-alert" role="alert">{error}</div>}{success && <div className="success-message" role="status">{success}</div>}

      {showCreate && <section className="inline-panel evaluation-create-panel"><div className="inline-panel-heading"><div><div className="crud-eyebrow">Nouvelle évaluation</div><h2>Définir l’évaluation</h2><p>Les choix proposés se mettent à jour selon l’année, la classe et la matière.</p></div></div><form className="evaluation-form" onSubmit={submitEvaluation}>
        <label className="evaluation-field evaluation-field-wide">Intitulé de l’évaluation *<input name="libelle" value={form.libelle} onChange={changeForm} placeholder="Ex. Devoir n°1" required /></label>
        <label className="evaluation-field">Année scolaire *<select name="id_annee" value={form.id_annee} onChange={changeForm} required disabled={loadingReferences}><option value="">Sélectionner une année</option>{references.annees.map((row) => <option key={row.id_annee} value={row.id_annee}>{row.libelle}</option>)}</select></label>
        <label className="evaluation-field">Classe *<select name="id_classe" value={form.id_classe} onChange={changeForm} required disabled={!form.id_annee}><option value="">Sélectionner une classe</option>{references.classes.map((row) => <option key={row.id_classe} value={row.id_classe}>{row.nom}</option>)}</select></label>
        <label className="evaluation-field">Matière *<select name="id_matiere" value={form.id_matiere} onChange={changeForm} required disabled={!form.id_classe}><option value="">Sélectionner une matière</option>{references.matieres.map((row) => <option key={row.id_matiere} value={row.id_matiere}>{row.nom}</option>)}</select></label>
        <label className="evaluation-field">Type d’évaluation *<select name="type_evaluation" value={form.type_evaluation} onChange={changeForm} required>{TYPE_OPTIONS.map((type) => <option key={type}>{type}</option>)}</select></label>
        <label className="evaluation-field">Date de l’évaluation *<input type="date" name="date_evaluation" value={form.date_evaluation} onChange={changeForm} required /></label>
        <label className="evaluation-field">Période scolaire *<select name="id_periode" value={form.id_periode} onChange={changeForm} required disabled={!form.id_annee}><option value="">Sélectionner une période</option>{periodsForForm.map((row) => <option key={row.id_periode} value={row.id_periode}>{row.libelle}</option>)}</select></label>
        <label className="evaluation-field">Barème maximal *<input type="number" name="bareme" min="0.01" step="0.01" value={form.bareme} onChange={changeForm} required /></label>
        <label className="evaluation-field">Coefficient<input type="number" name="coefficient" min="0" step="0.01" value={form.coefficient} onChange={changeForm} required /></label>
        <label className="evaluation-field">Enseignant responsable *<select name="id_enseignant" value={form.id_enseignant} onChange={changeForm} required disabled={!form.id_classe || !form.id_matiere || loadingTeachers}><option value="">{loadingTeachers ? "Vérification des affectations…" : "Sélectionner un enseignant"}</option>{teacherAssignments.map((row) => <option key={row.id_enseignant} value={row.id_enseignant}>{row.prenom} {row.nom}</option>)}</select>{!loadingTeachers && form.id_classe && form.id_matiere && !teacherAssignments.length && (classTeachers.length ? <span className="teacher-assignment-help"><span>Aucun enseignant de cette classe n’est encore affecté à la matière choisie.</span>{classTeachers.map((teacher) => <button key={teacher.id_enseignant} type="button" className="crud-secondary" onClick={() => assignSubjectToTeacher(teacher)}>Affecter {teacher.prenom} {teacher.nom} à cette matière</button>)}</span> : <small>Aucun enseignant n’est affecté à cette classe pour l’année choisie. Créez d’abord cette affectation dans le module Affectations.</small>)}</label>
        <label className="evaluation-field evaluation-field-wide">Description ou consignes<textarea name="observation" value={form.observation} onChange={changeForm} rows="3" placeholder="Consignes utiles pour l’évaluation" /></label>
        <div className="evaluation-form-actions"><button type="button" className="crud-secondary" onClick={() => setShowCreate(false)} disabled={savingEvaluation}>Annuler</button><button type="submit" className="crud-primary" disabled={savingEvaluation || loadingReferences || loadingTeachers || !teacherAssignments.some((row) => Number(row.id_enseignant) === Number(form.id_enseignant))}>{savingEvaluation ? "Création…" : "Créer l’évaluation"}</button></div>
      </form></section>}

      <section className="inline-panel evaluation-filters"><div className="inline-panel-heading"><div><div className="crud-eyebrow">Suivi</div><h2>Liste des évaluations</h2></div><p>{loadingEvaluations ? "Chargement…" : `${filteredEvaluations.length} évaluation(s)`}</p></div><div className="evaluation-filter-grid">
        <label>Année scolaire<select value={filters.id_annee} onChange={(event) => changeFilter(event, "id_annee")}><option value="">Toutes</option>{references.annees.map((row) => <option key={row.id_annee} value={row.id_annee}>{row.libelle}</option>)}</select></label>
        <label>Classe<select value={filters.id_classe} onChange={(event) => changeFilter(event, "id_classe")}><option value="">Toutes</option>{references.classes.map((row) => <option key={row.id_classe} value={row.id_classe}>{row.nom}</option>)}</select></label>
        <label>Matière<select value={filters.id_matiere} onChange={(event) => changeFilter(event, "id_matiere")}><option value="">Toutes</option>{references.matieres.map((row) => <option key={row.id_matiere} value={row.id_matiere}>{row.nom}</option>)}</select></label>
        <label>Enseignant<select value={filters.id_enseignant} onChange={(event) => changeFilter(event, "id_enseignant")}><option value="">Tous</option>{references.enseignants.map((row) => <option key={row.id_enseignant} value={row.id_enseignant}>{row.prenom} {row.nom}</option>)}</select></label>
        <label>Période<select value={filters.id_periode} onChange={(event) => changeFilter(event, "id_periode")}><option value="">Toutes</option>{periodsForFilter.map((row) => <option key={row.id_periode} value={row.id_periode}>{row.libelle}</option>)}</select></label>
        <label>Statut<select value={filters.statut} onChange={(event) => { setFilters((current) => ({ ...current, statut: event.target.value })); }}><option value="">Tous</option><option>À venir</option><option>Brouillon</option><option>Saisie en cours</option><option>Terminée</option></select></label>
      </div></section>

      <section className="crud-table-card evaluation-table-card">{loadingEvaluations ? <div className="crud-state"><h3>Chargement des évaluations…</h3></div> : !filteredEvaluations.length ? <div className="crud-state"><h3>Aucune évaluation trouvée</h3><p>Modifiez les filtres ou créez une évaluation.</p></div> : <div className="crud-table-wrap"><table className="crud-table evaluation-table"><thead><tr><th>Évaluation</th><th>Matière</th><th>Classe</th><th>Date</th><th>Enseignant</th><th>Statut</th><th></th></tr></thead><tbody>{filteredEvaluations.map((row) => {
        const teacher = references.enseignants.find((item) => Number(item.id_enseignant) === Number(row.id_enseignant)); const state = evaluationStates[row.id_evaluation] || {}; const status = state.status || "Brouillon";
        const statusClass = status === "Terminée" ? "done" : status === "À venir" ? "upcoming" : status === "Saisie en cours" ? "progress" : "draft";
        return <tr key={row.id_evaluation}><td><strong>{row.libelle}</strong><small>{row.type_evaluation || "Évaluation"} · /{row.bareme}</small></td><td>{labelFor(references.matieres, "id_matiere", row.id_matiere)}</td><td>{labelFor(references.classes, "id_classe", row.id_classe)}</td><td>{formatDate(row.date_evaluation)}</td><td>{teacher ? `${teacher.prenom} ${teacher.nom}` : "—"}</td><td><span className={`evaluation-status status-${statusClass}`}>{status}</span><small>{state.noteCount || 0} / {state.studentCount || 0} notes</small></td><td><button type="button" className="crud-secondary evaluation-grade-button" onClick={() => openGradeEntry(row)}>Saisir les notes</button></td></tr>;
      })}</tbody></table></div>}</section>

      {selectedEvaluation && <section className="inline-panel grade-entry-panel"><div className="inline-panel-heading"><div><div className="crud-eyebrow">Saisie des notes</div><h2>{selectedEvaluation.libelle} · {labelFor(references.matieres, "id_matiere", selectedEvaluation.id_matiere)}</h2><p>{labelFor(references.classes, "id_classe", selectedEvaluation.id_classe)} · /{selectedEvaluation.bareme} · {labelFor(references.periodes, "id_periode", selectedEvaluation.id_periode, "libelle")}</p></div><button type="button" className="crud-secondary" onClick={() => setSelectedEvaluation(null)} disabled={savingGrades}>Fermer</button></div>
        {rosterNote && <div className="roster-info" role="note">{rosterNote}</div>}
        {gradeError && <div className="crud-alert" role="alert">{gradeError}</div>}{loadingGrades ? <div className="crud-state"><h3>Chargement des élèves…</h3></div> : !students.length ? <div className="crud-state"><h3>Aucun élève actif dans cette classe pour cette année</h3></div> : <form onSubmit={saveGrades}><div className="grade-summary"><strong>{validNotesCount} note(s) valide(s) sur {students.length} élève(s)</strong><span>Les absences ne comptent pas comme une note.</span></div><div className="crud-table-wrap"><table className="crud-table grade-table"><thead><tr><th>Élève</th><th>Note / {selectedEvaluation.bareme}</th><th>Absent</th></tr></thead><tbody>{gradeRows.map((row) => <tr key={row.id_inscription}><td><strong>{row.student?.matricule || `Inscription #${row.id_inscription}`} · {studentName(row.student, row.inscription)}</strong></td><td><input aria-label={`Note de ${studentName(row.student, row.inscription)}`} type="number" min="0" max={selectedEvaluation.bareme} step="0.01" value={row.absence ? "" : row.valeur} disabled={row.absence || savingGrades} onChange={(event) => setGradeRows((current) => current.map((item) => item.id_inscription === row.id_inscription ? { ...item, valeur: event.target.value } : item))} placeholder="—" /></td><td><label className="grade-absence"><input type="checkbox" checked={row.absence} disabled={savingGrades} onChange={(event) => setGradeRows((current) => current.map((item) => item.id_inscription === row.id_inscription ? { ...item, absence: event.target.checked } : item))} /> Absent</label></td></tr>)}</tbody></table></div><div className="evaluation-form-actions"><button type="submit" className="crud-primary" disabled={savingGrades}>{savingGrades ? "Enregistrement…" : "Enregistrer les notes"}</button></div></form>}
      </section>}
    </div>
  );
}
