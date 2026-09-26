import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert, Avatar, Badge, DataTable, DetailGrid, FilterSelect, FormActions, FormFields, MenuItem, Modal,
  ModuleHeader, ModulePage, Progress, RefreshButton, SearchInput, StatCard, StatGrid, Toolbar, loadAll,
  useAsyncData, useFlash,
} from "../../components/module/ModuleKit";
import { userId } from "../../services/apiClient";
import { getAnnees } from "../../services/anneesApi";
import { getEnseignants } from "../../services/enseignantsApi";
import { createPaiementHonoraire, getHonoraires, getMois, getPaiementsHonoraire } from "../../services/honorairesApi";
import {
  MODES_PAIEMENT, formatDateTime, formatMoney, fullName, generateReference, honoraireStatut, includesText,
  mapBy, monthKey, nowLocalInput, sum, todayISO,
} from "../pageUtils";

/**
 * Le backend expose les paiements par honoraire (GET /honoraires/{id}/paiements).
 * L'historique global est reconstitué à partir de la liste des honoraires.
 */
async function loadData() {
  const refs = await loadAll({ honoraires: () => getHonoraires(), enseignants: () => getEnseignants(), annees: getAnnees, mois: getMois });
  const lists = await Promise.all(
    refs.honoraires.map(async (h) => {
      try {
        return await getPaiementsHonoraire(h.id_honoraire);
      } catch {
        return [];
      }
    }),
  );
  return { ...refs, paiements: lists.flat() };
}

export default function PaiementsHonoraires() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const honoraireFilter = params.get("honoraire") || "";
  const [search, setSearch] = useState("");
  const [enseignantFilter, setEnseignantFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [selected, setSelected] = useState(null);
  const [flash, showFlash, clearFlash] = useFlash();

  const { data, loading, error, setError, reload } = useAsyncData(loadData);
  const refs = data || { honoraires: [], enseignants: [], annees: [], mois: [], paiements: [] };

  const enseignantsMap = useMemo(() => mapBy(refs.enseignants, "id_enseignant"), [refs.enseignants]);
  const moisMap = useMemo(() => mapBy(refs.mois, "id_mois"), [refs.mois]);
  const anneesMap = useMemo(() => mapBy(refs.annees, "id_annee"), [refs.annees]);

  const honorairesIndex = useMemo(() => {
    const map = new Map();
    refs.honoraires.forEach((h) => {
      const enseignant = enseignantsMap.get(String(h.id_enseignant));
      map.set(String(h.id_honoraire), {
        ...h,
        enseignantNom: fullName(enseignant) || `Enseignant #${h.id_enseignant}`,
        periode: `${moisMap.get(String(h.id_mois))?.libelle || `Mois #${h.id_mois}`} ${anneesMap.get(String(h.id_annee))?.libelle || ""}`.trim(),
        etat: honoraireStatut(h),
      });
    });
    return map;
  }, [refs.honoraires, enseignantsMap, moisMap, anneesMap]);

  const focus = honoraireFilter ? honorairesIndex.get(honoraireFilter) : null;

  const rows = useMemo(
    () =>
      refs.paiements
        .map((p) => ({ ...p, h: honorairesIndex.get(String(p.id_honoraire)) }))
        .filter((p) => !honoraireFilter || String(p.id_honoraire) === honoraireFilter)
        .filter((p) => !enseignantFilter || String(p.h?.id_enseignant) === enseignantFilter)
        .filter((p) => !modeFilter || p.mode_paiement === modeFilter)
        .filter((p) => includesText([p.reference, p.h?.enseignantNom, p.h?.periode, p.commentaire], search))
        .sort((a, b) => String(b.date_paiement).localeCompare(String(a.date_paiement))),
    [refs.paiements, honorairesIndex, honoraireFilter, enseignantFilter, modeFilter, search],
  );

  const currentMonth = monthKey(todayISO());
  const stats = {
    total: sum(refs.paiements, "montant"),
    count: refs.paiements.length,
    mois: sum(refs.paiements.filter((p) => monthKey(p.date_paiement) === currentMonth), "montant"),
    solde: sum(refs.honoraires, "solde"),
    enseignants: new Set(refs.paiements.map((p) => honorairesIndex.get(String(p.id_honoraire))?.id_enseignant)).size,
  };

  const payables = useMemo(
    () => [...honorairesIndex.values()].filter((h) => Number(h.solde) > 0).sort((a, b) => a.enseignantNom.localeCompare(b.enseignantNom)),
    [honorairesIndex],
  );
  const selectedHonoraire = honorairesIndex.get(String(form.id_honoraire));

  function openCreate(idHonoraire = "") {
    const h = honorairesIndex.get(String(idHonoraire));
    setForm({ id_honoraire: idHonoraire ? String(idHonoraire) : "", montant: h ? String(h.solde) : "", reference: generateReference("HON"), date_paiement: nowLocalInput(), mode_paiement: "Espèces", commentaire: "" });
    setFormError("");
    setModal(true);
  }

  function change(name, value) {
    setForm((f) => {
      const next = { ...f, [name]: value };
      if (name === "id_honoraire") next.montant = String(honorairesIndex.get(String(value))?.solde ?? "");
      return next;
    });
  }

  async function submit(event) {
    event.preventDefault();
    const montant = Number(form.montant);
    if (!(montant > 0)) return setFormError("Le montant doit être supérieur à zéro.");
    if (selectedHonoraire && montant > Number(selectedHonoraire.solde)) return setFormError(`Le montant dépasse le solde restant (${formatMoney(selectedHonoraire.solde)}).`);
    try {
      setSaving(true);
      setFormError("");
      await createPaiementHonoraire({
        id_honoraire: Number(form.id_honoraire),
        reference: form.reference,
        date_paiement: form.date_paiement,
        montant,
        mode_paiement: form.mode_paiement || null,
        commentaire: form.commentaire || null,
        id_utilisateur: userId(),
      });
      setModal(false);
      showFlash(`Paiement de ${formatMoney(montant)} enregistré.`);
      await reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const modes = [...new Set(refs.paiements.map((p) => p.mode_paiement).filter(Boolean))];

  return (
    <ModulePage>
      <ModuleHeader icon="💸" title="Paiements des honoraires" subtitle="Versements effectués aux enseignants et soldes restants.">
        <button type="button" className="mk-btn mk-btn-light" onClick={() => navigate("/honoraires")}>💰 Honoraires</button>
        <button type="button" className="mk-btn mk-btn-primary" onClick={() => openCreate(honoraireFilter)} disabled={!payables.length && !loading}>＋ Nouveau paiement</button>
      </ModuleHeader>

      <Alert message={error} onClose={() => setError("")} />
      <Alert message={flash} onClose={clearFlash} kind="success" />

      {focus && (
        <div className="mk-card" style={{ marginBottom: 18, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <div className="mk-cell-main" style={{ flex: 1, minWidth: 240 }}>
            <Avatar text={focus.enseignantNom} tone="purple" />
            <div>
              <strong>{focus.enseignantNom} — {focus.periode}</strong>
              <small>Net {formatMoney(focus.montant_net)} · payé {formatMoney(focus.montant_paye)} · solde {formatMoney(focus.solde)}</small>
            </div>
          </div>
          <div style={{ width: 200 }}><Progress value={Number(focus.montant_net) ? (Number(focus.montant_paye) / Number(focus.montant_net)) * 100 : 0} /></div>
          <Badge tone={focus.etat.tone}>{focus.etat.label}</Badge>
          <button type="button" className="mk-btn mk-btn-light mk-btn-sm" onClick={() => setParams({})}>✕ Voir tous les paiements</button>
        </div>
      )}

      <StatGrid>
        <StatCard icon="💸" label="Total versé" value={formatMoney(stats.total)} hint={`${stats.count} paiement(s)`} tone="green" />
        <StatCard icon="📅" label="Versé ce mois" value={formatMoney(stats.mois)} />
        <StatCard icon="⏳" label="Reste à verser" value={formatMoney(stats.solde)} hint={`${payables.length} honoraire(s) ouvert(s)`} tone="orange" />
        <StatCard icon="👩‍🏫" label="Enseignants payés" value={stats.enseignants} tone="purple" />
      </StatGrid>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Référence, enseignant, période..." />
        <FilterSelect label="Honoraire" value={honoraireFilter} onChange={(v) => setParams(v ? { honoraire: v } : {})} placeholder="Tous" options={[...honorairesIndex.values()].map((h) => ({ value: String(h.id_honoraire), label: `${h.enseignantNom} — ${h.periode}` }))} />
        <FilterSelect label="Enseignant" value={enseignantFilter} onChange={setEnseignantFilter} placeholder="Tous" options={refs.enseignants.map((e) => ({ value: String(e.id_enseignant), label: fullName(e) }))} />
        <FilterSelect label="Mode" value={modeFilter} onChange={setModeFilter} placeholder="Tous" options={modes.map((m) => ({ value: m, label: m }))} />
        <RefreshButton onClick={reload} loading={loading} />
      </Toolbar>

      <DataTable
        loading={loading}
        rows={rows}
        rowKey="id_paiement_honoraire"
        emptyIcon="💸"
        emptyTitle="Aucun paiement"
        emptyText={focus ? "Aucun versement pour cet honoraire." : "Les versements aux enseignants apparaîtront ici."}
        onRowClick={setSelected}
        columns={[
          { key: "reference", label: "Référence", render: (p) => <span className="mk-id">{p.reference}</span> },
          { key: "enseignant", label: "Enseignant", render: (p) => (<div className="mk-cell-main"><Avatar text={p.h?.enseignantNom} tone="purple" /><div><strong>{p.h?.enseignantNom}</strong><small>{p.h?.periode}</small></div></div>) },
          { key: "date", label: "Date", render: (p) => formatDateTime(p.date_paiement) },
          { key: "mode", label: "Mode", render: (p) => (p.mode_paiement ? <Badge tone="blue">{p.mode_paiement}</Badge> : "—") },
          { key: "montant", label: "Montant", align: "right", render: (p) => <span className="mk-money positive">{formatMoney(p.montant)}</span> },
          { key: "solde", label: "Solde honoraire", align: "right", render: (p) => <span className="mk-money">{formatMoney(p.h?.solde)}</span> },
          { key: "statut", label: "Statut", render: (p) => <Badge tone={p.statut === "valide" ? "green" : "orange"}>{p.statut === "valide" ? "Validé" : p.statut}</Badge> },
        ]}
        actions={(p, close) => (
          <>
            <MenuItem icon="👁️" onClick={() => { setSelected(p); close(); }}>Consulter</MenuItem>
            <MenuItem icon="🔎" onClick={() => { close(); setParams({ honoraire: String(p.id_honoraire) }); }}>Filtrer sur cet honoraire</MenuItem>
            <MenuItem icon="➕" disabled={Number(p.h?.solde) <= 0} onClick={() => { close(); openCreate(p.id_honoraire); }}>Nouveau versement</MenuItem>
          </>
        )}
        footer={<><span>{rows.length} paiement(s)</span><strong>Total : {formatMoney(sum(rows, "montant"))}</strong></>}
      />

      <Modal open={modal} onClose={() => !saving && setModal(false)} title="Nouveau paiement d'honoraire" width={640}>
        <form onSubmit={submit}>
          <Alert message={formError} onClose={() => setFormError("")} />
          <FormFields
            values={form}
            onChange={change}
            fields={[
              { name: "id_honoraire", label: "Honoraire à payer", type: "select", required: true, full: true, options: payables.map((h) => ({ value: h.id_honoraire, label: `${h.enseignantNom} — ${h.periode} · solde ${formatMoney(h.solde)}` })), placeholder: payables.length ? "Sélectionner..." : "Aucun honoraire avec un solde restant" },
              { name: "montant", label: "Montant (FCFA)", type: "number", required: true, min: 1, max: selectedHonoraire?.solde, step: "1", help: selectedHonoraire ? `Solde restant : ${formatMoney(selectedHonoraire.solde)}` : undefined },
              { name: "mode_paiement", label: "Mode de paiement", type: "select", options: MODES_PAIEMENT.map((m) => ({ value: m, label: m })) },
              { name: "reference", label: "Référence", required: true },
              { name: "date_paiement", label: "Date et heure", type: "datetime-local", required: true },
              { name: "commentaire", label: "Commentaire", type: "textarea", full: true, rows: 2 },
            ]}
          />
          <FormActions onCancel={() => setModal(false)} saving={saving} submitLabel="Enregistrer le paiement" />
        </form>
      </Modal>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={`Paiement ${selected?.reference || ""}`} width={600}>
        {selected && (
          <DetailGrid
            items={[
              { label: "Enseignant", value: selected.h?.enseignantNom },
              { label: "Période", value: selected.h?.periode },
              { label: "Montant", value: formatMoney(selected.montant) },
              { label: "Date", value: formatDateTime(selected.date_paiement) },
              { label: "Mode", value: selected.mode_paiement },
              { label: "Statut", value: selected.statut },
              { label: "Net de l'honoraire", value: formatMoney(selected.h?.montant_net) },
              { label: "Solde restant", value: formatMoney(selected.h?.solde) },
              { label: "Commentaire", value: selected.commentaire, full: true },
            ]}
          />
        )}
      </Modal>
    </ModulePage>
  );
}
