import { useEffect, useMemo, useState } from "react";
import { getAnnees } from "../../services/anneesApi";
import { getClasses } from "../../services/classesApi";
import { getMatieres } from "../../services/matieresApi";
import { getEleve } from "../../services/elevesApi";
import { getInscriptions } from "../../services/inscriptionsApi";
import { userId } from "../../services/apiClient";
import { getPresencesEleves, saveAppelPresences } from "../../services/presencesElevesApi";
import "./PresencesEleves.css";

const EMPTY_LIST = [];
const STATUS_OPTIONS = [
  { value: "PRESENT", label: "Présent" },
  { value: "ABSENT", label: "Absent" },
  { value: "RETARD", label: "En retard" },
  { value: "EXCUSE", label: "Excusé" },
];
const inactiveStatuses = new Set(["inactive", "inactif", "inactife", "annule", "annulé", "annulée", "supprime", "supprimé", "supprimée", "radie", "radié", "radiée"]);

function localDateValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function isActiveRegistration(row) {
  return !inactiveStatuses.has(String(row.statut || "active").trim().toLowerCase());
}

function fullName(student, registration) {
  return [student?.prenom, student?.nom].filter(Boolean).join(" ").trim() || `Élève #${registration.id_eleve}`;
}

export default function PresencesEleves() {
  const [references, setReferences] = useState({ annees: EMPTY_LIST, classes: EMPTY_LIST, matieres: EMPTY_LIST });
  const [loadingReferences, setLoadingReferences] = useState(true);
  const [filters, setFilters] = useState({ id_annee: "", id_classe: "", id_matiere: "", date_presence: localDateValue() });
  const [rows, setRows] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getAnnees(), getClasses(), getMatieres()])
      .then(([annees, classes, matieres]) => {
        if (active) setReferences({ annees, classes, matieres });
      })
      .catch((requestError) => { if (active) setError(requestError.message || "Impossible de charger les années, classes et matières."); })
      .finally(() => { if (active) setLoadingReferences(false); });
    return () => { active = false; };
  }, []);

  const classes = references.classes || EMPTY_LIST;
  const subjects = references.matieres || EMPTY_LIST;
  const schoolClass = classes.find((row) => Number(row.id_classe) === Number(filters.id_classe));
  const subject = subjects.find((row) => Number(row.id_matiere) === Number(filters.id_matiere));
  const presentCount = rows.filter((row) => row.statut === "PRESENT").length;
  const absentCount = rows.filter((row) => row.statut === "ABSENT").length;
  const lateCount = rows.filter((row) => row.statut === "RETARD").length;
  const otherCount = rows.filter((row) => !["PRESENT", "ABSENT", "RETARD"].includes(row.statut)).length;

  function updateFilter(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
    setRows([]);
    setLoaded(false);
    setError("");
    setMessage("");
  }

  async function loadRoster() {
    if (!filters.id_annee || !filters.id_classe || !filters.id_matiere || !filters.date_presence || loadingRoster) return;
    setLoadingRoster(true);
    setError("");
    setMessage("");
    try {
      const [allRegistrations, savedAttendance] = await Promise.all([
        getInscriptions({ id_annee: Number(filters.id_annee), limit: 1000 }),
        getPresencesEleves({ id_annee: Number(filters.id_annee), id_classe: Number(filters.id_classe), date_presence: filters.date_presence }),
      ]);
      if (allRegistrations.length >= 1000) throw new Error("La liste dépasse 1 000 inscriptions; le pointage est arrêté pour éviter une liste incomplète.");
      const roster = allRegistrations.filter((row) => Number(row.id_classe) === Number(filters.id_classe) && isActiveRegistration(row));
      const students = await Promise.all(roster.map(async (registration) => {
        try { return [Number(registration.id_inscription), await getEleve(Number(registration.id_eleve))]; }
        catch { return [Number(registration.id_inscription), null]; }
      }));
      const studentByRegistration = new Map(students);
      const attendanceByRegistration = new Map((Array.isArray(savedAttendance) ? savedAttendance : []).map((presence) => [Number(presence.id_inscription), presence]));
      setRows(roster.map((registration) => {
        const existing = attendanceByRegistration.get(Number(registration.id_inscription));
        return {
          id_inscription: Number(registration.id_inscription),
          registration,
          student: studentByRegistration.get(Number(registration.id_inscription)),
          id_presence: existing?.id_presence || null,
          statut: existing?.statut || "PRESENT",
          motif: existing?.motif || "",
          justifiee: Boolean(existing?.justifiee),
          observation: existing?.observation || "",
        };
      }));
      setLoaded(true);
      if (savedAttendance?.length) setMessage("Les présences déjà saisies pour cette date ont été chargées.");
    } catch (requestError) {
      setError(requestError.message || "Impossible de charger les élèves de cette classe.");
      setRows([]);
      setLoaded(false);
    } finally {
      setLoadingRoster(false);
    }
  }

  function updateRow(idInscription, patch) {
    setRows((current) => current.map((row) => row.id_inscription === idInscription ? { ...row, ...patch } : row));
  }

  async function saveAttendance() {
    if (!loaded || saving) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const result = await saveAppelPresences({
        id_annee: Number(filters.id_annee),
        id_classe: Number(filters.id_classe),
        id_matiere: Number(filters.id_matiere),
        date_presence: filters.date_presence,
        id_utilisateur: userId(),
        presences: rows.map((row) => ({
          id_inscription: row.id_inscription,
          statut: row.statut,
          motif: row.motif || null,
          justifiee: Boolean(row.justifiee),
          observation: row.observation || null,
        })),
      });
      setRows((current) => current.map((row) => {
        const saved = result.presences.find((presence) => Number(presence.id_inscription) === row.id_inscription);
        return saved ? { ...row, id_presence: saved.id_presence } : row;
      }));
      setMessage(`L’appel est enregistré pour ${result.enregistrees} élève(s).`);
    } catch (requestError) {
      setError(requestError.message || "Impossible d’enregistrer l’appel.");
    } finally {
      setSaving(false);
    }
  }

  const canLoad = Boolean(filters.id_annee && filters.id_classe && filters.id_matiere && filters.date_presence);
  const dateLabel = useMemo(() => {
    if (!filters.date_presence) return "";
    return new Date(`${filters.date_presence}T12:00:00`).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  }, [filters.date_presence]);

  return (
    <main className="attendance-page">
      <header className="attendance-header"><div><p className="crud-eyebrow">SCOLARITÉ</p><h1>Présence des élèves</h1><p>Effectuer l’appel et enregistrer les présences de la classe.</p></div></header>
      {error && <div className="crud-alert" role="alert">{error}</div>}
      {message && <div className="success-message" role="status">{message}</div>}

      <section className="inline-panel attendance-filters">
        <div className="attendance-filter-grid">
          <label>Date de présence *<input type="date" name="date_presence" value={filters.date_presence} onChange={updateFilter} required /></label>
          <label>Année scolaire *<select name="id_annee" value={filters.id_annee} onChange={updateFilter} required disabled={loadingReferences}><option value="">Sélectionner une année</option>{references.annees.map((row) => <option key={row.id_annee} value={row.id_annee}>{row.libelle}</option>)}</select></label>
          <label>Classe *<select name="id_classe" value={filters.id_classe} onChange={updateFilter} required disabled={!filters.id_annee}><option value="">Sélectionner une classe</option>{classes.map((row) => <option key={row.id_classe} value={row.id_classe}>{row.nom}</option>)}</select></label>
          <label>Cours / Matière *<select name="id_matiere" value={filters.id_matiere} onChange={updateFilter} required disabled={!filters.id_classe}><option value="">Sélectionner une matière</option>{subjects.map((row) => <option key={row.id_matiere} value={row.id_matiere}>{row.nom}</option>)}</select></label>
        </div>
        <div className="attendance-load-row"><button type="button" className="crud-primary" onClick={loadRoster} disabled={!canLoad || loadingRoster}>{loadingRoster ? "Chargement…" : loaded ? "Recharger les élèves" : "Charger les élèves"}</button></div>
      </section>

      {!loaded ? <section className="crud-table-card attendance-empty-state"><h2>{loadingRoster ? "Chargement du roster…" : "Sélectionnez la classe et le cours"}</h2><p>La liste affichera les élèves inscrits pour l’année scolaire choisie.</p></section> : <section className="crud-table-card attendance-roster-card">
        <div className="attendance-roster-heading"><div><p className="crud-eyebrow">LISTE DES ÉLÈVES · {dateLabel}</p><h2>{schoolClass?.nom || "Classe"} · {subject?.nom || "Matière"}</h2></div><strong>{rows.length} élève(s)</strong></div>
        {rows.length === 0 ? <div className="crud-state"><h3>Aucun élève inscrit dans cette classe pour l’année choisie</h3></div> : <>
          <div className="attendance-stats"><article><span>Présents</span><strong>{presentCount}</strong></article><article><span>Absents</span><strong>{absentCount}</strong></article><article><span>En retard</span><strong>{lateCount}</strong></article><article><span>Autres statuts</span><strong>{otherCount}</strong></article></div>
          <div className="crud-table-wrap"><table className="crud-table attendance-table"><thead><tr><th>Élève</th><th>Statut</th><th>Motif ou observation</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id_inscription}><td><strong>{fullName(row.student, row.registration)}</strong><small>{row.student?.matricule || row.registration.numero_inscription || `Inscription #${row.id_inscription}`}</small></td><td><select aria-label={`Statut de ${fullName(row.student, row.registration)}`} value={row.statut} onChange={(event) => updateRow(row.id_inscription, { statut: event.target.value, justifiee: event.target.value === "EXCUSE" ? true : row.justifiee })}>{STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></td><td><input aria-label={`Motif ou observation de ${fullName(row.student, row.registration)}`} value={row.motif} onChange={(event) => updateRow(row.id_inscription, { motif: event.target.value })} placeholder={row.statut === "PRESENT" ? "Facultatif" : "Préciser le motif"} /></td></tr>)}</tbody></table></div>
          <div className="attendance-actions"><span>Appel du {dateLabel} · {rows.length} élève(s)</span><button type="button" className="crud-primary" onClick={saveAttendance} disabled={saving || rows.length === 0}>{saving ? "Enregistrement…" : "Enregistrer l’appel"}</button></div>
        </>}
      </section>}
    </main>
  );
}
