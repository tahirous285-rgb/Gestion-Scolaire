import { useMemo, useState } from "react";
import {
  Alert, Badge, EmptyState, FormActions, FormFields, LoadingState, Modal, ModuleHeader, ModulePage,
  RefreshButton, SearchInput, StatCard, StatGrid, Toolbar, useAsyncData, useFlash,
} from "../../components/module/ModuleKit";
import { establishmentId } from "../../services/apiClient";
import { createParametre, getParametres, updateParametre } from "../../services/administrationApi";
import { formatDateTime, groupBy, includesText } from "../pageUtils";
import "./Parametres.css";

/** Paramètres usuels proposés en un clic lorsqu'ils n'existent pas encore. */
const SUGGESTIONS = [
  { cle: "ecole.directeur", description: "Nom du directeur / de la directrice (signature des documents)" },
  { cle: "ecole.slogan", description: "Devise ou slogan affiché sur les documents" },
  { cle: "notes.bareme_defaut", valeur: "20", description: "Barème par défaut des évaluations" },
  { cle: "notes.moyenne_passage", valeur: "10", description: "Moyenne minimale de passage" },
  { cle: "finance.prefixe_recu", valeur: "RECU", description: "Préfixe des numéros de reçus" },
  { cle: "finance.penalite_retard", valeur: "0", description: "Pénalité de retard de paiement (%)" },
  { cle: "presences.heure_debut", valeur: "08:00", description: "Heure de début des cours (calcul des retards)" },
  { cle: "cartes.validite_mois", valeur: "12", description: "Durée de validité des cartes scolaires (mois)" },
];

const groupOf = (cle) => (cle.includes(".") ? cle.split(".")[0] : cle.includes("_") ? cle.split("_")[0] : "général");

export default function Parametres() {
  const idEtab = establishmentId();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null); // { id, valeur, description }
  const [savingId, setSavingId] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ cle: "", valeur: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [flash, showFlash, clearFlash] = useFlash();

  const { data, loading, error, setError, reload } = useAsyncData(() => getParametres(idEtab));
  const params = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const existing = new Set(params.map((p) => p.cle));
  const filtered = params.filter((p) => includesText([p.cle, p.valeur, p.description], search));
  const groups = [...groupBy(filtered, (p) => groupOf(p.cle)).entries()].sort(([a], [b]) => a.localeCompare(b));
  const missing = SUGGESTIONS.filter((s) => !existing.has(s.cle));
  const lastUpdate = params.map((p) => p.date_modification).filter(Boolean).sort().pop();

  async function saveInline() {
    try {
      setSavingId(editing.id);
      await updateParametre(editing.id, { valeur: editing.valeur, description: editing.description || null });
      showFlash("Paramètre enregistré.");
      setEditing(null);
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  function openCreate(preset = {}) {
    setForm({ cle: "", valeur: "", description: "", ...preset });
    setFormError("");
    setModal(true);
  }

  async function submit(event) {
    event.preventDefault();
    const cle = form.cle.trim();
    if (existing.has(cle)) return setFormError(`La clé « ${cle} » existe déjà : modifiez-la directement dans la liste.`);
    try {
      setSaving(true);
      await createParametre({ id_etablissement: idEtab, cle, valeur: form.valeur, description: form.description || null });
      showFlash(`Paramètre « ${cle} » créé.`);
      setModal(false);
      await reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModulePage>
      <ModuleHeader icon="⚙️" title="Paramètres" subtitle="Configuration propre à l'établissement connecté. Cliquez sur une valeur pour la modifier.">
        <button type="button" className="mk-btn mk-btn-primary" onClick={() => openCreate()}>＋ Nouveau paramètre</button>
      </ModuleHeader>

      <Alert message={error} onClose={() => setError("")} />
      <Alert message={flash} onClose={clearFlash} kind="success" />

      <StatGrid columns={3}>
        <StatCard icon="⚙️" label="Paramètres" value={params.length} />
        <StatCard icon="🗂️" label="Groupes" value={new Set(params.map((p) => groupOf(p.cle))).size} tone="purple" />
        <StatCard icon="🕒" label="Dernière modification" value={lastUpdate ? formatDateTime(lastUpdate) : "—"} tone="green" />
      </StatGrid>

      {missing.length > 0 && !loading && (
        <div className="mk-card param-suggestions">
          <div className="mk-card-title">💡 Paramètres suggérés</div>
          <div className="param-chips">
            {missing.map((s) => (
              <button key={s.cle} type="button" className="param-chip" title={s.description} onClick={() => openCreate(s)}>＋ {s.cle}</button>
            ))}
          </div>
        </div>
      )}

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Clé, valeur, description..." />
        <RefreshButton onClick={reload} loading={loading} />
      </Toolbar>

      {loading ? (
        <div className="mk-table-card"><LoadingState /></div>
      ) : groups.length === 0 ? (
        <div className="mk-table-card"><EmptyState icon="⚙️" title="Aucun paramètre" text="Ajoutez un paramètre ou choisissez une suggestion ci-dessus." /></div>
      ) : (
        groups.map(([group, items]) => (
          <div key={group} className="mk-table-card param-group">
            <div className="param-group-title"><span>{group}</span><Badge>{items.length}</Badge></div>
            {items.sort((a, b) => a.cle.localeCompare(b.cle)).map((p) => {
              const isEditing = editing?.id === p.id_parametre;
              return (
                <div key={p.id_parametre} className={`param-row ${isEditing ? "editing" : ""}`}>
                  <div className="param-key">
                    <code>{p.cle}</code>
                    {!isEditing && <small>{p.description || "—"}</small>}
                  </div>
                  {isEditing ? (
                    <div className="param-edit">
                      <input autoFocus value={editing.valeur} onChange={(e) => setEditing({ ...editing, valeur: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") saveInline(); if (e.key === "Escape") setEditing(null); }} placeholder="Valeur" />
                      <input value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Description" />
                      <div className="param-edit-actions">
                        <button type="button" className="mk-btn mk-btn-light mk-btn-sm" onClick={() => setEditing(null)}>Annuler</button>
                        <button type="button" className="mk-btn mk-btn-primary mk-btn-sm" disabled={savingId === p.id_parametre} onClick={saveInline}>{savingId === p.id_parametre ? "…" : "Enregistrer"}</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" className="param-value" title="Modifier" onClick={() => setEditing({ id: p.id_parametre, valeur: p.valeur ?? "", description: p.description ?? "" })}>
                      {p.valeur ? <span>{p.valeur}</span> : <span className="mk-muted">(vide)</span>}
                      <em>✏️</em>
                    </button>
                  )}
                  <div className="param-date mk-muted">{formatDateTime(p.date_modification)}</div>
                </div>
              );
            })}
          </div>
        ))
      )}

      <Modal open={modal} onClose={() => !saving && setModal(false)} title="Nouveau paramètre" width={560}>
        <form onSubmit={submit}>
          <Alert message={formError} onClose={() => setFormError("")} />
          <FormFields
            values={form}
            onChange={(n, v) => setForm((f) => ({ ...f, [n]: v }))}
            fields={[
              { name: "cle", label: "Clé", required: true, full: true, placeholder: "groupe.nom_parametre", help: "Utilisez un préfixe (ex. notes., finance.) pour regrouper les paramètres. La clé ne sera plus modifiable." },
              { name: "valeur", label: "Valeur", full: true },
              { name: "description", label: "Description", type: "textarea", rows: 2, full: true },
            ]}
          />
          <FormActions onCancel={() => setModal(false)} saving={saving} submitLabel="Créer" />
        </form>
      </Modal>
    </ModulePage>
  );
}
