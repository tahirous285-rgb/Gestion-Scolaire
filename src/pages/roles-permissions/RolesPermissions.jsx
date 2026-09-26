import { useMemo, useState } from "react";
import BackendUnavailable from "../../components/common/BackendUnavailable";
import {
  Alert, Avatar, Badge, EmptyState, FormActions, FormFields, LoadingState, Modal, ModuleHeader, ModulePage,
  RefreshButton, SearchInput, StatCard, StatGrid, Toolbar, loadAll, useAsyncData, useFlash,
} from "../../components/module/ModuleKit";
import { establishmentId } from "../../services/apiClient";
import { createRole, getRoles, getUtilisateurs } from "../../services/administrationApi";
import { cleanPayload, fullName, groupBy, includesText } from "../pageUtils";

const TONES = ["blue", "purple", "green", "orange", "red", "yellow"];
const EMPTY = { nom: "", code: "", description: "" };

export default function RolesPermissions() {
  const idEtab = establishmentId();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [flash, showFlash, clearFlash] = useFlash();

  const { data, loading, error, setError, reload } = useAsyncData(() => loadAll({ roles: getRoles, utilisateurs: () => getUtilisateurs({ limit: 1000 }) }));
  const refs = data || { roles: [], utilisateurs: [] };
  const users = useMemo(() => refs.utilisateurs.filter((u) => !idEtab || u.id_etablissement === idEtab), [refs.utilisateurs, idEtab]);
  const byRole = useMemo(() => groupBy(users, (u) => String(u.id_role)), [users]);
  const roles = refs.roles.filter((r) => includesText([r.nom, r.code, r.description], search));

  async function submit(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setFormError("");
      const code = form.code.trim().toUpperCase().replace(/\s+/g, "_");
      if (refs.roles.some((r) => r.code?.toUpperCase() === code)) throw new Error(`Le code « ${code} » est déjà utilisé.`);
      await createRole(cleanPayload({ ...form, code }));
      showFlash(`Rôle « ${form.nom} » créé.`);
      setModal(false);
      await reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const detailUsers = detail ? byRole.get(String(detail.id_role)) || [] : [];

  return (
    <ModulePage>
      <ModuleHeader icon="🛡️" title="Rôles & permissions" subtitle="Profils d'accès et répartition des utilisateurs de l'établissement.">
        <button type="button" className="mk-btn mk-btn-primary" onClick={() => { setForm(EMPTY); setFormError(""); setModal(true); }}>＋ Nouveau rôle</button>
      </ModuleHeader>

      <Alert message={error} onClose={() => setError("")} />
      <Alert message={flash} onClose={clearFlash} kind="success" />

      <StatGrid columns={3}>
        <StatCard icon="🛡️" label="Rôles définis" value={refs.roles.length} />
        <StatCard icon="👥" label="Utilisateurs de l'établissement" value={users.length} tone="green" />
        <StatCard icon="💤" label="Rôles sans utilisateur" value={refs.roles.filter((r) => !byRole.get(String(r.id_role))).length} tone="orange" />
      </StatGrid>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Nom, code, description..." />
        <RefreshButton onClick={reload} loading={loading} />
      </Toolbar>

      {loading ? (
        <div className="mk-table-card"><LoadingState /></div>
      ) : roles.length === 0 ? (
        <div className="mk-table-card"><EmptyState icon="🛡️" title="Aucun rôle" text="Créez un premier rôle pour attribuer des accès." /></div>
      ) : (
        <div className="mk-card-grid">
          {roles.map((r, i) => {
            const members = byRole.get(String(r.id_role)) || [];
            const tone = TONES[i % TONES.length];
            return (
              <div key={r.id_role} className="mk-card mk-entity-card">
                <div className="mk-entity-head">
                  <Avatar text={r.nom} tone={tone} />
                  <div className="mk-entity-title">
                    <h3>{r.nom}</h3>
                    <span className="mk-id">{r.code}</span>
                  </div>
                  <Badge tone={members.length ? tone : "neutral"}>{members.length} utilisateur{members.length > 1 ? "s" : ""}</Badge>
                </div>
                <p className="mk-muted" style={{ margin: 0, fontSize: 13 }}>{r.description || "Aucune description."}</p>
                <div className="mk-avatar-stack">
                  {members.slice(0, 6).map((u) => <Avatar key={u.id_utilisateur} text={fullName(u)} tone={tone} />)}
                  {members.length > 6 && <span className="mk-muted">+{members.length - 6}</span>}
                </div>
                <div className="mk-entity-actions">
                  <button type="button" className="mk-btn mk-btn-light mk-btn-sm" onClick={() => setDetail(r)}>👥 Voir les membres</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mk-section-gap">
        <BackendUnavailable>la gestion des permissions et leur association aux rôles n'est pas encore exposée par un endpoint backend (les rôles ne sont ni modifiables ni supprimables via l'API).</BackendUnavailable>
      </div>

      <Modal open={modal} onClose={() => !saving && setModal(false)} title="Nouveau rôle" width={560}>
        <form onSubmit={submit}>
          <Alert message={formError} onClose={() => setFormError("")} />
          <FormFields
            values={form}
            onChange={(n, v) => setForm((f) => ({ ...f, [n]: v }))}
            fields={[
              { name: "nom", label: "Nom", required: true, placeholder: "Ex. Comptable" },
              { name: "code", label: "Code", required: true, placeholder: "Ex. COMPTABLE", help: "Converti en majuscules." },
              { name: "description", label: "Description", type: "textarea", full: true, rows: 3 },
            ]}
          />
          <FormActions onCancel={() => setModal(false)} saving={saving} submitLabel="Créer le rôle" />
        </form>
      </Modal>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail ? `Membres — ${detail.nom}` : ""} width={560}>
        {detailUsers.length === 0 ? (
          <EmptyState icon="👤" title="Aucun membre" text="Aucun utilisateur de l'établissement n'a ce rôle." />
        ) : (
          <ul className="mk-member-list">
            {detailUsers.map((u) => (
              <li key={u.id_utilisateur}>
                <Avatar text={fullName(u)} />
                <div><strong>{fullName(u)}</strong><small>{u.login} · {u.email}</small></div>
                <Badge tone={u.statut === "actif" ? "green" : "neutral"}>{u.statut}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </ModulePage>
  );
}
