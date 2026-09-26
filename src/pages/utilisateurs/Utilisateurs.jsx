import { useMemo, useState } from "react";
import {
  Alert, Avatar, Badge, DataTable, DetailGrid, FilterSelect, FormActions, FormFields, MenuItem, Modal, ModuleHeader,
  ModulePage, RefreshButton, SearchInput, StatCard, StatGrid, Toolbar, loadAll, useAsyncData, useFlash,
} from "../../components/module/ModuleKit";
import { establishmentId, userId } from "../../services/apiClient";
import {
  createUtilisateur, deleteUtilisateur, getEtablissements, getRoles, getUtilisateurs, updateUtilisateur,
} from "../../services/administrationApi";
import { cleanPayload, formatDateTime, fullName, includesText, mapBy } from "../pageUtils";

const STATUTS_UTILISATEUR = [
  { value: "actif", label: "Actif", tone: "green" },
  { value: "inactif", label: "Inactif", tone: "neutral" },
  { value: "suspendu", label: "Suspendu", tone: "red" },
];
const statutInfo = (s) => STATUTS_UTILISATEUR.find((x) => x.value === s) || { label: s || "—", tone: "neutral" };
const ROLE_TONES = ["blue", "purple", "green", "orange", "red", "yellow"];

const EMPTY = { id_etablissement: "", id_role: "", nom: "", prenom: "", email: "", telephone: "", login: "", statut: "actif", mot_de_passe: "", confirmation: "" };

export default function Utilisateurs() {
  const currentEtab = establishmentId();
  const me = userId();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statutFilter, setStatutFilter] = useState("");
  const [etabFilter, setEtabFilter] = useState(currentEtab ? String(currentEtab) : "");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [flash, showFlash, clearFlash] = useFlash();

  const { data, loading, error, setError, reload } = useAsyncData(() =>
    loadAll({ utilisateurs: () => getUtilisateurs({ limit: 1000 }), roles: getRoles, etablissements: () => getEtablissements() }),
  );
  const refs = data || { utilisateurs: [], roles: [], etablissements: [] };
  const rolesMap = useMemo(() => mapBy(refs.roles, "id_role"), [refs.roles]);
  const etabMap = useMemo(() => mapBy(refs.etablissements, "id_etablissement"), [refs.etablissements]);
  const roleTone = (id) => ROLE_TONES[refs.roles.findIndex((r) => r.id_role === id) % ROLE_TONES.length] || "neutral";

  const scope = refs.utilisateurs.filter((u) => !etabFilter || String(u.id_etablissement) === etabFilter);
  const rows = scope
    .filter((u) => !roleFilter || String(u.id_role) === roleFilter)
    .filter((u) => !statutFilter || u.statut === statutFilter)
    .filter((u) => includesText([u.nom, u.prenom, u.login, u.email, u.telephone], search))
    .sort((a, b) => fullName(a).localeCompare(fullName(b)));

  function open(mode, user = null) {
    setForm(
      user
        ? { ...EMPTY, ...Object.fromEntries(Object.entries(user).map(([k, v]) => [k, v ?? ""])) }
        : { ...EMPTY, id_etablissement: etabFilter || currentEtab || "", id_role: refs.roles[0]?.id_role ?? "" },
    );
    setFormError("");
    setModal({ mode, user });
  }

  async function submit(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setFormError("");
      if (modal.mode === "edit") {
        const { nom, prenom, email, telephone, statut, id_role } = form;
        await updateUtilisateur(modal.user.id_utilisateur, cleanPayload({ nom, prenom, email, telephone, statut, id_role: Number(id_role) }));
        showFlash("Utilisateur mis à jour.");
      } else {
        if (form.mot_de_passe.length < 6) throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
        if (form.mot_de_passe !== form.confirmation) throw new Error("La confirmation du mot de passe ne correspond pas.");
        const { confirmation: _c, ...rest } = form;
        await createUtilisateur(cleanPayload({ ...rest, id_etablissement: Number(rest.id_etablissement), id_role: Number(rest.id_role) }));
        showFlash(`Compte « ${form.login} » créé.`);
      }
      setModal(null);
      await reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function setStatut(user, statut) {
    if (user.id_utilisateur === me && statut !== "actif") return setError("Vous ne pouvez pas désactiver votre propre compte.");
    try {
      await updateUtilisateur(user.id_utilisateur, { statut });
      showFlash(`${fullName(user)} : statut « ${statutInfo(statut).label} ».`);
      await reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(user) {
    if (user.id_utilisateur === me) return setError("Vous ne pouvez pas supprimer votre propre compte.");
    if (!window.confirm(`Supprimer le compte de ${fullName(user)} ?`)) return;
    try {
      await deleteUtilisateur(user.id_utilisateur);
      showFlash("Compte supprimé.");
      await reload();
    } catch (err) {
      setError(err.message);
    }
  }

  const isEdit = modal?.mode === "edit";
  const fields = [
    { name: "section-id", type: "section", label: "Identité" },
    { name: "prenom", label: "Prénom", required: true },
    { name: "nom", label: "Nom", required: true },
    { name: "email", label: "E-mail", type: "email", required: true },
    { name: "telephone", label: "Téléphone" },
    { name: "section-acces", type: "section", label: "Accès" },
    !isEdit && { name: "id_etablissement", label: "Établissement", type: "select", required: true, options: refs.etablissements.map((e) => ({ value: e.id_etablissement, label: e.nom })) },
    { name: "id_role", label: "Rôle", type: "select", required: true, options: refs.roles.map((r) => ({ value: r.id_role, label: r.nom })) },
    { name: "statut", label: "Statut", type: "select", required: true, options: STATUTS_UTILISATEUR, help: "Seuls les comptes actifs peuvent se connecter." },
    !isEdit && { name: "login", label: "Identifiant de connexion", required: true },
    !isEdit && { name: "mot_de_passe", label: "Mot de passe", type: "password", required: true, help: "6 caractères minimum." },
    !isEdit && { name: "confirmation", label: "Confirmation", type: "password", required: true },
  ];

  return (
    <ModulePage>
      <ModuleHeader icon="👥" title="Utilisateurs" subtitle="Comptes d'accès, rôles et statuts des utilisateurs.">
        <button type="button" className="mk-btn mk-btn-primary" onClick={() => open("create")}>＋ Nouvel utilisateur</button>
      </ModuleHeader>

      <Alert message={error} onClose={() => setError("")} />
      <Alert message={flash} onClose={clearFlash} kind="success" />

      <StatGrid>
        <StatCard icon="👥" label="Comptes" value={scope.length} hint={etabFilter ? etabMap.get(etabFilter)?.nom : "Tous établissements"} />
        <StatCard icon="✅" label="Actifs" value={scope.filter((u) => u.statut === "actif").length} tone="green" />
        <StatCard icon="⏸️" label="Inactifs / suspendus" value={scope.filter((u) => u.statut !== "actif").length} tone="orange" />
        <StatCard icon="🛡️" label="Rôles utilisés" value={new Set(scope.map((u) => u.id_role)).size} tone="purple" />
      </StatGrid>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Nom, identifiant, e-mail..." />
        <FilterSelect label="Établissement" value={etabFilter} onChange={setEtabFilter} placeholder="Tous" options={refs.etablissements.map((e) => ({ value: String(e.id_etablissement), label: e.nom }))} />
        <FilterSelect label="Rôle" value={roleFilter} onChange={setRoleFilter} placeholder="Tous" options={refs.roles.map((r) => ({ value: String(r.id_role), label: r.nom }))} />
        <FilterSelect label="Statut" value={statutFilter} onChange={setStatutFilter} placeholder="Tous" options={STATUTS_UTILISATEUR} />
        <RefreshButton onClick={reload} loading={loading} />
      </Toolbar>

      <DataTable
        loading={loading}
        rows={rows}
        rowKey="id_utilisateur"
        emptyIcon="👥"
        emptyTitle="Aucun utilisateur"
        emptyText="Aucun compte ne correspond aux filtres."
        onRowClick={(u) => open("view", u)}
        rowClassName={(u) => (u.id_utilisateur === me ? "row-highlight" : "")}
        columns={[
          {
            key: "nom",
            label: "Utilisateur",
            render: (u) => (
              <div className="mk-cell-main">
                <Avatar text={fullName(u)} tone={roleTone(u.id_role)} />
                <div>
                  <strong>{fullName(u)}{u.id_utilisateur === me && <span className="mk-muted"> (vous)</span>}</strong>
                  <small>{u.email}</small>
                </div>
              </div>
            ),
          },
          { key: "login", label: "Identifiant", render: (u) => <span className="mk-id">{u.login}</span> },
          { key: "id_role", label: "Rôle", render: (u) => <Badge tone={roleTone(u.id_role)}>{rolesMap.get(String(u.id_role))?.nom || `Rôle #${u.id_role}`}</Badge> },
          { key: "telephone", label: "Téléphone" },
          !etabFilter && { key: "id_etablissement", label: "Établissement", render: (u) => etabMap.get(String(u.id_etablissement))?.nom || `#${u.id_etablissement}` },
          { key: "statut", label: "Statut", render: (u) => <Badge tone={statutInfo(u.statut).tone}>{statutInfo(u.statut).label}</Badge> },
          { key: "date_creation", label: "Créé le", render: (u) => formatDateTime(u.date_creation) },
        ].filter(Boolean)}
        actions={(u, close) => (
          <>
            <MenuItem icon="👁️" onClick={() => { close(); open("view", u); }}>Voir</MenuItem>
            <MenuItem icon="✏️" onClick={() => { close(); open("edit", u); }}>Modifier</MenuItem>
            {u.statut !== "actif" && <MenuItem icon="▶️" onClick={() => { close(); setStatut(u, "actif"); }}>Activer</MenuItem>}
            {u.statut === "actif" && <MenuItem icon="⏸️" onClick={() => { close(); setStatut(u, "inactif"); }}>Désactiver</MenuItem>}
            {u.statut !== "suspendu" && <MenuItem icon="⛔" onClick={() => { close(); setStatut(u, "suspendu"); }}>Suspendre</MenuItem>}
            <MenuItem icon="🗑️" danger onClick={() => { close(); remove(u); }}>Supprimer</MenuItem>
          </>
        )}
      />

      <Modal
        open={Boolean(modal)}
        onClose={() => !saving && setModal(null)}
        title={modal?.mode === "view" ? fullName(modal.user) : isEdit ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
        width={680}
      >
        {modal?.mode === "view" ? (
          <>
            <DetailGrid
              items={[
                { label: "Identifiant", value: modal.user.login },
                { label: "Rôle", value: rolesMap.get(String(modal.user.id_role))?.nom },
                { label: "E-mail", value: modal.user.email },
                { label: "Téléphone", value: modal.user.telephone },
                { label: "Statut", value: <Badge tone={statutInfo(modal.user.statut).tone}>{statutInfo(modal.user.statut).label}</Badge> },
                { label: "Établissement", value: etabMap.get(String(modal.user.id_etablissement))?.nom },
                { label: "Créé le", value: formatDateTime(modal.user.date_creation) },
                { label: "Modifié le", value: formatDateTime(modal.user.date_modification) },
              ]}
            />
            <div className="mk-form-actions">
              <button type="button" className="mk-btn mk-btn-light" onClick={() => setModal(null)}>Fermer</button>
              <button type="button" className="mk-btn mk-btn-primary" onClick={() => open("edit", modal.user)}>✏️ Modifier</button>
            </div>
          </>
        ) : (
          <form onSubmit={submit}>
            <Alert message={formError} onClose={() => setFormError("")} />
            <FormFields fields={fields} values={form} onChange={(n, v) => setForm((f) => ({ ...f, [n]: v }))} />
            {isEdit && <p className="mk-muted mk-note">L'identifiant et le mot de passe ne sont pas modifiables via l'API actuelle.</p>}
            <FormActions onCancel={() => setModal(null)} saving={saving} submitLabel={isEdit ? "Enregistrer" : "Créer le compte"} />
          </form>
        )}
      </Modal>
    </ModulePage>
  );
}
