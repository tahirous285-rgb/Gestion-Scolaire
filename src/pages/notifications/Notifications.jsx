import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, Badge, EmptyState, FormActions, FormFields, LoadingState, Modal, ModuleHeader, ModulePage,
  RefreshButton, SearchInput, StatCard, StatGrid, Tabs, Toolbar, loadAll, useAsyncData, useFlash,
} from "../../components/module/ModuleKit";
import { establishmentId, userId } from "../../services/apiClient";
import { getRoles, getUtilisateurs } from "../../services/administrationApi";
import { createNotification, getNotifications, markNotificationRead } from "../../services/communicationApi";
import { formatDateTime, fullName, groupBy, includesText } from "../pageUtils";
import "./Notifications.css";

const TYPES = [
  { value: "info", label: "Information", icon: "ℹ️", tone: "blue" },
  { value: "succes", label: "Succès", icon: "✅", tone: "green" },
  { value: "alerte", label: "Alerte", icon: "⚠️", tone: "orange" },
  { value: "urgent", label: "Urgent", icon: "🚨", tone: "red" },
  { value: "finance", label: "Finance", icon: "💰", tone: "purple" },
  { value: "pedagogie", label: "Pédagogie", icon: "📚", tone: "blue" },
];
const typeInfo = (t) => TYPES.find((x) => x.value === t) || { label: t || "Information", icon: "🔔", tone: "neutral" };

function dayBucket(value) {
  if (!value) return "Plus ancien";
  const d = new Date(value);
  const today = new Date();
  const diffDays = Math.floor((new Date(today.toDateString()) - new Date(d.toDateString())) / 86400000);
  if (diffDays <= 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return "Cette semaine";
  return "Plus ancien";
}

const EMPTY = { cible: "utilisateur", id_utilisateur: "", id_role: "", titre: "", contenu: "", type: "info", lien: "" };

export default function Notifications() {
  const me = userId();
  const idEtab = establishmentId();
  const navigate = useNavigate();
  const [tab, setTab] = useState("toutes");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [flash, showFlash, clearFlash] = useFlash();

  const { data, loading, error, setError, reload, setData } = useAsyncData(() =>
    loadAll({ notifications: () => getNotifications(me), utilisateurs: () => getUtilisateurs({ limit: 1000 }), roles: getRoles }),
  );
  const refs = data || { notifications: [], utilisateurs: [], roles: [] };
  const users = useMemo(() => refs.utilisateurs.filter((u) => !idEtab || u.id_etablissement === idEtab), [refs.utilisateurs, idEtab]);

  const all = [...refs.notifications].sort((a, b) => String(b.date_creation).localeCompare(String(a.date_creation)));
  const unread = all.filter((n) => !n.lue).length;
  const visible = all
    .filter((n) => tab === "toutes" || (tab === "non_lues" ? !n.lue : n.type === tab))
    .filter((n) => includesText([n.titre, n.contenu, n.type], search));
  const order = ["Aujourd'hui", "Hier", "Cette semaine", "Plus ancien"];
  const buckets = [...groupBy(visible, (n) => dayBucket(n.date_creation)).entries()].sort(([a], [b]) => order.indexOf(a) - order.indexOf(b));
  const usedTypes = [...new Set(all.map((n) => n.type).filter(Boolean))];

  function markLocal(ids) {
    const set = new Set(ids);
    setData((d) => ({ ...d, notifications: d.notifications.map((n) => (set.has(n.id_notification) ? { ...n, lue: true, date_lecture: new Date().toISOString() } : n)) }));
  }

  async function markRead(n) {
    if (n.lue) return;
    markLocal([n.id_notification]);
    try {
      await markNotificationRead(n.id_notification);
    } catch (err) {
      setError(err.message);
    }
  }

  async function markAll() {
    const pending = all.filter((n) => !n.lue).map((n) => n.id_notification);
    markLocal(pending);
    const results = await Promise.allSettled(pending.map((id) => markNotificationRead(id)));
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed) {
      setError(`${failed} notification(s) n'ont pas pu être marquées.`);
      await reload();
    } else showFlash("Toutes les notifications sont marquées comme lues.");
  }

  async function openLink(n) {
    await markRead(n);
    if (!n.lien) return;
    if (/^https?:\/\//.test(n.lien)) window.open(n.lien, "_blank", "noopener");
    else navigate(n.lien.startsWith("/") ? n.lien : `/${n.lien}`);
  }

  const recipients =
    form.cible === "tous" ? users : form.cible === "role" ? users.filter((u) => String(u.id_role) === String(form.id_role)) : users.filter((u) => String(u.id_utilisateur) === String(form.id_utilisateur));

  async function submit(event) {
    event.preventDefault();
    if (!recipients.length) return setFormError("Aucun destinataire ne correspond à la sélection.");
    try {
      setSaving(true);
      setFormError("");
      const results = await Promise.allSettled(
        recipients.map((u) =>
          createNotification({ id_etablissement: idEtab, id_utilisateur: u.id_utilisateur, titre: form.titre, contenu: form.contenu || null, type: form.type || null, lien: form.lien || null }),
        ),
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      setModal(false);
      showFlash(`Notification envoyée à ${recipients.length - failed} destinataire(s).`);
      if (failed) setError(`${failed} envoi(s) en échec.`);
      await reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModulePage>
      <ModuleHeader icon="🔔" title="Notifications" subtitle="Vos alertes et rappels, et l'envoi de notifications aux utilisateurs.">
        {unread > 0 && <button type="button" className="mk-btn mk-btn-light" onClick={markAll}>✓ Tout marquer comme lu</button>}
        <button type="button" className="mk-btn mk-btn-primary" onClick={() => { setForm(EMPTY); setFormError(""); setModal(true); }}>📨 Envoyer une notification</button>
      </ModuleHeader>

      <Alert message={error} onClose={() => setError("")} />
      <Alert message={flash} onClose={clearFlash} kind="success" />

      <StatGrid columns={3}>
        <StatCard icon="🔔" label="Mes notifications" value={all.length} />
        <StatCard icon="🆕" label="Non lues" value={unread} tone={unread ? "orange" : "green"} />
        <StatCard icon="📅" label="Reçues aujourd'hui" value={all.filter((n) => dayBucket(n.date_creation) === "Aujourd'hui").length} tone="purple" />
      </StatGrid>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "toutes", label: "Toutes", count: all.length },
          { value: "non_lues", label: "Non lues", count: unread },
          ...usedTypes.map((t) => ({ value: t, label: `${typeInfo(t).icon} ${typeInfo(t).label}` })),
        ]}
      />

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Titre, contenu..." />
        <RefreshButton onClick={reload} loading={loading} />
      </Toolbar>

      {loading ? (
        <div className="mk-table-card"><LoadingState /></div>
      ) : visible.length === 0 ? (
        <div className="mk-table-card"><EmptyState icon="🔕" title="Aucune notification" text={tab === "non_lues" ? "Vous êtes à jour !" : "Rien à afficher pour le moment."} /></div>
      ) : (
        <div className="mk-table-card notif-list">
          {buckets.map(([bucket, items]) => (
            <section key={bucket}>
              <h3>{bucket}</h3>
              {items.map((n) => {
                const t = typeInfo(n.type);
                return (
                  <div key={n.id_notification} className={`notif-item ${n.lue ? "" : "unread"}`} onClick={() => markRead(n)}>
                    <div className={`notif-icon tone-${t.tone}`}>{t.icon}</div>
                    <div className="notif-body">
                      <div className="notif-top">
                        <strong>{n.titre}</strong>
                        <Badge tone={t.tone}>{t.label}</Badge>
                      </div>
                      {n.contenu && <p>{n.contenu}</p>}
                      <div className="notif-meta">
                        <span>{formatDateTime(n.date_creation)}</span>
                        {n.lue && n.date_lecture && <span>· lue le {formatDateTime(n.date_lecture)}</span>}
                        {n.lien && <button type="button" className="notif-link" onClick={(e) => { e.stopPropagation(); openLink(n); }}>Ouvrir →</button>}
                      </div>
                    </div>
                    {!n.lue && <span className="notif-dot" title="Non lue" />}
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => !saving && setModal(false)} title="Envoyer une notification" width={640}>
        <form onSubmit={submit}>
          <Alert message={formError} onClose={() => setFormError("")} />
          <FormFields
            values={form}
            onChange={(n, v) => setForm((f) => ({ ...f, [n]: v }))}
            fields={[
              { name: "cible", label: "Destinataires", type: "select", required: true, options: [{ value: "utilisateur", label: "Un utilisateur" }, { value: "role", label: "Tous les utilisateurs d'un rôle" }, { value: "tous", label: "Tous les utilisateurs de l'établissement" }] },
              form.cible === "utilisateur" && { name: "id_utilisateur", label: "Utilisateur", type: "select", required: true, options: users.map((u) => ({ value: String(u.id_utilisateur), label: `${fullName(u)}${u.id_utilisateur === me ? " (vous)" : ""}` })) },
              form.cible === "role" && { name: "id_role", label: "Rôle", type: "select", required: true, options: refs.roles.map((r) => ({ value: String(r.id_role), label: r.nom })) },
              form.cible === "tous" && { name: "info", type: "section", label: `${users.length} destinataire(s)` },
              { name: "type", label: "Type", type: "select", options: TYPES.map((t) => ({ value: t.value, label: `${t.icon} ${t.label}` })) },
              { name: "lien", label: "Lien (optionnel)", placeholder: "/paiements ou https://...", help: "Page interne ou URL externe." },
              { name: "titre", label: "Titre", required: true, full: true },
              { name: "contenu", label: "Contenu", type: "textarea", rows: 4, full: true },
            ]}
          />
          {form.cible === "role" && form.id_role && <p className="mk-muted mk-note">{recipients.length} destinataire(s) seront notifiés.</p>}
          <FormActions onCancel={() => setModal(false)} saving={saving} submitLabel={`Envoyer${recipients.length > 1 ? ` (${recipients.length})` : ""}`} />
        </form>
      </Modal>
    </ModulePage>
  );
}
