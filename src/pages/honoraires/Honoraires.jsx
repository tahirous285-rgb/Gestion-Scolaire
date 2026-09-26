import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, Avatar, Badge, DataTable, DetailGrid, FilterSelect, FormActions, FormFields, MenuItem, Modal,
  ModuleHeader, ModulePage, Progress, RefreshButton, SearchInput, StatCard, StatGrid, Toolbar, loadAll,
  useAsyncData, useFlash,
} from "../../components/module/ModuleKit";
import { userId } from "../../services/apiClient";
import { getAnnees } from "../../services/anneesApi";
import { getEnseignants } from "../../services/enseignantsApi";
import { createHonoraire, createMois, createPaiementHonoraire, getHonoraires, getMois, updateHonoraire } from "../../services/honorairesApi";
import {
  MODES_PAIEMENT, formatDateTime, formatMoney, fullName, generateReference, includesText, mapBy,
  honoraireStatut, nowLocalInput, sum, toNumberOrNull,
} from "../pageUtils";

const MOIS_SCOLAIRES = [
  [10, "Octobre"], [11, "Novembre"], [12, "Décembre"], [1, "Janvier"], [2, "Février"], [3, "Mars"],
  [4, "Avril"], [5, "Mai"], [6, "Juin"], [7, "Juillet"], [8, "Août"], [9, "Septembre"],
];


const emptyCreate = { id_enseignant: "", id_annee: "", id_mois: "", heures_prevues: "", heures_effectuees: "", taux_horaire: "", retenues: "0" };

export default function Honoraires() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [enseignantFilter, setEnseignantFilter] = useState("");
  const [moisFilter, setMoisFilter] = useState("");
  const [statutFilter, setStatutFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [paying, setPaying] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyCreate);
  const [editForm, setEditForm] = useState({});
  const [payForm, setPayForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [flash, showFlash, clearFlash] = useFlash();

  const { data, loading, error, setError, reload } = useAsyncData(() =>
    loadAll({ honoraires: () => getHonoraires(), enseignants: () => getEnseignants(), annees: getAnnees, mois: getMois }),
  );
  const refs = data || { honoraires: [], enseignants: [], annees: [], mois: [] };
  const enseignantsMap = useMemo(() => mapBy(refs.enseignants, "id_enseignant"), [refs.enseignants]);
  const moisMap = useMemo(() => mapBy(refs.mois, "id_mois"), [refs.mois]);
  const anneesMap = useMemo(() => mapBy(refs.annees, "id_annee"), [refs.annees]);
  const moisOrdonnes = useMemo(() => {
    const order = new Map(MOIS_SCOLAIRES.map(([n], i) => [n, i]));
    return [...refs.mois].sort((a, b) => (order.get(a.numero) ?? a.numero) - (order.get(b.numero) ?? b.numero));
  }, [refs.mois]);

  const enriched = useMemo(
    () =>
      refs.honoraires.map((h) => ({
        ...h,
        enseignant: enseignantsMap.get(String(h.id_enseignant)),
        enseignantNom: fullName(enseignantsMap.get(String(h.id_enseignant))) || `Enseignant #${h.id_enseignant}`,
        moisLibelle: moisMap.get(String(h.id_mois))?.libelle || `Mois #${h.id_mois}`,
        anneeLibelle: anneesMap.get(String(h.id_annee))?.libelle || "",
        etat: honoraireStatut(h),
      })),
    [refs.honoraires, enseignantsMap, moisMap, anneesMap],
  );

  const rows = useMemo(
    () =>
      enriched
        .filter((h) => !enseignantFilter || String(h.id_enseignant) === enseignantFilter)
        .filter((h) => !moisFilter || String(h.id_mois) === moisFilter)
        .filter((h) => !statutFilter || h.etat.key === statutFilter)
        .filter((h) => includesText([h.enseignantNom, h.enseignant?.matricule, h.moisLibelle, h.anneeLibelle], search))
        .sort((a, b) => b.id_honoraire - a.id_honoraire),
    [enriched, enseignantFilter, moisFilter, statutFilter, search],
  );

  const stats = {
    brut: sum(enriched, "montant_brut"),
    net: sum(enriched, "montant_net"),
    paye: sum(enriched, "montant_paye"),
    solde: sum(enriched, "solde"),
    aValider: enriched.filter((h) => h.etat.key === "calcule").length,
  };

  const previewBrut = (toNumberOrNull(form.heures_effectuees) || 0) * (toNumberOrNull(form.taux_horaire) || 0);
  const previewNet = previewBrut - (toNumberOrNull(form.retenues) || 0);

  async function initialiserMois() {
    try {
      setSaving(true);
      const existants = new Set(refs.mois.map((m) => m.numero));
      const manquants = MOIS_SCOLAIRES.filter(([n]) => !existants.has(n));
      await Promise.all(manquants.map(([numero, libelle]) => createMois({ numero, libelle })));
      showFlash(`${manquants.length} mois créé(s).`);
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function openCreate(prefill = {}) {
    const annee = refs.annees.find((a) => a.statut === "en_cours" || a.statut === "active") || refs.annees[0];
    setForm({ ...emptyCreate, id_annee: annee ? String(annee.id_annee) : "", ...prefill });
    setFormError("");
    setCreateOpen(true);
  }

  async function submitCreate(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setFormError("");
      await createHonoraire({
        id_enseignant: Number(form.id_enseignant),
        id_annee: Number(form.id_annee),
        id_mois: Number(form.id_mois),
        heures_prevues: toNumberOrNull(form.heures_prevues),
        heures_effectuees: toNumberOrNull(form.heures_effectuees),
        taux_horaire: Number(form.taux_horaire),
        retenues: toNumberOrNull(form.retenues) || 0,
      });
      setCreateOpen(false);
      showFlash("Honoraire calculé et enregistré.");
      await reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function openEdit(h) {
    setEditing(h);
    setEditForm({ heures_effectuees: h.heures_effectuees ?? "", retenues: h.retenues ?? 0, statut: h.statut || "calcule", observation: h.observation || "" });
    setFormError("");
  }

  async function submitEdit(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setFormError("");
      const payload = {
        heures_effectuees: toNumberOrNull(editForm.heures_effectuees),
        retenues: toNumberOrNull(editForm.retenues) || 0,
        statut: editForm.statut,
        observation: editForm.observation || null,
      };
      if (editForm.statut === "valide" && editing.statut !== "valide") payload.id_validateur = userId();
      await updateHonoraire(editing.id_honoraire, payload);
      setEditing(null);
      showFlash("Honoraire mis à jour — montants recalculés.");
      await reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function valider(h) {
    try {
      await updateHonoraire(h.id_honoraire, { statut: "valide", id_validateur: userId() });
      showFlash(`Honoraire de ${h.enseignantNom} (${h.moisLibelle}) validé.`);
      await reload();
    } catch (err) {
      setError(err.message);
    }
  }

  function openPay(h) {
    setPaying(h);
    setPayForm({ montant: String(h.solde || ""), reference: generateReference("HON"), date_paiement: nowLocalInput(), mode_paiement: "Espèces", commentaire: "" });
    setFormError("");
  }

  async function submitPay(event) {
    event.preventDefault();
    const montant = Number(payForm.montant);
    if (!(montant > 0)) return setFormError("Le montant doit être supérieur à zéro.");
    if (montant > Number(paying.solde)) return setFormError(`Le montant dépasse le solde restant (${formatMoney(paying.solde)}).`);
    try {
      setSaving(true);
      setFormError("");
      await createPaiementHonoraire({
        id_honoraire: paying.id_honoraire,
        reference: payForm.reference,
        date_paiement: payForm.date_paiement,
        montant,
        mode_paiement: payForm.mode_paiement || null,
        commentaire: payForm.commentaire || null,
        id_utilisateur: userId(),
      });
      setPaying(null);
      showFlash(`Paiement de ${formatMoney(montant)} enregistré pour ${paying.enseignantNom}.`);
      await reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const createFields = [
    { name: "id_enseignant", label: "Enseignant", type: "select", required: true, full: true, options: refs.enseignants.map((e) => ({ value: e.id_enseignant, label: `${fullName(e)}${e.matricule ? ` · ${e.matricule}` : ""}` })) },
    { name: "id_annee", label: "Année scolaire", type: "select", required: true, options: refs.annees.map((a) => ({ value: a.id_annee, label: a.libelle })) },
    { name: "id_mois", label: "Mois", type: "select", required: true, options: moisOrdonnes.map((m) => ({ value: m.id_mois, label: m.libelle })), placeholder: refs.mois.length ? "Sélectionner..." : "Initialisez d'abord les mois" },
    { name: "heures_prevues", label: "Heures prévues", type: "number", min: 0, step: "0.5" },
    { name: "heures_effectuees", label: "Heures effectuées", type: "number", min: 0, step: "0.5" },
    { name: "taux_horaire", label: "Taux horaire (FCFA)", type: "number", required: true, min: 0, step: "1" },
    { name: "retenues", label: "Retenues (FCFA)", type: "number", min: 0, step: "1" },
  ];

  return (
    <ModulePage>
      <ModuleHeader icon="💰" title="Honoraires des enseignants" subtitle="Calcul mensuel (heures × taux − retenues), validation et paiement.">
        {refs.mois.length < 12 && !loading && (
          <button type="button" className="mk-btn mk-btn-light" onClick={initialiserMois} disabled={saving}>📆 Initialiser les mois</button>
        )}
        <button type="button" className="mk-btn mk-btn-light" onClick={() => navigate("/paiements-honoraires")}>💸 Paiements</button>
        <button type="button" className="mk-btn mk-btn-primary" onClick={() => openCreate()}>＋ Calculer un honoraire</button>
      </ModuleHeader>

      <Alert message={error} onClose={() => setError("")} />
      <Alert message={flash} onClose={clearFlash} kind="success" />

      <StatGrid>
        <StatCard icon="🧮" label="Montant net total" value={formatMoney(stats.net)} hint={`Brut ${formatMoney(stats.brut)}`} />
        <StatCard icon="✅" label="Déjà payé" value={formatMoney(stats.paye)} tone="green" />
        <StatCard icon="⏳" label="Solde à payer" value={formatMoney(stats.solde)} tone="orange" />
        <StatCard icon="📝" label="À valider" value={stats.aValider} hint="Honoraires calculés" tone="purple" />
      </StatGrid>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un enseignant, un mois..." />
        <FilterSelect label="Enseignant" value={enseignantFilter} onChange={setEnseignantFilter} placeholder="Tous" options={refs.enseignants.map((e) => ({ value: String(e.id_enseignant), label: fullName(e) }))} />
        <FilterSelect label="Mois" value={moisFilter} onChange={setMoisFilter} placeholder="Tous" options={moisOrdonnes.map((m) => ({ value: String(m.id_mois), label: m.libelle }))} />
        <FilterSelect label="Statut" value={statutFilter} onChange={setStatutFilter} placeholder="Tous" options={[{ value: "calcule", label: "Calculés" }, { value: "valide", label: "Validés" }, { value: "partiel", label: "Partiellement payés" }, { value: "paye", label: "Payés" }, { value: "rejete", label: "Rejetés" }]} />
        <RefreshButton onClick={reload} loading={loading} />
      </Toolbar>

      <DataTable
        loading={loading}
        rows={rows}
        rowKey="id_honoraire"
        emptyIcon="💰"
        emptyTitle="Aucun honoraire"
        emptyText="Calculez les honoraires mensuels des enseignants."
        onRowClick={setSelected}
        columns={[
          { key: "enseignant", label: "Enseignant", render: (h) => (<div className="mk-cell-main"><Avatar text={h.enseignantNom} tone="purple" /><div><strong>{h.enseignantNom}</strong><small>{h.enseignant?.matricule}</small></div></div>) },
          { key: "periode", label: "Période", render: (h) => (<div><strong>{h.moisLibelle}</strong><div className="mk-muted" style={{ fontSize: 12 }}>{h.anneeLibelle}</div></div>) },
          { key: "heures", label: "Heures", render: (h) => `${h.heures_effectuees ?? 0} h${h.heures_prevues ? ` / ${h.heures_prevues} h` : ""}` },
          { key: "taux", label: "Taux", align: "right", render: (h) => <span className="mk-money">{formatMoney(h.taux_horaire)}</span> },
          { key: "net", label: "Net", align: "right", render: (h) => (<div><span className="mk-money">{formatMoney(h.montant_net)}</span>{Number(h.retenues) > 0 && <div className="mk-muted" style={{ fontSize: 11.5 }}>− {formatMoney(h.retenues)} retenues</div>}</div>) },
          { key: "paye", label: "Payé", render: (h) => (<div style={{ minWidth: 120 }}><div style={{ fontSize: 12.5 }} className="mk-money positive">{formatMoney(h.montant_paye)}</div><Progress value={Number(h.montant_net) ? (Number(h.montant_paye) / Number(h.montant_net)) * 100 : 0} /></div>) },
          { key: "solde", label: "Solde", align: "right", render: (h) => <span className={`mk-money ${Number(h.solde) > 0 ? "negative" : ""}`}>{formatMoney(h.solde)}</span> },
          { key: "statut", label: "Statut", render: (h) => <Badge tone={h.etat.tone}>{h.etat.label}</Badge> },
        ]}
        actions={(h, close) => (
          <>
            <MenuItem icon="👁️" onClick={() => { setSelected(h); close(); }}>Consulter</MenuItem>
            <MenuItem icon="✏️" onClick={() => { close(); openEdit(h); }}>Modifier / recalculer</MenuItem>
            <MenuItem icon="✅" disabled={h.statut === "valide"} onClick={() => { close(); valider(h); }}>Valider</MenuItem>
            <MenuItem icon="💸" disabled={Number(h.solde) <= 0} onClick={() => { close(); openPay(h); }}>Payer</MenuItem>
            <MenuItem icon="📜" onClick={() => navigate(`/paiements-honoraires?honoraire=${h.id_honoraire}`)}>Historique des paiements</MenuItem>
          </>
        )}
        footer={<><span>{rows.length} honoraire(s)</span><strong>Net : {formatMoney(sum(rows, "montant_net"))} · Solde : {formatMoney(sum(rows, "solde"))}</strong></>}
      />

      <Modal open={createOpen} onClose={() => !saving && setCreateOpen(false)} title="Calculer un honoraire" subtitle="Un seul honoraire par enseignant, par année et par mois.">
        <form onSubmit={submitCreate}>
          <Alert message={formError} onClose={() => setFormError("")} />
          <FormFields fields={createFields} values={form} onChange={(n, v) => setForm((f) => ({ ...f, [n]: v }))} />
          <div className="mk-hint-box" style={{ marginTop: 16 }}>
            <span>Brut estimé : <strong>{formatMoney(previewBrut)}</strong></span>
            <span>Net estimé : <strong>{formatMoney(previewNet)}</strong></span>
            <span className="mk-muted">Le calcul définitif est effectué par le serveur.</span>
          </div>
          <FormActions onCancel={() => setCreateOpen(false)} saving={saving} submitLabel="Calculer et enregistrer" />
        </form>
      </Modal>

      <Modal open={Boolean(editing)} onClose={() => !saving && setEditing(null)} title={`Modifier — ${editing?.enseignantNom || ""} (${editing?.moisLibelle || ""})`} width={620}>
        {editing && (
          <form onSubmit={submitEdit}>
            <Alert message={formError} onClose={() => setFormError("")} />
            <FormFields
              values={editForm}
              onChange={(n, v) => setEditForm((f) => ({ ...f, [n]: v }))}
              fields={[
                { name: "heures_effectuees", label: "Heures effectuées", type: "number", min: 0, step: "0.5" },
                { name: "retenues", label: "Retenues (FCFA)", type: "number", min: 0, step: "1" },
                { name: "statut", label: "Statut", type: "select", required: true, options: [{ value: "calcule", label: "Calculé" }, { value: "valide", label: "Validé" }, { value: "rejete", label: "Rejeté" }] },
                { name: "observation", label: "Observation", type: "textarea", full: true, rows: 3 },
              ]}
            />
            <div className="mk-hint-box" style={{ marginTop: 16 }}>
              <span>Taux : <strong>{formatMoney(editing.taux_horaire)}</strong></span>
              <span>Nouveau net estimé : <strong>{formatMoney((toNumberOrNull(editForm.heures_effectuees) || 0) * editing.taux_horaire - (toNumberOrNull(editForm.retenues) || 0))}</strong></span>
              <span>Déjà payé : <strong>{formatMoney(editing.montant_paye)}</strong></span>
            </div>
            <FormActions onCancel={() => setEditing(null)} saving={saving} />
          </form>
        )}
      </Modal>

      <Modal open={Boolean(paying)} onClose={() => !saving && setPaying(null)} title={`Payer — ${paying?.enseignantNom || ""}`} subtitle={paying ? `${paying.moisLibelle} ${paying.anneeLibelle} · solde restant ${formatMoney(paying.solde)}` : ""} width={620}>
        {paying && (
          <form onSubmit={submitPay}>
            <Alert message={formError} onClose={() => setFormError("")} />
            <FormFields
              values={payForm}
              onChange={(n, v) => setPayForm((f) => ({ ...f, [n]: v }))}
              fields={[
                { name: "montant", label: "Montant (FCFA)", type: "number", required: true, min: 1, max: paying.solde, step: "1", help: `Maximum : ${formatMoney(paying.solde)}` },
                { name: "mode_paiement", label: "Mode de paiement", type: "select", options: MODES_PAIEMENT.map((m) => ({ value: m, label: m })) },
                { name: "reference", label: "Référence", required: true },
                { name: "date_paiement", label: "Date et heure", type: "datetime-local", required: true },
                { name: "commentaire", label: "Commentaire", type: "textarea", full: true, rows: 2 },
              ]}
            />
            <FormActions onCancel={() => setPaying(null)} saving={saving} submitLabel="Enregistrer le paiement" />
          </form>
        )}
      </Modal>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={`Honoraire — ${selected?.enseignantNom || ""}`} width={660}
        footer={selected && (
          <>
            <button type="button" className="mk-btn mk-btn-light" onClick={() => navigate(`/paiements-honoraires?honoraire=${selected.id_honoraire}`)}>📜 Paiements</button>
            {Number(selected.solde) > 0 && <button type="button" className="mk-btn mk-btn-primary" onClick={() => { const h = selected; setSelected(null); openPay(h); }}>💸 Payer</button>}
          </>
        )}>
        {selected && (
          <DetailGrid
            items={[
              { label: "Enseignant", value: selected.enseignantNom },
              { label: "Période", value: `${selected.moisLibelle} ${selected.anneeLibelle}` },
              { label: "Heures prévues", value: selected.heures_prevues },
              { label: "Heures effectuées", value: selected.heures_effectuees },
              { label: "Taux horaire", value: formatMoney(selected.taux_horaire) },
              { label: "Montant brut", value: formatMoney(selected.montant_brut) },
              { label: "Retenues", value: formatMoney(selected.retenues) },
              { label: "Montant net", value: formatMoney(selected.montant_net) },
              { label: "Montant payé", value: formatMoney(selected.montant_paye) },
              { label: "Solde", value: formatMoney(selected.solde) },
              { label: "Statut", value: selected.etat.label },
              { label: "Calculé le", value: formatDateTime(selected.date_calcul) },
              { label: "Validé le", value: formatDateTime(selected.date_validation) },
              { label: "Observation", value: selected.observation, full: true },
            ]}
          />
        )}
      </Modal>
    </ModulePage>
  );
}
