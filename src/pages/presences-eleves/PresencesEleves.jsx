import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Avatar, Badge, DataTable, EmptyState, FilterSelect, LoadingState, ModuleHeader, ModulePage,
  Progress, RefreshButton, SearchInput, StatCard, StatGrid, Tabs, Toolbar, loadAll, useAsyncData, useFlash,
} from "../../components/module/ModuleKit";
import { userId } from "../../services/apiClient";
import { getAnnees } from "../../services/anneesApi";
import { getClasses } from "../../services/classesApi";
import { getEleves } from "../../services/elevesApi";
import { getInscriptions } from "../../services/inscriptionsApi";
import { createPresenceEleve, getPresencesEleves, updatePresenceEleve } from "../../services/presencesElevesApi";
import { formatDate, fullName, includesText, mapBy, todayISO } from "../pageUtils";
import "./Presences-eleves.css";

const STATUTS = [
  { value: "PRESENT", label: "Présent", short: "P", icon: "✅", tone: "green" },
  { value: "ABSENT", label: "Absent", short: "A", icon: "❌", tone: "red" },
  { value: "RETARD", label: "Retard", short: "R", icon: "⏰", tone: "orange" },
  { value: "EXCUSE", label: "Excusé", short: "E", icon: "📄", tone: "blue" },
];
const statutInfo = (value) => STATUTS.find((s) => s.value === value) || { label: value || "—", tone: "neutral" };

export default function PresencesEleves() {
  const [tab, setTab] = useState("appel");
  const [classeId, setClasseId] = useState("");
  const [anneeId, setAnneeId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [search, setSearch] = useState("");
  const [presences, setPresences] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [presLoading, setPresLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [histStatut, setHistStatut] = useState("");
  const [flash, showFlash, clearFlash] = useFlash();

  const { data, loading, error, setError } = useAsyncData(() =>
    loadAll({ classes: getClasses, annees: getAnnees, inscriptions: () => getInscriptions(), eleves: () => getEleves({ limit: 1000 }) }),
  );
  const refs = data || { classes: [], annees: [], inscriptions: [], eleves: [] };
  const elevesMap = useMemo(() => mapBy(refs.eleves, "id_eleve"), [refs.eleves]);

  // Valeurs par défaut : première classe, année en cours
  useEffect(() => {
    if (loading) return;
    if (!classeId && refs.classes[0]) setClasseId(String(refs.classes[0].id_classe));
    if (!anneeId && refs.annees.length) {
      const active = refs.annees.find((a) => a.statut === "en_cours" || a.statut === "active") || refs.annees[refs.annees.length - 1];
      setAnneeId(String(active.id_annee));
    }
  }, [loading, refs.classes, refs.annees, classeId, anneeId]);

  const inscriptions = useMemo(
    () =>
      refs.inscriptions
        .filter((i) => String(i.id_classe) === classeId && (!anneeId || String(i.id_annee) === anneeId))
        .map((i) => ({ ...i, eleve: elevesMap.get(String(i.id_eleve)), nom: fullName(elevesMap.get(String(i.id_eleve))) || `Élève #${i.id_eleve}` }))
        .sort((a, b) => (a.eleve?.nom || "").localeCompare(b.eleve?.nom || "") || a.nom.localeCompare(b.nom)),
    [refs.inscriptions, classeId, anneeId, elevesMap],
  );

  const inscriptionIds = inscriptions.map((i) => i.id_inscription).join(",");

  const loadPresences = useCallback(async () => {
    const ids = inscriptionIds ? inscriptionIds.split(",") : [];
    if (!ids.length) {
      setPresences([]);
      return;
    }
    try {
      setPresLoading(true);
      const lists = await Promise.all(ids.map((id) => getPresencesEleves(id).catch(() => [])));
      setPresences(lists.flat());
      setDrafts({});
    } catch (err) {
      setError(err.message);
    } finally {
      setPresLoading(false);
    }
  }, [inscriptionIds, setError]);

  useEffect(() => {
    loadPresences();
  }, [loadPresences]);

  const presencesDuJour = useMemo(() => {
    const map = new Map();
    presences.filter((p) => String(p.date_presence).slice(0, 10) === date).forEach((p) => map.set(String(p.id_inscription), p));
    return map;
  }, [presences, date]);

  const lignes = inscriptions.map((ins) => {
    const existing = presencesDuJour.get(String(ins.id_inscription));
    const draft = drafts[ins.id_inscription];
    const current = draft || {
      statut: existing?.statut || "",
      heure_arrivee: existing?.heure_arrivee || "",
      motif: existing?.motif || "",
      justifiee: Boolean(existing?.justifiee),
    };
    return { ins, existing, current, dirty: Boolean(draft) };
  });

  const counts = STATUTS.reduce((acc, s) => ({ ...acc, [s.value]: lignes.filter((l) => l.current.statut === s.value).length }), {});
  const nonRenseignes = lignes.filter((l) => !l.current.statut).length;
  const dirtyCount = Object.keys(drafts).length;

  function setStatut(ligne, patch) {
    setDrafts((d) => ({ ...d, [ligne.ins.id_inscription]: { ...ligne.current, ...patch } }));
  }

  function tousPresents() {
    const next = { ...drafts };
    lignes.forEach((l) => {
      if (!l.current.statut) next[l.ins.id_inscription] = { ...l.current, statut: "PRESENT" };
    });
    setDrafts(next);
  }

  async function enregistrer() {
    const toSave = lignes.filter((l) => l.dirty && l.current.statut);
    if (!toSave.length) return;
    try {
      setSaving(true);
      setError("");
      const results = await Promise.allSettled(
        toSave.map((l) => {
          const payload = {
            statut: l.current.statut,
            heure_arrivee: l.current.statut === "RETARD" ? l.current.heure_arrivee || null : null,
            motif: l.current.statut === "PRESENT" ? null : l.current.motif || null,
            justifiee: l.current.statut === "EXCUSE" ? true : Boolean(l.current.justifiee),
          };
          if (l.existing) return updatePresenceEleve(l.existing.id_presence, payload);
          return createPresenceEleve({ ...payload, id_inscription: l.ins.id_inscription, date_presence: date, id_utilisateur: userId() });
        }),
      );
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length) setError(`${failed.length} présence(s) non enregistrée(s) : ${failed[0].reason?.message || ""}`);
      showFlash(`Appel du ${formatDate(date)} enregistré (${results.length - failed.length} élève(s)).`);
      await loadPresences();
    } finally {
      setSaving(false);
    }
  }

  // ---------- Historique ----------
  const historique = useMemo(() => {
    const insMap = mapBy(inscriptions, "id_inscription");
    return presences
      .map((p) => ({ ...p, ins: insMap.get(String(p.id_inscription)) }))
      .filter((p) => !histStatut || p.statut === histStatut)
      .filter((p) => includesText([p.ins?.nom, p.ins?.eleve?.matricule, p.motif], search))
      .sort((a, b) => String(b.date_presence).localeCompare(String(a.date_presence)));
  }, [presences, inscriptions, histStatut, search]);

  const recapEleves = useMemo(
    () =>
      inscriptions.map((ins) => {
        const list = presences.filter((p) => String(p.id_inscription) === String(ins.id_inscription));
        const c = STATUTS.reduce((acc, s) => ({ ...acc, [s.value]: list.filter((p) => p.statut === s.value).length }), {});
        const presentLike = c.PRESENT + c.RETARD;
        return { ins, total: list.length, ...c, taux: list.length ? (presentLike / list.length) * 100 : null };
      }),
    [inscriptions, presences],
  );

  const globalTaux = (() => {
    const total = presences.length;
    if (!total) return null;
    return Math.round((presences.filter((p) => p.statut === "PRESENT" || p.statut === "RETARD").length / total) * 100);
  })();

  const classeNom = refs.classes.find((c) => String(c.id_classe) === classeId)?.nom || "";

  return (
    <ModulePage>
      <ModuleHeader icon="✅" title="Présences des élèves" subtitle="Faites l'appel par classe et suivez l'assiduité de chaque élève.">
        {tab === "appel" && (
          <button type="button" className="mk-btn mk-btn-primary" onClick={enregistrer} disabled={!dirtyCount || saving}>
            💾 {saving ? "Enregistrement…" : `Enregistrer l'appel${dirtyCount ? ` (${dirtyCount})` : ""}`}
          </button>
        )}
      </ModuleHeader>

      <Alert message={error} onClose={() => setError("")} />
      <Alert message={flash} onClose={clearFlash} kind="success" />

      <Toolbar>
        <FilterSelect label="Classe" value={classeId} onChange={(v) => { if (!dirtyCount || window.confirm("Abandonner l'appel non enregistré ?")) setClasseId(v); }} placeholder="Choisir une classe" options={refs.classes.map((c) => ({ value: String(c.id_classe), label: c.nom }))} />
        <FilterSelect label="Année scolaire" value={anneeId} onChange={setAnneeId} placeholder="Toutes" options={refs.annees.map((a) => ({ value: String(a.id_annee), label: a.libelle }))} />
        {tab === "appel" && (
          <label className="mk-filter">
            <span>Date</span>
            <input type="date" value={date} max={todayISO()} onChange={(e) => { if (!dirtyCount || window.confirm("Abandonner l'appel non enregistré ?")) setDate(e.target.value); }} />
          </label>
        )}
        {tab === "historique" && (
          <>
            <FilterSelect label="Statut" value={histStatut} onChange={setHistStatut} placeholder="Tous" options={STATUTS.map((s) => ({ value: s.value, label: s.label }))} />
          </>
        )}
        <SearchInput value={search} onChange={setSearch} placeholder="Filtrer les élèves..." />
        <RefreshButton onClick={loadPresences} loading={presLoading} />
      </Toolbar>

      <Tabs value={tab} onChange={setTab} tabs={[{ value: "appel", label: "📋 Appel du jour" }, { value: "historique", label: "📈 Historique & assiduité" }]} />

      {loading ? (
        <div className="mk-table-card"><LoadingState /></div>
      ) : !classeId ? (
        <div className="mk-table-card"><EmptyState icon="🏫" title="Choisissez une classe" /></div>
      ) : tab === "appel" ? (
        <>
          <StatGrid columns={5}>
            {STATUTS.map((s) => (
              <StatCard key={s.value} icon={s.icon} label={`${s.label}s`} value={counts[s.value]} tone={s.tone} />
            ))}
            <StatCard icon="❔" label="Non renseignés" value={nonRenseignes} tone="purple" />
          </StatGrid>

          <div className="mk-table-card">
            {presLoading ? (
              <LoadingState text="Chargement de l'appel..." />
            ) : inscriptions.length === 0 ? (
              <EmptyState icon="🎓" title="Aucun élève inscrit" text="Aucune inscription dans cette classe pour l'année choisie." />
            ) : (
              <>
                <div className="pres-bar">
                  <strong>{classeNom} — {formatDate(date)}</strong>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" className="mk-btn mk-btn-light mk-btn-sm" onClick={tousPresents} disabled={!nonRenseignes}>✔ Marquer les autres présents</button>
                    {dirtyCount > 0 && <button type="button" className="mk-btn mk-btn-light mk-btn-sm" onClick={() => setDrafts({})}>Annuler</button>}
                  </div>
                </div>
                <div className="mk-table-wrap">
                  <table className="mk-table">
                    <thead>
                      <tr>
                        <th>Élève</th>
                        <th>Statut</th>
                        <th>Heure d'arrivée</th>
                        <th>Motif</th>
                        <th>Justifiée</th>
                        <th className="align-right">État</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lignes.filter((l) => includesText([l.ins.nom, l.ins.eleve?.matricule], search)).map((l) => (
                        <tr key={l.ins.id_inscription} className={l.dirty ? "row-highlight" : ""}>
                          <td>
                            <div className="mk-cell-main"><Avatar text={l.ins.nom} /><div><strong>{l.ins.nom}</strong><small>{l.ins.eleve?.matricule}</small></div></div>
                          </td>
                          <td>
                            <div className="pres-toggle">
                              {STATUTS.map((s) => (
                                <button key={s.value} type="button" title={s.label} className={`pres-btn tone-${s.tone} ${l.current.statut === s.value ? "active" : ""}`} onClick={() => setStatut(l, { statut: s.value })}>
                                  {s.short}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td>
                            <input type="time" className="pres-input" value={l.current.heure_arrivee} disabled={l.current.statut !== "RETARD"} onChange={(e) => setStatut(l, { heure_arrivee: e.target.value })} />
                          </td>
                          <td>
                            <input type="text" className="pres-input wide" placeholder={l.current.statut && l.current.statut !== "PRESENT" ? "Motif..." : ""} value={l.current.motif} disabled={!l.current.statut || l.current.statut === "PRESENT"} onChange={(e) => setStatut(l, { motif: e.target.value })} />
                          </td>
                          <td>
                            <input type="checkbox" className="pres-check" checked={l.current.statut === "EXCUSE" || l.current.justifiee} disabled={!l.current.statut || l.current.statut === "PRESENT" || l.current.statut === "EXCUSE"} onChange={(e) => setStatut(l, { justifiee: e.target.checked })} />
                          </td>
                          <td className="align-right">
                            {l.dirty ? <Badge tone="blue">Modifié</Badge> : l.existing ? <Badge tone="green">Enregistré</Badge> : <Badge>À faire</Badge>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        <>
          <StatGrid>
            <StatCard icon="📈" label="Taux de présence" value={globalTaux === null ? "—" : `${globalTaux} %`} hint="Présents + retards" tone="green" />
            <StatCard icon="🚫" label="Absences" value={presences.filter((p) => p.statut === "ABSENT").length} tone="red" />
            <StatCard icon="⏰" label="Retards" value={presences.filter((p) => p.statut === "RETARD").length} tone="orange" />
            <StatCard icon="📄" label="Absences justifiées" value={presences.filter((p) => p.justifiee).length} tone="blue" />
          </StatGrid>

          <div className="mk-two-cols">
            <DataTable
              loading={presLoading}
              rows={historique}
              rowKey="id_presence"
              emptyIcon="📅"
              emptyTitle="Aucune présence enregistrée"
              columns={[
                { key: "date", label: "Date", render: (p) => formatDate(p.date_presence) },
                { key: "eleve", label: "Élève", render: (p) => <strong>{p.ins?.nom}</strong> },
                { key: "statut", label: "Statut", render: (p) => <Badge tone={statutInfo(p.statut).tone}>{statutInfo(p.statut).label}</Badge> },
                { key: "heure", label: "Arrivée", render: (p) => p.heure_arrivee || "—" },
                { key: "motif", label: "Motif", render: (p) => p.motif || "—" },
                { key: "just", label: "Justifiée", render: (p) => (p.statut === "PRESENT" ? "—" : p.justifiee ? <Badge tone="green">Oui</Badge> : <Badge tone="red">Non</Badge>) },
              ]}
            />
            <div className="mk-card">
              <div className="mk-card-title"><div><h3>Assiduité par élève</h3><p>{classeNom}</p></div></div>
              {recapEleves.length === 0 ? (
                <p className="mk-muted">Aucun élève.</p>
              ) : (
                <div className="pres-recap">
                  {recapEleves
                    .filter((r) => includesText([r.ins.nom], search))
                    .sort((a, b) => (a.taux ?? 101) - (b.taux ?? 101))
                    .map((r) => (
                      <div key={r.ins.id_inscription} className="pres-recap-row">
                        <div className="pres-recap-name">
                          <strong>{r.ins.nom}</strong>
                          <small>{r.ABSENT} abs. · {r.RETARD} ret. · {r.EXCUSE} exc.</small>
                        </div>
                        <div style={{ width: 90 }}><Progress value={r.taux ?? 0} tone={r.taux === null ? "blue" : r.taux >= 90 ? "green" : r.taux >= 75 ? "orange" : "red"} /></div>
                        <span className="mk-strong" style={{ width: 44, textAlign: "right" }}>{r.taux === null ? "—" : `${Math.round(r.taux)}%`}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </ModulePage>
  );
}
