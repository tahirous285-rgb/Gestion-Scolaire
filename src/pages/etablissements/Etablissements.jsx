import { useMemo, useState } from "react";
import {
  Alert, Badge, DetailGrid, EmptyState, FilterSelect, FormActions, FormFields, LoadingState, Modal, ModuleHeader,
  ModulePage, RefreshButton, SearchInput, StatCard, StatGrid, Toolbar, useAsyncData, useFlash,
} from "../../components/module/ModuleKit";
import { establishmentId } from "../../services/apiClient";
import { createEtablissement, deleteEtablissement, getEtablissements, updateEtablissement } from "../../services/administrationApi";
import { cleanPayload, includesText } from "../pageUtils";

const EMPTY = { nom: "", code: "", adresse: "", telephone: "", email: "", site_web: "", logo: "", devise: "FCFA", langue: "fr", fuseau_horaire: "Africa/Bamako", actif: true };

const FIELDS = [
  { name: "nom", label: "Nom de l'établissement", required: true, full: true },
  { name: "code", label: "Code (unique)", required: true },
  { name: "telephone", label: "Téléphone" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "site_web", label: "Site web", placeholder: "https://..." },
  { name: "adresse", label: "Adresse", type: "textarea", full: true, rows: 2 },
  { name: "devise", label: "Devise" },
  { name: "langue", label: "Langue", type: "select", options: [{ value: "fr", label: "Français" }, { value: "en", label: "Anglais" }, { value: "ar", label: "Arabe" }] },
  { name: "fuseau_horaire", label: "Fuseau horaire" },
  { name: "logo", label: "Logo (URL ou chemin)" },
  { name: "actif", label: "Établissement actif", type: "checkbox" },
];

export default function Etablissements() {
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState("");
  const [modal, setModal] = useState(null); // { mode: "create" | "edit" | "view", item }
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [flash, showFlash, clearFlash] = useFlash();
  const currentId = establishmentId();

  const { data, loading, error, setError, reload } = useAsyncData(() => getEtablissements());
  const list = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const filtered = list
    .filter((e) => !statut || (statut === "actif" ? e.actif !== false : e.actif === false))
    .filter((e) => includesText([e.nom, e.code, e.adresse, e.email, e.telephone], search));

  function open(mode, item = null) {
    setForm(item ? { ...EMPTY, ...Object.fromEntries(Object.entries(item).map(([k, v]) => [k, v ?? ""])), actif: item.actif !== false } : EMPTY);
    setFormError("");
    setModal({ mode, item });
  }

  async function submit(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setFormError("");
      const payload = cleanPayload(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, form[k]])));
      if (modal.mode === "edit") {
        await updateEtablissement(modal.item.id_etablissement, payload);
        showFlash("Établissement mis à jour.");
      } else {
        await createEtablissement(payload);
        showFlash("Établissement créé.");
      }
      setModal(null);
      await reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActif(item) {
    try {
      await updateEtablissement(item.id_etablissement, { actif: item.actif === false });
      showFlash(item.actif === false ? "Établissement réactivé." : "Établissement désactivé.");
      await reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(item) {
    if (item.id_etablissement === currentId) return setError("Impossible de supprimer l'établissement de la session en cours.");
    if (!window.confirm(`Supprimer définitivement « ${item.nom} » ? Cette action est irréversible.`)) return;
    try {
      await deleteEtablissement(item.id_etablissement);
      showFlash("Établissement supprimé.");
      await reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <ModulePage>
      <ModuleHeader icon="🏫" title="Établissements" subtitle="Identité, coordonnées et paramètres régionaux des établissements.">
        <button type="button" className="mk-btn mk-btn-primary" onClick={() => open("create")}>＋ Nouvel établissement</button>
      </ModuleHeader>

      <Alert message={error} onClose={() => setError("")} />
      <Alert message={flash} onClose={clearFlash} kind="success" />

      <StatGrid columns={3}>
        <StatCard icon="🏫" label="Établissements" value={list.length} />
        <StatCard icon="✅" label="Actifs" value={list.filter((e) => e.actif !== false).length} tone="green" />
        <StatCard icon="⏸️" label="Inactifs" value={list.filter((e) => e.actif === false).length} tone="orange" />
      </StatGrid>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Nom, code, adresse..." />
        <FilterSelect label="Statut" value={statut} onChange={setStatut} options={[{ value: "actif", label: "Actifs" }, { value: "inactif", label: "Inactifs" }]} />
        <RefreshButton onClick={reload} loading={loading} />
      </Toolbar>

      {loading ? (
        <div className="mk-table-card"><LoadingState /></div>
      ) : filtered.length === 0 ? (
        <div className="mk-table-card"><EmptyState icon="🏫" title="Aucun établissement" text="Aucun établissement ne correspond aux filtres." /></div>
      ) : (
        <div className="mk-card-grid">
          {filtered.map((e) => (
            <div key={e.id_etablissement} className={`mk-card mk-entity-card ${e.id_etablissement === currentId ? "is-current" : ""}`}>
              <div className="mk-entity-head">
                <div className="mk-entity-logo">{e.logo && /^https?:/.test(e.logo) ? <img src={e.logo} alt="" /> : (e.nom || "?").slice(0, 2).toUpperCase()}</div>
                <div className="mk-entity-title">
                  <h3>{e.nom}</h3>
                  <span className="mk-id">{e.code}</span>
                </div>
                <Badge tone={e.actif === false ? "red" : "green"}>{e.actif === false ? "Inactif" : "Actif"}</Badge>
              </div>
              {e.id_etablissement === currentId && <div className="mk-entity-current">📍 Établissement de la session</div>}
              <ul className="mk-entity-lines">
                <li>📍 {e.adresse || <span className="mk-muted">Adresse non renseignée</span>}</li>
                <li>📞 {e.telephone || <span className="mk-muted">—</span>}</li>
                <li>✉️ {e.email || <span className="mk-muted">—</span>}</li>
                <li>🌍 {e.langue?.toUpperCase() || "—"} · {e.devise || "—"} · {e.fuseau_horaire || "—"}</li>
              </ul>
              <div className="mk-entity-actions">
                <button type="button" className="mk-btn mk-btn-light mk-btn-sm" onClick={() => open("view", e)}>👁️ Détails</button>
                <button type="button" className="mk-btn mk-btn-light mk-btn-sm" onClick={() => open("edit", e)}>✏️ Modifier</button>
                <button type="button" className="mk-btn mk-btn-light mk-btn-sm" onClick={() => toggleActif(e)}>{e.actif === false ? "▶️ Activer" : "⏸️ Désactiver"}</button>
                <button type="button" className="mk-btn mk-btn-light mk-btn-sm mk-btn-danger" onClick={() => remove(e)} title="Supprimer">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(modal)}
        onClose={() => !saving && setModal(null)}
        title={modal?.mode === "view" ? modal.item.nom : modal?.mode === "edit" ? "Modifier l'établissement" : "Nouvel établissement"}
      >
        {modal?.mode === "view" ? (
          <>
            <DetailGrid
              items={[
                { label: "Code", value: modal.item.code },
                { label: "Statut", value: modal.item.actif === false ? "Inactif" : "Actif" },
                { label: "Téléphone", value: modal.item.telephone },
                { label: "E-mail", value: modal.item.email },
                { label: "Site web", value: modal.item.site_web ? <a href={modal.item.site_web} target="_blank" rel="noreferrer">{modal.item.site_web}</a> : null },
                { label: "Adresse", value: modal.item.adresse },
                { label: "Devise", value: modal.item.devise },
                { label: "Langue", value: modal.item.langue },
                { label: "Fuseau horaire", value: modal.item.fuseau_horaire },
                { label: "Logo", value: modal.item.logo },
              ]}
            />
            <div className="mk-form-actions">
              <button type="button" className="mk-btn mk-btn-light" onClick={() => setModal(null)}>Fermer</button>
              <button type="button" className="mk-btn mk-btn-primary" onClick={() => open("edit", modal.item)}>✏️ Modifier</button>
            </div>
          </>
        ) : (
          <form onSubmit={submit}>
            <Alert message={formError} onClose={() => setFormError("")} />
            <FormFields fields={FIELDS} values={form} onChange={(n, v) => setForm((f) => ({ ...f, [n]: v }))} />
            <FormActions onCancel={() => setModal(null)} saving={saving} submitLabel={modal?.mode === "edit" ? "Enregistrer" : "Créer"} />
          </form>
        )}
      </Modal>
    </ModulePage>
  );
}
