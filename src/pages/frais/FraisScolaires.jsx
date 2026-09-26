import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, Avatar, Badge, DataTable, DetailGrid, FilterSelect, FormActions, FormFields, MenuItem, Modal,
  ModuleHeader, ModulePage, Progress, RefreshButton, SearchInput, StatCard, StatGrid, Tabs, Toolbar,
  loadAll, useAsyncData, useFlash,
} from "../../components/module/ModuleKit";
import { establishmentId } from "../../services/apiClient";
import { getAnnees } from "../../services/anneesApi";
import { getClasses } from "../../services/classesApi";
import { getEleves } from "../../services/elevesApi";
import { createFrais, createTypeFrais, getFrais, getPaiements, getTypesFrais } from "../../services/financeApi";
import { getInscriptions } from "../../services/inscriptionsApi";
import { buildInscriptionIndex, formatDate, formatMoney, includesText, mapBy, sum, todayISO } from "../pageUtils";

const emptyFrais = { mode: "unique", id_annee: "", id_inscription: "", id_classe: "", id_type_frais: "", montant_du: "", date_echeance: "", obligatoire: true, description: "" };
const emptyType = { code: "", libelle: "", description: "", actif: true };

function statutFrais(du, paye, echeance) {
  if (paye >= du && du > 0) return { key: "solde", label: "Soldé", tone: "green" };
  const retard = echeance && String(echeance) < todayISO();
  if (paye > 0) return { key: "partiel", label: retard ? "Partiel · en retard" : "Partiel", tone: retard ? "red" : "orange" };
  return { key: "impaye", label: retard ? "Impayé · en retard" : "Impayé", tone: retard ? "red" : "yellow" };
}

export default function FraisScolaires() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("frais");
  const [search, setSearch] = useState("");
  const [classeFilter, setClasseFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statutFilter, setStatutFilter] = useState("");
  const [fraisModal, setFraisModal] = useState(false);
  const [typeModal, setTypeModal] = useState(false);
  const [fraisForm, setFraisForm] = useState(emptyFrais);
  const [typeForm, setTypeForm] = useState(emptyType);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [selected, setSelected] = useState(null);
  const [flash, showFlash, clearFlash] = useFlash();

  const { data, loading, error, setError, reload } = useAsyncData(() =>
    loadAll({
      frais: () => getFrais(),
      types: () => getTypesFrais(establishmentId()),
      paiements: () => getPaiements(),
      inscriptions: () => getInscriptions(),
      eleves: () => getEleves({ limit: 1000 }),
      classes: getClasses,
      annees: getAnnees,
    }),
  );
  const refs = data || { frais: [], types: [], paiements: [], inscriptions: [], eleves: [], classes: [], annees: [] };

  const inscriptionIndex = useMemo(
    () => buildInscriptionIndex(refs.inscriptions, refs.eleves, refs.classes, refs.annees),
    [refs.inscriptions, refs.eleves, refs.classes, refs.annees],
  );
  const typesMap = useMemo(() => mapBy(refs.types, "id_type_frais"), [refs.types]);
  const anneesMap = useMemo(() => mapBy(refs.annees, "id_annee"), [refs.annees]);

  const payeParFrais = useMemo(() => {
    const map = new Map();
    refs.paiements.forEach((p) => {
      if (p.id_frais && p.statut !== "annule") map.set(String(p.id_frais), (map.get(String(p.id_frais)) || 0) + Number(p.montant || 0));
    });
    return map;
  }, [refs.paiements]);

  const enriched = useMemo(
    () =>
      refs.frais.map((f) => {
        const paye = payeParFrais.get(String(f.id_frais)) || 0;
        const du = Number(f.montant_du) || 0;
        return {
          ...f,
          ins: inscriptionIndex.get(String(f.id_inscription)),
          type: typesMap.get(String(f.id_type_frais)),
          paye,
          reste: Math.max(du - paye, 0),
          pct: du ? (paye / du) * 100 : 0,
          statut: statutFrais(du, paye, f.date_echeance),
        };
      }),
    [refs.frais, payeParFrais, inscriptionIndex, typesMap],
  );

  const rows = useMemo(
    () =>
      enriched
        .filter((f) => !classeFilter || String(f.ins?.id_classe) === classeFilter)
        .filter((f) => !typeFilter || String(f.id_type_frais) === typeFilter)
        .filter((f) => !statutFilter || f.statut.key === statutFilter || (statutFilter === "retard" && f.statut.tone === "red"))
        .filter((f) => includesText([f.ins?.eleveNom, f.ins?.matricule, f.ins?.classeNom, f.type?.libelle, f.description], search))
        .sort((a, b) => (a.ins?.eleveNom || "").localeCompare(b.ins?.eleveNom || "")),
    [enriched, classeFilter, typeFilter, statutFilter, search],
  );

  const stats = {
    du: sum(enriched, "montant_du"),
    paye: sum(enriched, (f) => Math.min(f.paye, Number(f.montant_du) || 0)),
    reste: sum(enriched, "reste"),
    retard: enriched.filter((f) => f.statut.tone === "red").length,
  };

  const typeStats = useMemo(() => {
    const map = new Map();
    enriched.forEach((f) => {
      const key = String(f.id_type_frais);
      const current = map.get(key) || { count: 0, du: 0, paye: 0 };
      map.set(key, { count: current.count + 1, du: current.du + Number(f.montant_du || 0), paye: current.paye + Math.min(f.paye, Number(f.montant_du) || 0) });
    });
    return map;
  }, [enriched]);

  // Inscriptions ciblées pour l'affectation groupée
  const targetInscriptions = useMemo(() => {
    if (fraisForm.mode !== "classe" || !fraisForm.id_classe) return [];
    return refs.inscriptions.filter(
      (i) => String(i.id_classe) === String(fraisForm.id_classe) && (!fraisForm.id_annee || String(i.id_annee) === String(fraisForm.id_annee)),
    );
  }, [refs.inscriptions, fraisForm.mode, fraisForm.id_classe, fraisForm.id_annee]);

  const inscriptionOptions = useMemo(
    () =>
      [...inscriptionIndex.values()]
        .filter((i) => !fraisForm.id_annee || String(i.id_annee) === String(fraisForm.id_annee))
        .sort((a, b) => a.label.localeCompare(b.label))
        .map((i) => ({ value: i.id_inscription, label: i.label })),
    [inscriptionIndex, fraisForm.id_annee],
  );

  function openFrais(prefill = {}) {
    const anneeActive = refs.annees.find((a) => a.statut === "en_cours" || a.statut === "active") || refs.annees[0];
    setFraisForm({ ...emptyFrais, id_annee: anneeActive ? String(anneeActive.id_annee) : "", ...prefill });
    setFormError("");
    setFraisModal(true);
  }

  function changeFrais(name, value) {
    setFraisForm((f) => {
      const next = { ...f, [name]: value };
      if (name === "id_inscription" && value) {
        const ins = inscriptionIndex.get(String(value));
        if (ins) next.id_annee = String(ins.id_annee);
      }
      return next;
    });
  }

  async function submitFrais(event) {
    event.preventDefault();
    const montant = Number(fraisForm.montant_du);
    if (!(montant > 0)) return setFormError("Le montant dû doit être supérieur à zéro.");
    const base = {
      id_annee: Number(fraisForm.id_annee),
      id_type_frais: Number(fraisForm.id_type_frais),
      montant_du: montant,
      date_echeance: fraisForm.date_echeance || null,
      obligatoire: Boolean(fraisForm.obligatoire),
      description: fraisForm.description || null,
    };
    const cibles = fraisForm.mode === "classe" ? targetInscriptions.map((i) => i.id_inscription) : [Number(fraisForm.id_inscription)];
    if (!cibles.length) return setFormError("Aucune inscription ne correspond à cette classe pour l'année choisie.");
    try {
      setSaving(true);
      setFormError("");
      const results = await Promise.allSettled(cibles.map((id) => createFrais({ ...base, id_inscription: id })));
      const failed = results.filter((r) => r.status === "rejected");
      setFraisModal(false);
      if (failed.length) setError(`${failed.length} frais n'ont pas pu être créés : ${failed[0].reason?.message || ""}`);
      showFlash(`${results.length - failed.length} frais créé(s) avec succès.`);
      await reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function submitType(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setFormError("");
      await createTypeFrais({ ...typeForm, code: typeForm.code.trim().toUpperCase(), id_etablissement: establishmentId(), description: typeForm.description || null });
      setTypeModal(false);
      showFlash(`Type de frais « ${typeForm.libelle} » créé.`);
      await reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const typeOptions = refs.types.filter((t) => t.actif !== false).map((t) => ({ value: t.id_type_frais, label: `${t.libelle} (${t.code})` }));
  const fraisFields = [
    { name: "mode", label: "Affectation", type: "select", required: true, options: [{ value: "unique", label: "À un élève" }, { value: "classe", label: "À toute une classe" }] },
    { name: "id_annee", label: "Année scolaire", type: "select", required: true, options: refs.annees.map((a) => ({ value: a.id_annee, label: a.libelle })) },
    fraisForm.mode === "classe"
      ? { name: "id_classe", label: "Classe", type: "select", required: true, full: true, options: refs.classes.map((c) => ({ value: c.id_classe, label: c.nom })), help: fraisForm.id_classe ? `${targetInscriptions.length} élève(s) inscrit(s) recevront ce frais.` : undefined }
      : { name: "id_inscription", label: "Élève (inscription)", type: "select", required: true, full: true, options: inscriptionOptions },
    { name: "id_type_frais", label: "Type de frais", type: "select", required: true, options: typeOptions, placeholder: typeOptions.length ? "Sélectionner..." : "Créez d'abord un type de frais" },
    { name: "montant_du", label: "Montant dû (FCFA)", type: "number", required: true, min: 1, step: "1" },
    { name: "date_echeance", label: "Date d'échéance", type: "date" },
    { name: "obligatoire", label: "Obligatoire", type: "checkbox", checkLabel: "Frais obligatoire" },
    { name: "description", label: "Description", type: "textarea", full: true, rows: 2 },
  ];

  const typeFields = [
    { name: "code", label: "Code", required: true, placeholder: "ex. SCOL" },
    { name: "libelle", label: "Libellé", required: true, placeholder: "ex. Scolarité" },
    { name: "description", label: "Description", type: "textarea", full: true, rows: 2 },
    { name: "actif", label: "Actif", type: "checkbox", checkLabel: "Type de frais actif" },
  ];

  return (
    <ModulePage>
      <ModuleHeader icon="💵" title="Frais scolaires" subtitle="Frais dus par élève, suivi du recouvrement et types de frais.">
        <button type="button" className="mk-btn mk-btn-light" onClick={() => { setTypeForm(emptyType); setFormError(""); setTypeModal(true); }}>🏷️ Nouveau type</button>
        <button type="button" className="mk-btn mk-btn-primary" onClick={() => openFrais()}>＋ Nouveau frais</button>
      </ModuleHeader>

      <Alert message={error} onClose={() => setError("")} />
      <Alert message={flash} onClose={clearFlash} kind="success" />

      <StatGrid>
        <StatCard icon="📋" label="Total dû" value={formatMoney(stats.du)} hint={`${enriched.length} frais`} />
        <StatCard icon="✅" label="Recouvré" value={formatMoney(stats.paye)} hint={stats.du ? `${Math.round((stats.paye / stats.du) * 100)} % du total` : undefined} tone="green" />
        <StatCard icon="⏳" label="Reste à payer" value={formatMoney(stats.reste)} tone="orange" />
        <StatCard icon="🚨" label="Frais en retard" value={stats.retard} hint="Échéance dépassée" tone="red" />
      </StatGrid>

      <Tabs value={tab} onChange={setTab} tabs={[{ value: "frais", label: "Frais par élève", count: enriched.length }, { value: "types", label: "Types de frais", count: refs.types.length }]} />

      {tab === "frais" ? (
        <>
          <Toolbar>
            <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un élève, un matricule, un type..." />
            <FilterSelect label="Classe" value={classeFilter} onChange={setClasseFilter} placeholder="Toutes" options={refs.classes.map((c) => ({ value: String(c.id_classe), label: c.nom }))} />
            <FilterSelect label="Type" value={typeFilter} onChange={setTypeFilter} placeholder="Tous" options={refs.types.map((t) => ({ value: String(t.id_type_frais), label: t.libelle }))} />
            <FilterSelect label="Statut" value={statutFilter} onChange={setStatutFilter} placeholder="Tous" options={[{ value: "solde", label: "Soldés" }, { value: "partiel", label: "Partiels" }, { value: "impaye", label: "Impayés" }, { value: "retard", label: "En retard" }]} />
            <RefreshButton onClick={reload} loading={loading} />
          </Toolbar>
          <DataTable
            loading={loading}
            rows={rows}
            rowKey="id_frais"
            emptyIcon="💵"
            emptyTitle="Aucun frais"
            emptyText="Créez un frais pour un élève ou affectez-le à toute une classe."
            onRowClick={setSelected}
            columns={[
              { key: "eleve", label: "Élève", render: (f) => (<div className="mk-cell-main"><Avatar text={f.ins?.eleveNom} /><div><strong>{f.ins?.eleveNom || `Inscription #${f.id_inscription}`}</strong><small>{[f.ins?.classeNom, f.ins?.matricule].filter(Boolean).join(" · ")}</small></div></div>) },
              { key: "type", label: "Type", render: (f) => (<div><strong>{f.type?.libelle || `Type #${f.id_type_frais}`}</strong>{!f.obligatoire && <div className="mk-muted" style={{ fontSize: 12 }}>Facultatif</div>}</div>) },
              { key: "du", label: "Montant dû", align: "right", render: (f) => <span className="mk-money">{formatMoney(f.montant_du)}</span> },
              { key: "paye", label: "Payé", render: (f) => (<div style={{ minWidth: 130 }}><div className="mk-money positive" style={{ fontSize: 13 }}>{formatMoney(f.paye)}</div><Progress value={f.pct} /></div>) },
              { key: "reste", label: "Reste", align: "right", render: (f) => <span className={`mk-money ${f.reste > 0 ? "negative" : ""}`}>{formatMoney(f.reste)}</span> },
              { key: "echeance", label: "Échéance", render: (f) => formatDate(f.date_echeance) },
              { key: "statut", label: "Statut", render: (f) => <Badge tone={f.statut.tone}>{f.statut.label}</Badge> },
            ]}
            actions={(f, close) => (
              <>
                <MenuItem icon="👁️" onClick={() => { setSelected(f); close(); }}>Consulter</MenuItem>
                <MenuItem icon="💳" disabled={f.reste <= 0} onClick={() => navigate("/paiements")}>Encaisser un paiement</MenuItem>
                <MenuItem icon="➕" onClick={() => { close(); openFrais({ id_inscription: String(f.id_inscription), id_annee: String(f.id_annee) }); }}>Autre frais pour cet élève</MenuItem>
              </>
            )}
            footer={<><span>{rows.length} frais affiché(s)</span><strong>Dû : {formatMoney(sum(rows, "montant_du"))} · Reste : {formatMoney(sum(rows, "reste"))}</strong></>}
          />
        </>
      ) : (
        <DataTable
          loading={loading}
          rows={refs.types}
          rowKey="id_type_frais"
          emptyIcon="🏷️"
          emptyTitle="Aucun type de frais"
          emptyText="Créez les types de frais (inscription, scolarité, tenue…) avant d'affecter des frais."
          columns={[
            { key: "code", label: "Code", render: (t) => <span className="mk-id">{t.code}</span> },
            { key: "libelle", label: "Libellé", render: (t) => (<div><strong>{t.libelle}</strong>{t.description && <div className="mk-muted" style={{ fontSize: 12 }}>{t.description}</div>}</div>) },
            { key: "count", label: "Frais affectés", align: "center", render: (t) => typeStats.get(String(t.id_type_frais))?.count || 0 },
            { key: "du", label: "Total dû", align: "right", render: (t) => <span className="mk-money">{formatMoney(typeStats.get(String(t.id_type_frais))?.du || 0)}</span> },
            { key: "paye", label: "Recouvré", render: (t) => { const s = typeStats.get(String(t.id_type_frais)); return <div style={{ minWidth: 120 }}><Progress value={s?.du ? (s.paye / s.du) * 100 : 0} /><small className="mk-muted">{s?.du ? Math.round((s.paye / s.du) * 100) : 0} %</small></div>; } },
            { key: "actif", label: "Statut", render: (t) => <Badge tone={t.actif !== false ? "green" : "red"}>{t.actif !== false ? "Actif" : "Inactif"}</Badge> },
          ]}
        />
      )}

      <Modal open={fraisModal} onClose={() => !saving && setFraisModal(false)} title="Nouveau frais scolaire" subtitle="Affectez un frais à un élève ou à tous les élèves d'une classe.">
        <form onSubmit={submitFrais}>
          <Alert message={formError} onClose={() => setFormError("")} />
          <FormFields fields={fraisFields} values={fraisForm} onChange={changeFrais} />
          <FormActions onCancel={() => setFraisModal(false)} saving={saving} submitLabel={fraisForm.mode === "classe" ? `Créer ${targetInscriptions.length} frais` : "Créer le frais"} />
        </form>
      </Modal>

      <Modal open={typeModal} onClose={() => !saving && setTypeModal(false)} title="Nouveau type de frais" width={560}>
        <form onSubmit={submitType}>
          <Alert message={formError} onClose={() => setFormError("")} />
          <FormFields fields={typeFields} values={typeForm} onChange={(n, v) => setTypeForm((f) => ({ ...f, [n]: v }))} />
          <FormActions onCancel={() => setTypeModal(false)} saving={saving} />
        </form>
      </Modal>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={`${selected?.type?.libelle || "Frais"} — ${selected?.ins?.eleveNom || ""}`} width={640}>
        {selected && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Progress value={selected.pct} />
              <p className="mk-muted" style={{ margin: "6px 0 0", fontSize: 13 }}>{Math.round(selected.pct)} % payé</p>
            </div>
            <DetailGrid
              items={[
                { label: "Élève", value: selected.ins?.eleveNom },
                { label: "Classe", value: selected.ins?.classeNom },
                { label: "Année scolaire", value: anneesMap.get(String(selected.id_annee))?.libelle },
                { label: "Type", value: selected.type?.libelle },
                { label: "Montant dû", value: formatMoney(selected.montant_du) },
                { label: "Montant payé", value: formatMoney(selected.paye) },
                { label: "Reste à payer", value: formatMoney(selected.reste) },
                { label: "Échéance", value: formatDate(selected.date_echeance) },
                { label: "Obligatoire", value: selected.obligatoire ? "Oui" : "Non" },
                { label: "Statut", value: selected.statut.label },
                { label: "Description", value: selected.description, full: true },
              ]}
            />
          </>
        )}
      </Modal>
    </ModulePage>
  );
}
