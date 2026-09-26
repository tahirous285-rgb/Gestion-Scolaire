import { useMemo, useState } from "react";
import {
  Alert, Badge, DataTable, DetailGrid, FilterSelect, FormActions, FormFields, MenuItem, Modal,
  ModuleHeader, ModulePage, RefreshButton, SearchInput, StatCard, StatGrid, Toolbar, loadAll,
  useAsyncData, useFlash,
} from "../../components/module/ModuleKit";
import { establishmentId, userId } from "../../services/apiClient";
import { getUtilisateurs } from "../../services/administrationApi";
import { createDepense, getDepenses, getPaiements } from "../../services/financeApi";
import {
  MODES_PAIEMENT, formatDate, formatMoney, fullName, groupBy, includesText, mapBy, monthKey, monthLabel,
  sum, todayISO,
} from "../pageUtils";

const CATEGORIES = ["Fournitures", "Maintenance", "Électricité", "Eau", "Salaires", "Transport", "Communication", "Équipement", "Loyer", "Autre"];
const emptyForm = () => ({ date_depense: todayISO(), categorie: "", libelle: "", montant: "", fournisseur: "", reference_piece: "", mode_paiement: "Espèces", justificatif: "", observation: "" });

export default function Depenses() {
  const [search, setSearch] = useState("");
  const [categorieFilter, setCategorieFilter] = useState("");
  const [moisFilter, setMoisFilter] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [selected, setSelected] = useState(null);
  const [flash, showFlash, clearFlash] = useFlash();

  const { data, loading, error, setError, reload } = useAsyncData(() =>
    loadAll({
      depenses: () => getDepenses(establishmentId()),
      paiements: () => getPaiements(),
      utilisateurs: () => getUtilisateurs({ limit: 500 }),
    }),
  );
  const refs = data || { depenses: [], paiements: [], utilisateurs: [] };
  const usersMap = useMemo(() => mapBy(refs.utilisateurs, "id_utilisateur"), [refs.utilisateurs]);

  const months = useMemo(
    () => [...new Set(refs.depenses.map((d) => monthKey(d.date_depense)))].filter(Boolean).sort().reverse(),
    [refs.depenses],
  );
  const categories = useMemo(
    () => [...new Set([...CATEGORIES, ...refs.depenses.map((d) => d.categorie).filter(Boolean)])],
    [refs.depenses],
  );

  const rows = useMemo(
    () =>
      refs.depenses
        .filter((d) => !categorieFilter || d.categorie === categorieFilter)
        .filter((d) => !moisFilter || monthKey(d.date_depense) === moisFilter)
        .filter((d) => includesText([d.libelle, d.categorie, d.fournisseur, d.reference_piece, d.observation], search))
        .sort((a, b) => String(b.date_depense).localeCompare(String(a.date_depense))),
    [refs.depenses, categorieFilter, moisFilter, search],
  );

  const currentMonth = monthKey(todayISO());
  const stats = useMemo(() => {
    const totalDepenses = sum(refs.depenses, "montant");
    const totalRecettes = sum(refs.paiements.filter((p) => p.statut !== "annule"), "montant");
    const mois = refs.depenses.filter((d) => monthKey(d.date_depense) === currentMonth);
    return { total: totalDepenses, mois: sum(mois, "montant"), moisCount: mois.length, solde: totalRecettes - totalDepenses, recettes: totalRecettes };
  }, [refs.depenses, refs.paiements, currentMonth]);

  const parCategorie = useMemo(() => {
    const groups = groupBy(rows, (d) => d.categorie || "Non classé");
    const list = [...groups.entries()].map(([cat, items]) => ({ cat, total: sum(items, "montant"), count: items.length }));
    return list.sort((a, b) => b.total - a.total);
  }, [rows]);
  const maxCategorie = parCategorie[0]?.total || 1;

  async function submit(event) {
    event.preventDefault();
    const montant = Number(form.montant);
    if (!(montant > 0)) return setFormError("Le montant doit être supérieur à zéro.");
    try {
      setSaving(true);
      setFormError("");
      await createDepense({
        id_etablissement: establishmentId(),
        date_depense: form.date_depense,
        categorie: form.categorie || null,
        libelle: form.libelle.trim(),
        montant,
        fournisseur: form.fournisseur || null,
        reference_piece: form.reference_piece || null,
        mode_paiement: form.mode_paiement || null,
        justificatif: form.justificatif || null,
        observation: form.observation || null,
        id_utilisateur: userId(),
      });
      setModal(false);
      showFlash(`Dépense « ${form.libelle} » enregistrée.`);
      await reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const fields = [
    { name: "libelle", label: "Libellé", required: true, full: true, placeholder: "ex. Achat de craies" },
    { name: "montant", label: "Montant (FCFA)", type: "number", required: true, min: 1, step: "1" },
    { name: "date_depense", label: "Date", type: "date", required: true },
    { name: "categorie", label: "Catégorie", type: "select", options: categories.map((c) => ({ value: c, label: c })) },
    { name: "mode_paiement", label: "Mode de paiement", type: "select", options: MODES_PAIEMENT.map((m) => ({ value: m, label: m })) },
    { name: "fournisseur", label: "Fournisseur / bénéficiaire" },
    { name: "reference_piece", label: "N° de pièce / facture" },
    { name: "justificatif", label: "Justificatif (lien ou référence)", full: true },
    { name: "observation", label: "Observation", type: "textarea", full: true, rows: 2 },
  ];

  return (
    <ModulePage>
      <ModuleHeader icon="📉" title="Dépenses" subtitle="Sorties de caisse de l'établissement, par catégorie et par mois.">
        <button type="button" className="mk-btn mk-btn-primary" onClick={() => { setForm(emptyForm()); setFormError(""); setModal(true); }}>＋ Nouvelle dépense</button>
      </ModuleHeader>

      <Alert message={error} onClose={() => setError("")} />
      <Alert message={flash} onClose={clearFlash} kind="success" />

      <StatGrid>
        <StatCard icon="📉" label="Total des dépenses" value={formatMoney(stats.total)} hint={`${refs.depenses.length} opération(s)`} tone="red" />
        <StatCard icon="📅" label={`Dépenses — ${monthLabel(currentMonth)}`} value={formatMoney(stats.mois)} hint={`${stats.moisCount} opération(s)`} tone="orange" />
        <StatCard icon="💰" label="Recettes (paiements)" value={formatMoney(stats.recettes)} tone="green" />
        <StatCard icon="⚖️" label="Solde recettes − dépenses" value={formatMoney(stats.solde)} tone={stats.solde >= 0 ? "blue" : "red"} />
      </StatGrid>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Libellé, fournisseur, n° de pièce..." />
        <FilterSelect label="Catégorie" value={categorieFilter} onChange={setCategorieFilter} placeholder="Toutes" options={categories.map((c) => ({ value: c, label: c }))} />
        <FilterSelect label="Mois" value={moisFilter} onChange={setMoisFilter} placeholder="Tous" options={months.map((m) => ({ value: m, label: monthLabel(m) }))} />
        <RefreshButton onClick={reload} loading={loading} />
      </Toolbar>

      <div className="mk-two-cols">
        <DataTable
          loading={loading}
          rows={rows}
          rowKey="id_depense"
          emptyIcon="📉"
          emptyTitle="Aucune dépense"
          emptyText="Enregistrez les sorties de caisse pour suivre le budget."
          onRowClick={setSelected}
          columns={[
            { key: "date", label: "Date", render: (d) => formatDate(d.date_depense) },
            { key: "libelle", label: "Libellé", render: (d) => (<div><strong>{d.libelle}</strong>{d.fournisseur && <div className="mk-muted" style={{ fontSize: 12 }}>{d.fournisseur}</div>}</div>) },
            { key: "categorie", label: "Catégorie", render: (d) => (d.categorie ? <Badge tone="purple">{d.categorie}</Badge> : "—") },
            { key: "mode", label: "Mode", render: (d) => d.mode_paiement || "—" },
            { key: "montant", label: "Montant", align: "right", render: (d) => <span className="mk-money negative">− {formatMoney(d.montant)}</span> },
          ]}
          actions={(d, close) => <MenuItem icon="👁️" onClick={() => { setSelected(d); close(); }}>Consulter</MenuItem>}
          footer={<><span>{rows.length} dépense(s)</span><strong>Total : {formatMoney(sum(rows, "montant"))}</strong></>}
        />

        <div className="mk-card">
          <div className="mk-card-title">
            <div>
              <h3>Répartition par catégorie</h3>
              <p>{moisFilter ? monthLabel(moisFilter) : "Toutes périodes"}</p>
            </div>
          </div>
          {parCategorie.length === 0 ? (
            <p className="mk-muted">Aucune donnée.</p>
          ) : (
            <div className="mk-bars">
              {parCategorie.map((c) => (
                <div key={c.cat} className="mk-bar-row" title={`${c.count} opération(s)`}>
                  <span>{c.cat}</span>
                  <div className="mk-bar-track"><div style={{ width: `${(c.total / maxCategorie) * 100}%` }} /></div>
                  <span className="mk-money" style={{ fontSize: 12.5 }}>{formatMoney(c.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={modal} onClose={() => !saving && setModal(false)} title="Nouvelle dépense">
        <form onSubmit={submit}>
          <Alert message={formError} onClose={() => setFormError("")} />
          <FormFields fields={fields} values={form} onChange={(n, v) => setForm((f) => ({ ...f, [n]: v }))} />
          <FormActions onCancel={() => setModal(false)} saving={saving} />
        </form>
      </Modal>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.libelle || "Dépense"} width={620}>
        {selected && (
          <DetailGrid
            items={[
              { label: "Montant", value: formatMoney(selected.montant) },
              { label: "Date", value: formatDate(selected.date_depense) },
              { label: "Catégorie", value: selected.categorie },
              { label: "Mode de paiement", value: selected.mode_paiement },
              { label: "Fournisseur", value: selected.fournisseur },
              { label: "N° de pièce", value: selected.reference_piece },
              { label: "Justificatif", value: selected.justificatif, full: true },
              { label: "Saisie par", value: fullName(usersMap.get(String(selected.id_utilisateur))) },
              { label: "Observation", value: selected.observation, full: true },
            ]}
          />
        )}
      </Modal>
    </ModulePage>
  );
}
