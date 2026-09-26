import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, Badge, DataTable, DetailGrid, FilterSelect, FormActions, FormFields, MenuItem, Modal,
  ModuleHeader, ModulePage, RefreshButton, SearchInput, StatCard, StatGrid, Toolbar, loadAll,
  useAsyncData, useFlash, Avatar,
} from "../../components/module/ModuleKit";
import { userId } from "../../services/apiClient";
import { getAnnees } from "../../services/anneesApi";
import { getClasses } from "../../services/classesApi";
import { getEleves } from "../../services/elevesApi";
import { createPaiement, getFrais, getPaiements, getTypesFrais } from "../../services/financeApi";
import { getInscriptions } from "../../services/inscriptionsApi";
import { establishmentId } from "../../services/apiClient";
import {
  MODES_PAIEMENT, buildInscriptionIndex, formatDate, formatDateTime, formatMoney, generateReference,
  includesText, mapBy, monthKey, nowLocalInput, sum, todayISO,
} from "../pageUtils";

const emptyForm = () => ({
  id_inscription: "",
  id_frais: "",
  reference: generateReference("PAY"),
  date_paiement: nowLocalInput(),
  montant: "",
  mode_paiement: "Espèces",
  commentaire: "",
});

export default function Paiements() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [classeFilter, setClasseFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [selected, setSelected] = useState(null);
  const [flash, showFlash, clearFlash] = useFlash();

  const { data, loading, error, setError, reload } = useAsyncData(() =>
    loadAll({
      paiements: () => getPaiements(),
      frais: () => getFrais(),
      types: () => getTypesFrais(establishmentId()),
      inscriptions: () => getInscriptions(),
      eleves: () => getEleves({ limit: 1000 }),
      classes: getClasses,
      annees: getAnnees,
    }),
  );

  const refs = data || { paiements: [], frais: [], types: [], inscriptions: [], eleves: [], classes: [], annees: [] };
  const inscriptionIndex = useMemo(
    () => buildInscriptionIndex(refs.inscriptions, refs.eleves, refs.classes, refs.annees),
    [refs.inscriptions, refs.eleves, refs.classes, refs.annees],
  );
  const typesMap = useMemo(() => mapBy(refs.types, "id_type_frais"), [refs.types]);
  const fraisMap = useMemo(() => mapBy(refs.frais, "id_frais"), [refs.frais]);

  // Montant déjà payé par frais
  const payeParFrais = useMemo(() => {
    const map = new Map();
    refs.paiements.forEach((p) => {
      if (p.id_frais && p.statut !== "annule") map.set(String(p.id_frais), (map.get(String(p.id_frais)) || 0) + Number(p.montant || 0));
    });
    return map;
  }, [refs.paiements]);

  function fraisLabel(frais) {
    if (!frais) return "—";
    const type = typesMap.get(String(frais.id_type_frais));
    return type?.libelle || `Frais #${frais.id_frais}`;
  }

  const rows = useMemo(() => {
    const now = new Date();
    return refs.paiements
      .map((p) => ({ ...p, ins: inscriptionIndex.get(String(p.id_inscription)), frais: fraisMap.get(String(p.id_frais)) }))
      .filter((p) => !modeFilter || p.mode_paiement === modeFilter)
      .filter((p) => !classeFilter || String(p.ins?.id_classe) === classeFilter)
      .filter((p) => {
        if (!periodFilter) return true;
        const d = new Date(p.date_paiement);
        if (periodFilter === "today") return String(p.date_paiement).slice(0, 10) === todayISO();
        if (periodFilter === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (periodFilter === "7d") return now - d <= 7 * 86400000;
        return true;
      })
      .filter((p) => includesText([p.reference, p.ins?.eleveNom, p.ins?.matricule, p.ins?.classeNom, p.mode_paiement, p.commentaire], search))
      .sort((a, b) => String(b.date_paiement).localeCompare(String(a.date_paiement)));
  }, [refs.paiements, inscriptionIndex, fraisMap, modeFilter, classeFilter, periodFilter, search]);

  const stats = useMemo(() => {
    const valid = refs.paiements.filter((p) => p.statut !== "annule");
    const thisMonth = monthKey(todayISO());
    const monthRows = valid.filter((p) => monthKey(p.date_paiement) === thisMonth);
    const totalDu = sum(refs.frais, "montant_du");
    const totalPaye = sum(valid, "montant");
    return {
      total: totalPaye,
      count: valid.length,
      month: sum(monthRows, "montant"),
      monthCount: monthRows.length,
      reste: Math.max(totalDu - sum(valid.filter((p) => p.id_frais), "montant"), 0),
      taux: totalDu ? Math.round((sum(valid.filter((p) => p.id_frais), "montant") / totalDu) * 100) : 0,
    };
  }, [refs.paiements, refs.frais]);

  // Frais de l'inscription choisie dans le formulaire
  const fraisInscription = useMemo(
    () => refs.frais.filter((f) => String(f.id_inscription) === String(form.id_inscription)),
    [refs.frais, form.id_inscription],
  );
  const selectedFrais = fraisMap.get(String(form.id_frais));
  const resteFrais = selectedFrais ? Math.max(Number(selectedFrais.montant_du) - (payeParFrais.get(String(selectedFrais.id_frais)) || 0), 0) : null;

  const inscriptionOptions = useMemo(
    () =>
      [...inscriptionIndex.values()]
        .sort((a, b) => a.label.localeCompare(b.label))
        .map((ins) => ({ value: ins.id_inscription, label: `${ins.label}${ins.matricule ? ` · ${ins.matricule}` : ""}` })),
    [inscriptionIndex],
  );

  function openCreate(prefill = {}) {
    setForm({ ...emptyForm(), ...prefill });
    setFormError("");
    setModalOpen(true);
  }

  function change(name, value) {
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "id_inscription") next.id_frais = "";
      if (name === "id_frais" && value) {
        const f = fraisMap.get(String(value));
        if (f) {
          const reste = Math.max(Number(f.montant_du) - (payeParFrais.get(String(f.id_frais)) || 0), 0);
          if (!current.montant || Number(current.montant) === 0) next.montant = String(reste || "");
        }
      }
      return next;
    });
  }

  async function submit(event) {
    event.preventDefault();
    const montant = Number(form.montant);
    if (!(montant > 0)) {
      setFormError("Le montant doit être supérieur à zéro.");
      return;
    }
    if (resteFrais !== null && montant > resteFrais && !window.confirm(`Le montant dépasse le reste à payer (${formatMoney(resteFrais)}). Continuer ?`)) {
      return;
    }
    try {
      setSaving(true);
      setFormError("");
      const created = await createPaiement({
        id_inscription: Number(form.id_inscription),
        id_frais: form.id_frais ? Number(form.id_frais) : null,
        reference: form.reference.trim(),
        date_paiement: form.date_paiement,
        montant,
        mode_paiement: form.mode_paiement || null,
        commentaire: form.commentaire || null,
        id_utilisateur: userId(),
      });
      setModalOpen(false);
      showFlash(`Paiement ${created.reference} enregistré — le reçu a été généré automatiquement.`);
      await reload();
    } catch (err) {
      setFormError(err.message || "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  const fields = [
    { name: "id_inscription", label: "Élève (inscription)", type: "select", required: true, full: true, options: inscriptionOptions },
    {
      name: "id_frais",
      label: "Frais concerné",
      type: "select",
      full: true,
      disabled: !form.id_inscription,
      placeholder: form.id_inscription ? (fraisInscription.length ? "Paiement libre (sans frais)" : "Aucun frais pour cet élève") : "Choisissez d'abord l'élève",
      options: fraisInscription.map((f) => {
        const reste = Math.max(Number(f.montant_du) - (payeParFrais.get(String(f.id_frais)) || 0), 0);
        return { value: f.id_frais, label: `${fraisLabel(f)} — dû ${formatMoney(f.montant_du)} · reste ${formatMoney(reste)}${reste === 0 ? " ✓" : ""}` };
      }),
    },
    { name: "montant", label: "Montant (FCFA)", type: "number", required: true, min: 1, step: "1", help: resteFrais !== null ? `Reste à payer sur ce frais : ${formatMoney(resteFrais)}` : undefined },
    { name: "mode_paiement", label: "Mode de paiement", type: "select", options: MODES_PAIEMENT.map((m) => ({ value: m, label: m })) },
    { name: "reference", label: "Référence", required: true, help: "Générée automatiquement, modifiable." },
    { name: "date_paiement", label: "Date et heure", type: "datetime-local", required: true },
    { name: "commentaire", label: "Commentaire", type: "textarea", full: true, rows: 3 },
  ];

  const modes = [...new Set(refs.paiements.map((p) => p.mode_paiement).filter(Boolean))];

  return (
    <ModulePage>
      <ModuleHeader icon="💳" title="Paiements scolaires" subtitle="Encaissements des familles, rattachés aux inscriptions et aux frais.">
        <button type="button" className="mk-btn mk-btn-light" onClick={() => navigate("/recus")}>🧾 Reçus</button>
        <button type="button" className="mk-btn mk-btn-primary" onClick={() => openCreate()}>＋ Nouveau paiement</button>
      </ModuleHeader>

      <Alert message={error} onClose={() => setError("")} />
      <Alert message={flash} onClose={clearFlash} kind="success" />

      <StatGrid>
        <StatCard icon="💰" label="Total encaissé" value={formatMoney(stats.total)} hint={`${stats.count} paiement(s)`} tone="green" />
        <StatCard icon="📅" label="Encaissé ce mois" value={formatMoney(stats.month)} hint={`${stats.monthCount} paiement(s)`} />
        <StatCard icon="⏳" label="Reste à recouvrer" value={formatMoney(stats.reste)} hint="Sur les frais enregistrés" tone="orange" />
        <StatCard icon="📈" label="Taux de recouvrement" value={`${stats.taux} %`} tone="purple" />
      </StatGrid>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un élève, une référence, un matricule..." />
        <FilterSelect label="Classe" value={classeFilter} onChange={setClasseFilter} placeholder="Toutes" options={refs.classes.map((c) => ({ value: String(c.id_classe), label: c.nom }))} />
        <FilterSelect label="Mode" value={modeFilter} onChange={setModeFilter} placeholder="Tous" options={modes.map((m) => ({ value: m, label: m }))} />
        <FilterSelect label="Période" value={periodFilter} onChange={setPeriodFilter} placeholder="Toutes" options={[{ value: "today", label: "Aujourd'hui" }, { value: "7d", label: "7 derniers jours" }, { value: "month", label: "Ce mois" }]} />
        <RefreshButton onClick={reload} loading={loading} />
      </Toolbar>

      <DataTable
        loading={loading}
        rows={rows}
        rowKey="id_paiement"
        emptyIcon="💳"
        emptyTitle={search || modeFilter || classeFilter || periodFilter ? "Aucun paiement trouvé" : "Aucun paiement enregistré"}
        emptyText="Enregistrez un premier encaissement avec le bouton « Nouveau paiement »."
        onRowClick={setSelected}
        columns={[
          { key: "reference", label: "Référence", render: (p) => <span className="mk-id">{p.reference}</span> },
          {
            key: "eleve",
            label: "Élève",
            render: (p) => (
              <div className="mk-cell-main">
                <Avatar text={p.ins?.eleveNom} tone="green" />
                <div>
                  <strong>{p.ins?.eleveNom || `Inscription #${p.id_inscription}`}</strong>
                  <small>{[p.ins?.classeNom, p.ins?.matricule].filter(Boolean).join(" · ")}</small>
                </div>
              </div>
            ),
          },
          { key: "frais", label: "Frais", render: (p) => (p.frais ? fraisLabel(p.frais) : <span className="mk-muted">Paiement libre</span>) },
          { key: "date", label: "Date", render: (p) => formatDateTime(p.date_paiement) },
          { key: "mode", label: "Mode", render: (p) => (p.mode_paiement ? <Badge tone="blue">{p.mode_paiement}</Badge> : "—") },
          { key: "montant", label: "Montant", align: "right", render: (p) => <span className="mk-money positive">{formatMoney(p.montant)}</span> },
          { key: "statut", label: "Statut", render: (p) => <Badge tone={p.statut === "valide" ? "green" : "red"}>{p.statut === "valide" ? "Validé" : p.statut}</Badge> },
        ]}
        actions={(p, close) => (
          <>
            <MenuItem icon="👁️" onClick={() => { setSelected(p); close(); }}>Consulter</MenuItem>
            <MenuItem icon="🧾" onClick={() => navigate(`/recus?paiement=${p.id_paiement}`)}>Voir le reçu</MenuItem>
            <MenuItem icon="➕" onClick={() => { close(); openCreate({ id_inscription: String(p.id_inscription) }); }}>Nouveau paiement pour cet élève</MenuItem>
          </>
        )}
        footer={
          <>
            <span>{rows.length} paiement(s) affiché(s)</span>
            <strong>Total affiché : {formatMoney(sum(rows, "montant"))}</strong>
          </>
        }
      />

      <Modal open={modalOpen} onClose={() => !saving && setModalOpen(false)} title="Nouveau paiement" subtitle="Un reçu est généré automatiquement par le serveur après l'enregistrement.">
        <form onSubmit={submit}>
          <Alert message={formError} onClose={() => setFormError("")} />
          <FormFields fields={fields} values={form} onChange={change} />
          <FormActions onCancel={() => setModalOpen(false)} saving={saving} submitLabel="Encaisser" />
        </form>
      </Modal>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={`Paiement ${selected?.reference || ""}`} width={640}
        footer={selected && (
          <>
            <button type="button" className="mk-btn mk-btn-light" onClick={() => setSelected(null)}>Fermer</button>
            <button type="button" className="mk-btn mk-btn-primary" onClick={() => navigate(`/recus?paiement=${selected.id_paiement}`)}>🧾 Ouvrir le reçu</button>
          </>
        )}>
        {selected && (
          <DetailGrid
            items={[
              { label: "Élève", value: selected.ins?.eleveNom },
              { label: "Matricule", value: selected.ins?.matricule },
              { label: "Classe", value: selected.ins?.classeNom },
              { label: "Année scolaire", value: selected.ins?.anneeLibelle },
              { label: "Frais", value: selected.frais ? `${fraisLabel(selected.frais)} (dû ${formatMoney(selected.frais.montant_du)}, échéance ${formatDate(selected.frais.date_echeance)})` : "Paiement libre" },
              { label: "Montant", value: formatMoney(selected.montant) },
              { label: "Date", value: formatDateTime(selected.date_paiement) },
              { label: "Mode", value: selected.mode_paiement },
              { label: "Statut", value: selected.statut },
              { label: "Référence", value: selected.reference },
              { label: "Commentaire", value: selected.commentaire, full: true },
            ]}
          />
        )}
      </Modal>
    </ModulePage>
  );
}
