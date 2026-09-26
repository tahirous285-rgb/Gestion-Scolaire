import { useMemo, useState } from "react";
import {
  Alert, Avatar, Badge, DataTable, DetailGrid, FilterSelect, FormActions, FormFields, MenuItem, Modal,
  ModuleHeader, ModulePage, Progress, RefreshButton, SearchInput, StatCard, StatGrid, Toolbar, loadAll,
  useAsyncData, useFlash,
} from "../../components/module/ModuleKit";
import { userId } from "../../services/apiClient";
import { getAnnees } from "../../services/anneesApi";
import { createCoursEffectue, getCoursEffectues } from "../../services/cahierMaitreApi";
import { getClasses } from "../../services/classesApi";
import { getClassesOfEnseignant, getEnseignants, getMatieresOfEnseignant } from "../../services/enseignantsApi";
import { getMatieres } from "../../services/matieresApi";
import { formatDate, fullName, includesText, mapBy, sum, toNumberOrNull, todayISO } from "../pageUtils";

const STATUTS = [
  { value: "effectue", label: "Effectué", tone: "green" },
  { value: "partiel", label: "Partiel", tone: "orange" },
  { value: "reporte", label: "Reporté", tone: "blue" },
  { value: "annule", label: "Annulé", tone: "red" },
];
const statutInfo = (v) => STATUTS.find((s) => s.value === v) || { label: v || "—", tone: "neutral" };

const emptyForm = () => ({ id_annee: "", id_enseignant: "", id_classe: "", id_matiere: "", date_cours: todayISO(), heures_prevues: "", heures_effectuees: "", statut: "effectue", observation: "" });

export default function CoursEffectues() {
  const [search, setSearch] = useState("");
  const [enseignantFilter, setEnseignantFilter] = useState("");
  const [classeFilter, setClasseFilter] = useState("");
  const [statutFilter, setStatutFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [assignments, setAssignments] = useState({ matieres: null, classes: null });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [selected, setSelected] = useState(null);
  const [flash, showFlash, clearFlash] = useFlash();

  const { data, loading, error, setError, reload } = useAsyncData(() =>
    loadAll({ cours: () => getCoursEffectues(), enseignants: () => getEnseignants(), classes: getClasses, matieres: getMatieres, annees: getAnnees }),
  );
  const refs = data || { cours: [], enseignants: [], classes: [], matieres: [], annees: [] };
  const enseignantsMap = useMemo(() => mapBy(refs.enseignants, "id_enseignant"), [refs.enseignants]);
  const classesMap = useMemo(() => mapBy(refs.classes, "id_classe"), [refs.classes]);
  const matieresMap = useMemo(() => mapBy(refs.matieres, "id_matiere"), [refs.matieres]);
  const anneesMap = useMemo(() => mapBy(refs.annees, "id_annee"), [refs.annees]);

  const enriched = useMemo(
    () =>
      refs.cours.map((c) => ({
        ...c,
        enseignantNom: fullName(enseignantsMap.get(String(c.id_enseignant))) || `Enseignant #${c.id_enseignant}`,
        classeNom: classesMap.get(String(c.id_classe))?.nom || `Classe #${c.id_classe}`,
        matiereNom: matieresMap.get(String(c.id_matiere))?.nom || `Matière #${c.id_matiere}`,
      })),
    [refs.cours, enseignantsMap, classesMap, matieresMap],
  );

  const rows = useMemo(
    () =>
      enriched
        .filter((c) => !enseignantFilter || String(c.id_enseignant) === enseignantFilter)
        .filter((c) => !classeFilter || String(c.id_classe) === classeFilter)
        .filter((c) => !statutFilter || c.statut === statutFilter)
        .filter((c) => !from || String(c.date_cours) >= from)
        .filter((c) => !to || String(c.date_cours) <= to)
        .filter((c) => includesText([c.enseignantNom, c.classeNom, c.matiereNom, c.observation], search))
        .sort((a, b) => String(b.date_cours).localeCompare(String(a.date_cours))),
    [enriched, enseignantFilter, classeFilter, statutFilter, from, to, search],
  );

  const prevues = sum(rows, "heures_prevues");
  const effectuees = sum(rows, "heures_effectuees");
  const taux = prevues ? Math.round((effectuees / prevues) * 100) : null;

  // Synthèse par enseignant (sur la sélection)
  const parEnseignant = useMemo(() => {
    const map = new Map();
    rows.forEach((c) => {
      const cur = map.get(c.id_enseignant) || { nom: c.enseignantNom, prevues: 0, effectuees: 0, count: 0 };
      cur.prevues += Number(c.heures_prevues) || 0;
      cur.effectuees += Number(c.heures_effectuees) || 0;
      cur.count += 1;
      map.set(c.id_enseignant, cur);
    });
    return [...map.values()].sort((a, b) => b.effectuees - a.effectuees);
  }, [rows]);

  async function openCreate() {
    const annee = refs.annees.find((a) => a.statut === "en_cours" || a.statut === "active") || refs.annees[0];
    setForm({ ...emptyForm(), id_annee: annee ? String(annee.id_annee) : "" });
    setAssignments({ matieres: null, classes: null });
    setFormError("");
    setModal(true);
  }

  async function change(name, value) {
    setForm((f) => {
      const next = { ...f, [name]: value };
      if (name === "heures_prevues" && (f.heures_effectuees === "" || f.heures_effectuees === f.heures_prevues)) next.heures_effectuees = value;
      if (name === "statut" && value === "annule") next.heures_effectuees = "0";
      return next;
    });
    if (name === "id_enseignant") {
      if (!value) return setAssignments({ matieres: null, classes: null });
      // Suggère les matières et classes affectées à l'enseignant
      const [m, c] = await Promise.all([getMatieresOfEnseignant(value).catch(() => null), getClassesOfEnseignant(value).catch(() => null)]);
      setAssignments({ matieres: Array.isArray(m) && m.length ? m.map((x) => String(x.id_matiere)) : null, classes: Array.isArray(c) && c.length ? c.map((x) => String(x.id_classe)) : null });
    }
  }

  async function submit(event) {
    event.preventDefault();
    const hp = toNumberOrNull(form.heures_prevues);
    const he = toNumberOrNull(form.heures_effectuees);
    if (hp !== null && he !== null && he > hp && !window.confirm("Les heures effectuées dépassent les heures prévues. Continuer ?")) return;
    try {
      setSaving(true);
      setFormError("");
      await createCoursEffectue({
        id_annee: Number(form.id_annee),
        id_enseignant: Number(form.id_enseignant),
        id_classe: Number(form.id_classe),
        id_matiere: Number(form.id_matiere),
        date_cours: form.date_cours,
        heures_prevues: hp,
        heures_effectuees: he,
        statut: form.statut || "effectue",
        observation: form.observation || null,
        id_utilisateur: userId(),
      });
      setModal(false);
      showFlash("Cours enregistré dans le cahier.");
      await reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const sortAssigned = (list, key, assigned, label) =>
    list
      .map((x) => ({ value: x[key], label: `${assigned?.includes(String(x[key])) ? "★ " : ""}${label(x)}` }))
      .sort((a, b) => Number(b.label.startsWith("★")) - Number(a.label.startsWith("★")) || a.label.localeCompare(b.label));

  const fields = [
    { name: "id_enseignant", label: "Enseignant", type: "select", required: true, options: refs.enseignants.map((e) => ({ value: e.id_enseignant, label: fullName(e) })) },
    { name: "id_annee", label: "Année scolaire", type: "select", required: true, options: refs.annees.map((a) => ({ value: a.id_annee, label: a.libelle })) },
    { name: "id_classe", label: "Classe", type: "select", required: true, options: sortAssigned(refs.classes, "id_classe", assignments.classes, (c) => c.nom), help: assignments.classes ? "★ classes affectées à l'enseignant" : undefined },
    { name: "id_matiere", label: "Matière", type: "select", required: true, options: sortAssigned(refs.matieres, "id_matiere", assignments.matieres, (m) => m.nom), help: assignments.matieres ? "★ matières enseignées" : undefined },
    { name: "date_cours", label: "Date du cours", type: "date", required: true, max: todayISO() },
    { name: "statut", label: "Statut", type: "select", required: true, options: STATUTS.map((s) => ({ value: s.value, label: s.label })) },
    { name: "heures_prevues", label: "Heures prévues", type: "number", min: 0, step: "0.5" },
    { name: "heures_effectuees", label: "Heures effectuées", type: "number", min: 0, step: "0.5" },
    { name: "observation", label: "Contenu / observation", type: "textarea", full: true, rows: 3, placeholder: "Chapitre traité, remarques..." },
  ];

  return (
    <ModulePage>
      <ModuleHeader icon="📚" title="Cours effectués" subtitle="Cahier de textes : heures prévues et réellement effectuées par enseignant.">
        <button type="button" className="mk-btn mk-btn-primary" onClick={openCreate}>＋ Enregistrer un cours</button>
      </ModuleHeader>

      <Alert message={error} onClose={() => setError("")} />
      <Alert message={flash} onClose={clearFlash} kind="success" />

      <StatGrid>
        <StatCard icon="📚" label="Cours enregistrés" value={rows.length} hint={`${rows.filter((c) => c.statut === "annule").length} annulé(s)`} />
        <StatCard icon="🕒" label="Heures prévues" value={`${prevues} h`} tone="purple" />
        <StatCard icon="✅" label="Heures effectuées" value={`${effectuees} h`} tone="green" />
        <StatCard icon="📈" label="Taux de réalisation" value={taux === null ? "—" : `${taux} %`} tone={taux !== null && taux < 80 ? "orange" : "blue"} />
      </StatGrid>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Enseignant, classe, matière, contenu..." />
        <FilterSelect label="Enseignant" value={enseignantFilter} onChange={setEnseignantFilter} placeholder="Tous" options={refs.enseignants.map((e) => ({ value: String(e.id_enseignant), label: fullName(e) }))} />
        <FilterSelect label="Classe" value={classeFilter} onChange={setClasseFilter} placeholder="Toutes" options={refs.classes.map((c) => ({ value: String(c.id_classe), label: c.nom }))} />
        <FilterSelect label="Statut" value={statutFilter} onChange={setStatutFilter} placeholder="Tous" options={STATUTS.map((s) => ({ value: s.value, label: s.label }))} />
        <label className="mk-filter"><span>Du</span><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="mk-filter"><span>Au</span><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <RefreshButton onClick={reload} loading={loading} />
      </Toolbar>

      <div className="mk-two-cols">
        <DataTable
          loading={loading}
          rows={rows}
          rowKey="id_cours"
          emptyIcon="📚"
          emptyTitle="Aucun cours"
          emptyText="Enregistrez les séances réalisées pour alimenter le calcul des honoraires."
          onRowClick={setSelected}
          columns={[
            { key: "date", label: "Date", render: (c) => formatDate(c.date_cours) },
            { key: "enseignant", label: "Enseignant", render: (c) => (<div className="mk-cell-main"><Avatar text={c.enseignantNom} tone="purple" /><div><strong>{c.enseignantNom}</strong><small>{c.matiereNom}</small></div></div>) },
            { key: "classe", label: "Classe", render: (c) => <Badge tone="blue">{c.classeNom}</Badge> },
            { key: "heures", label: "Heures", render: (c) => `${c.heures_effectuees ?? "—"} / ${c.heures_prevues ?? "—"} h` },
            { key: "statut", label: "Statut", render: (c) => <Badge tone={statutInfo(c.statut).tone}>{statutInfo(c.statut).label}</Badge> },
          ]}
          actions={(c, close) => <MenuItem icon="👁️" onClick={() => { setSelected(c); close(); }}>Consulter</MenuItem>}
        />

        <div className="mk-card">
          <div className="mk-card-title"><div><h3>Heures par enseignant</h3><p>Sur la sélection affichée</p></div></div>
          {parEnseignant.length === 0 ? (
            <p className="mk-muted">Aucune donnée.</p>
          ) : (
            <div className="mk-bars">
              {parEnseignant.map((e) => (
                <div key={e.nom}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                    <strong>{e.nom}</strong>
                    <span className="mk-muted">{e.effectuees} / {e.prevues} h · {e.count} cours</span>
                  </div>
                  <Progress value={e.prevues ? (e.effectuees / e.prevues) * 100 : 0} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={modal} onClose={() => !saving && setModal(false)} title="Enregistrer un cours effectué">
        <form onSubmit={submit}>
          <Alert message={formError} onClose={() => setFormError("")} />
          <FormFields fields={fields} values={form} onChange={change} />
          <FormActions onCancel={() => setModal(false)} saving={saving} />
        </form>
      </Modal>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={`Cours du ${formatDate(selected?.date_cours)}`} width={620}>
        {selected && (
          <DetailGrid
            items={[
              { label: "Enseignant", value: selected.enseignantNom },
              { label: "Matière", value: selected.matiereNom },
              { label: "Classe", value: selected.classeNom },
              { label: "Année scolaire", value: anneesMap.get(String(selected.id_annee))?.libelle },
              { label: "Heures prévues", value: selected.heures_prevues },
              { label: "Heures effectuées", value: selected.heures_effectuees },
              { label: "Statut", value: statutInfo(selected.statut).label },
              { label: "Observation", value: selected.observation, full: true },
            ]}
          />
        )}
      </Modal>
    </ModulePage>
  );
}
