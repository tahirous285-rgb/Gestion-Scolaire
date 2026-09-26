import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, Avatar, Badge, EmptyState, FilterSelect, LoadingState, ModuleHeader, ModulePage, RefreshButton,
  SearchInput, StatCard, StatGrid, Toolbar, loadAll, useAsyncData, useFlash,
} from "../../components/module/ModuleKit";
import { getAnnees } from "../../services/anneesApi";
import { getClasses } from "../../services/classesApi";
import { getEleves } from "../../services/elevesApi";
import { getEnseignants } from "../../services/enseignantsApi";
import { getEvaluations } from "../../services/evaluationsApi";
import { getInscriptions } from "../../services/inscriptionsApi";
import { getMatieres } from "../../services/matieresApi";
import { createNote, deleteNote, getNotes, updateNote } from "../../services/notesApi";
import { getPeriodes } from "../../services/periodesApi";
import { formatDate, fullName, includesText, mapBy } from "../pageUtils";
import "./Notes.css";

function mention(value, bareme) {
  if (value === null || value === undefined || value === "") return null;
  const sur20 = (Number(value) / Number(bareme || 20)) * 20;
  if (sur20 >= 16) return { label: "Très bien", tone: "green" };
  if (sur20 >= 14) return { label: "Bien", tone: "blue" };
  if (sur20 >= 12) return { label: "Assez bien", tone: "purple" };
  if (sur20 >= 10) return { label: "Passable", tone: "yellow" };
  return { label: "Insuffisant", tone: "red" };
}

function round(value, digits = 2) {
  return Math.round(value * 10 ** digits) / 10 ** digits;
}

export default function Notes() {
  const navigate = useNavigate();
  const [classeId, setClasseId] = useState("");
  const [periodeId, setPeriodeId] = useState("");
  const [evaluationId, setEvaluationId] = useState("");
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [notesLoading, setNotesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flash, showFlash, clearFlash] = useFlash();

  const { data, loading, error, setError, reload } = useAsyncData(() =>
    loadAll({
      evaluations: () => getEvaluations(),
      classes: getClasses,
      periodes: () => getPeriodes(),
      annees: getAnnees,
      matieres: getMatieres,
      enseignants: () => getEnseignants(),
      inscriptions: () => getInscriptions(),
      eleves: () => getEleves({ limit: 1000 }),
    }),
  );
  const refs = data || { evaluations: [], classes: [], periodes: [], annees: [], matieres: [], enseignants: [], inscriptions: [], eleves: [] };
  const classesMap = useMemo(() => mapBy(refs.classes, "id_classe"), [refs.classes]);
  const matieresMap = useMemo(() => mapBy(refs.matieres, "id_matiere"), [refs.matieres]);
  const periodesMap = useMemo(() => mapBy(refs.periodes, "id_periode"), [refs.periodes]);
  const enseignantsMap = useMemo(() => mapBy(refs.enseignants, "id_enseignant"), [refs.enseignants]);
  const elevesMap = useMemo(() => mapBy(refs.eleves, "id_eleve"), [refs.eleves]);

  const evaluationsFiltrees = useMemo(
    () =>
      refs.evaluations
        .filter((e) => !classeId || String(e.id_classe) === classeId)
        .filter((e) => !periodeId || String(e.id_periode) === periodeId)
        .sort((a, b) => String(b.date_evaluation || "").localeCompare(String(a.date_evaluation || ""))),
    [refs.evaluations, classeId, periodeId],
  );

  // Sélection automatique de la première évaluation disponible
  useEffect(() => {
    if (loading) return;
    if (!evaluationsFiltrees.some((e) => String(e.id_evaluation) === evaluationId)) {
      setEvaluationId(evaluationsFiltrees[0] ? String(evaluationsFiltrees[0].id_evaluation) : "");
    }
  }, [evaluationsFiltrees, evaluationId, loading]);

  const evaluation = refs.evaluations.find((e) => String(e.id_evaluation) === evaluationId) || null;
  const bareme = Number(evaluation?.bareme || 20);

  async function loadNotes(id = evaluationId) {
    if (!id) {
      setNotes([]);
      return;
    }
    try {
      setNotesLoading(true);
      const list = await getNotes({ id_evaluation: id });
      setNotes(Array.isArray(list) ? list : []);
      setDrafts({});
    } catch (err) {
      setError(err.message);
    } finally {
      setNotesLoading(false);
    }
  }

  useEffect(() => {
    loadNotes(evaluationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluationId]);

  const notesByInscription = useMemo(() => mapBy(notes, "id_inscription"), [notes]);

  // Élèves inscrits dans la classe de l'évaluation (même année)
  const lignes = useMemo(() => {
    if (!evaluation) return [];
    return refs.inscriptions
      .filter((i) => String(i.id_classe) === String(evaluation.id_classe) && String(i.id_annee) === String(evaluation.id_annee))
      .map((ins) => {
        const eleve = elevesMap.get(String(ins.id_eleve));
        const note = notesByInscription.get(String(ins.id_inscription));
        const draft = drafts[ins.id_inscription];
        const current = draft || {
          valeur: note?.valeur ?? "",
          absence: Boolean(note?.absence),
          observation: note?.observation || "",
        };
        return { ins, eleve, nom: fullName(eleve) || `Élève #${ins.id_eleve}`, note, current, dirty: Boolean(draft) };
      })
      .sort((a, b) => (a.eleve?.nom || "").localeCompare(b.eleve?.nom || "") || a.nom.localeCompare(b.nom));
  }, [evaluation, refs.inscriptions, elevesMap, notesByInscription, drafts]);

  const lignesAffichees = lignes.filter((l) => includesText([l.nom, l.eleve?.matricule], search));

  const stats = useMemo(() => {
    const valeurs = lignes
      .filter((l) => !l.current.absence && l.current.valeur !== "" && l.current.valeur !== null)
      .map((l) => Number(l.current.valeur));
    const saisies = lignes.filter((l) => l.note).length;
    const moyenne = valeurs.length ? valeurs.reduce((a, b) => a + b, 0) / valeurs.length : null;
    return {
      moyenne,
      max: valeurs.length ? Math.max(...valeurs) : null,
      min: valeurs.length ? Math.min(...valeurs) : null,
      reussite: valeurs.length ? Math.round((valeurs.filter((v) => v >= bareme / 2).length / valeurs.length) * 100) : null,
      saisies,
      absents: lignes.filter((l) => l.current.absence).length,
    };
  }, [lignes, bareme]);

  // Rang (par valeur décroissante)
  const rangs = useMemo(() => {
    const sorted = lignes
      .filter((l) => !l.current.absence && l.current.valeur !== "")
      .map((l) => ({ id: l.ins.id_inscription, v: Number(l.current.valeur) }))
      .sort((a, b) => b.v - a.v);
    const map = new Map();
    sorted.forEach((item, index) => {
      const previous = sorted[index - 1];
      map.set(item.id, previous && previous.v === item.v ? map.get(previous.id) : index + 1);
    });
    return map;
  }, [lignes]);

  function updateDraft(ligne, patch) {
    setDrafts((current) => ({ ...current, [ligne.ins.id_inscription]: { ...ligne.current, ...patch } }));
  }

  const invalid = lignes.filter((l) => l.dirty && l.current.valeur !== "" && (Number(l.current.valeur) < 0 || Number(l.current.valeur) > bareme));
  const dirtyCount = Object.keys(drafts).length;

  async function saveAll() {
    if (invalid.length) {
      setError(`${invalid.length} note(s) hors barème (0 à ${bareme}).`);
      return;
    }
    const toSave = lignes.filter((l) => l.dirty);
    try {
      setSaving(true);
      setError("");
      const results = await Promise.allSettled(
        toSave.map((l) => {
          const payload = {
            valeur: l.current.absence || l.current.valeur === "" ? null : Number(l.current.valeur),
            absence: Boolean(l.current.absence),
            observation: l.current.observation || null,
          };
          if (l.note) return updateNote(l.note.id_note, payload);
          if (payload.valeur === null && !payload.absence && !payload.observation) return Promise.resolve(null);
          return createNote({ ...payload, id_evaluation: evaluation.id_evaluation, id_inscription: l.ins.id_inscription });
        }),
      );
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length) setError(`${failed.length} note(s) non enregistrée(s) : ${failed[0].reason?.message || ""}`);
      showFlash(`${results.length - failed.length} note(s) enregistrée(s).`);
      await loadNotes();
    } finally {
      setSaving(false);
    }
  }

  async function removeNote(ligne) {
    if (!ligne.note || !window.confirm(`Supprimer la note de ${ligne.nom} ?`)) return;
    try {
      await deleteNote(ligne.note.id_note);
      showFlash(`Note de ${ligne.nom} supprimée.`);
      await loadNotes();
    } catch (err) {
      setError(err.message);
    }
  }

  const matiere = evaluation ? matieresMap.get(String(evaluation.id_matiere)) : null;
  const fmt = (v) => (v === null || v === undefined ? "—" : `${round(v)} / ${bareme}`);

  return (
    <ModulePage>
      <ModuleHeader icon="📝" title="Saisie des notes" subtitle="Saisissez les notes d'une évaluation pour toute la classe, en une seule fois.">
        <button type="button" className="mk-btn mk-btn-light" onClick={() => navigate("/evaluations")}>📋 Évaluations</button>
        <button type="button" className="mk-btn mk-btn-primary" onClick={saveAll} disabled={!dirtyCount || saving}>
          💾 {saving ? "Enregistrement…" : `Enregistrer${dirtyCount ? ` (${dirtyCount})` : ""}`}
        </button>
      </ModuleHeader>

      <Alert message={error} onClose={() => setError("")} />
      <Alert message={flash} onClose={clearFlash} kind="success" />

      <Toolbar>
        <FilterSelect label="Classe" value={classeId} onChange={setClasseId} placeholder="Toutes les classes" options={refs.classes.map((c) => ({ value: String(c.id_classe), label: c.nom }))} />
        <FilterSelect label="Période" value={periodeId} onChange={setPeriodeId} placeholder="Toutes les périodes" options={refs.periodes.map((p) => ({ value: String(p.id_periode), label: p.libelle }))} />
        <label className="mk-filter" style={{ flex: 1, minWidth: 260 }}>
          <span>Évaluation</span>
          <select value={evaluationId} onChange={(e) => { if (!dirtyCount || window.confirm("Des modifications non enregistrées seront perdues. Continuer ?")) setEvaluationId(e.target.value); }}>
            {evaluationsFiltrees.length === 0 && <option value="">Aucune évaluation</option>}
            {evaluationsFiltrees.map((e) => (
              <option key={e.id_evaluation} value={e.id_evaluation}>
                {e.libelle} — {matieresMap.get(String(e.id_matiere))?.nom || "Matière"} · {classesMap.get(String(e.id_classe))?.nom || "Classe"} ({formatDate(e.date_evaluation)})
              </option>
            ))}
          </select>
        </label>
        <RefreshButton onClick={() => { reload(); loadNotes(); }} loading={loading || notesLoading} />
      </Toolbar>

      {loading ? (
        <div className="mk-table-card"><LoadingState /></div>
      ) : !evaluation ? (
        <div className="mk-table-card">
          <EmptyState icon="📝" title="Aucune évaluation" text="Créez d'abord une évaluation pour pouvoir saisir des notes.">
            <button type="button" className="mk-btn mk-btn-primary" style={{ marginTop: 14 }} onClick={() => navigate("/evaluations")}>Créer une évaluation</button>
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="notes-eval-card">
            <div>
              <span className="notes-eval-kicker">{evaluation.type_evaluation || "Évaluation"} · {periodesMap.get(String(evaluation.id_periode))?.libelle}</span>
              <h2>{evaluation.libelle}</h2>
              <p>
                {matiere?.nom || "Matière"} · {classesMap.get(String(evaluation.id_classe))?.nom} · {fullName(enseignantsMap.get(String(evaluation.id_enseignant))) || "Enseignant"} · {formatDate(evaluation.date_evaluation)}
              </p>
            </div>
            <div className="notes-eval-meta">
              <div><small>Barème</small><strong>{bareme}</strong></div>
              <div><small>Coefficient</small><strong>{evaluation.coefficient}</strong></div>
              <div><small>Saisies</small><strong>{stats.saisies}/{lignes.length}</strong></div>
            </div>
          </div>

          <StatGrid>
            <StatCard icon="📊" label="Moyenne de la classe" value={fmt(stats.moyenne)} />
            <StatCard icon="🏆" label="Meilleure note" value={fmt(stats.max)} tone="green" />
            <StatCard icon="📉" label="Note la plus basse" value={fmt(stats.min)} tone="red" />
            <StatCard icon="🎯" label="Taux de réussite" value={stats.reussite === null ? "—" : `${stats.reussite} %`} hint={`${stats.absents} absent(s)`} tone="purple" />
          </StatGrid>

          <Toolbar>
            <SearchInput value={search} onChange={setSearch} placeholder="Filtrer les élèves..." />
          </Toolbar>

          <div className="mk-table-card">
            {notesLoading ? (
              <LoadingState text="Chargement des notes..." />
            ) : lignes.length === 0 ? (
              <EmptyState icon="🎓" title="Aucun élève inscrit" text="Aucune inscription ne correspond à la classe et à l'année de cette évaluation." />
            ) : (
              <div className="mk-table-wrap">
                <table className="mk-table notes-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Élève</th>
                      <th>Note / {bareme}</th>
                      <th>Absent</th>
                      <th>Appréciation</th>
                      <th>Observation</th>
                      <th>Rang</th>
                      <th className="align-right">État</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignesAffichees.map((l, index) => {
                      const m = l.current.absence ? null : mention(l.current.valeur, bareme);
                      const horsBareme = l.current.valeur !== "" && (Number(l.current.valeur) < 0 || Number(l.current.valeur) > bareme);
                      return (
                        <tr key={l.ins.id_inscription} className={l.dirty ? "row-highlight" : ""}>
                          <td className="mk-muted">{index + 1}</td>
                          <td>
                            <div className="mk-cell-main">
                              <Avatar text={l.nom} />
                              <div><strong>{l.nom}</strong><small>{l.eleve?.matricule}</small></div>
                            </div>
                          </td>
                          <td>
                            <input
                              type="number"
                              className={`notes-input ${horsBareme ? "invalid" : ""}`}
                              min={0}
                              max={bareme}
                              step="0.25"
                              value={l.current.absence ? "" : l.current.valeur ?? ""}
                              disabled={l.current.absence}
                              placeholder="—"
                              onChange={(e) => updateDraft(l, { valeur: e.target.value })}
                            />
                          </td>
                          <td>
                            <input type="checkbox" className="notes-check" checked={l.current.absence} onChange={(e) => updateDraft(l, { absence: e.target.checked, valeur: e.target.checked ? "" : l.current.valeur })} />
                          </td>
                          <td>{l.current.absence ? <Badge tone="orange">Absent</Badge> : m ? <Badge tone={m.tone}>{m.label}</Badge> : <span className="mk-muted">—</span>}</td>
                          <td>
                            <input type="text" className="notes-obs" value={l.current.observation} placeholder="Observation..." onChange={(e) => updateDraft(l, { observation: e.target.value })} />
                          </td>
                          <td className="mk-strong">{rangs.get(l.ins.id_inscription) ? `${rangs.get(l.ins.id_inscription)}ᵉ` : "—"}</td>
                          <td className="align-right">
                            <div className="notes-state">
                              {l.dirty ? <Badge tone="blue">Modifiée</Badge> : l.note ? <Badge tone="green">Enregistrée</Badge> : <Badge>Non saisie</Badge>}
                              {l.note && (
                                <button type="button" className="notes-delete" title="Supprimer la note" onClick={() => removeNote(l)}>🗑️</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {lignes.length > 0 && (
              <div className="mk-table-footer">
                <span>{dirtyCount ? `${dirtyCount} modification(s) non enregistrée(s)` : "Toutes les modifications sont enregistrées."}</span>
                <div style={{ display: "flex", gap: 8 }}>
                  {dirtyCount > 0 && <button type="button" className="mk-btn mk-btn-light mk-btn-sm" onClick={() => setDrafts({})}>Annuler les modifications</button>}
                  <button type="button" className="mk-btn mk-btn-primary mk-btn-sm" onClick={saveAll} disabled={!dirtyCount || saving}>💾 Enregistrer</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </ModulePage>
  );
}
