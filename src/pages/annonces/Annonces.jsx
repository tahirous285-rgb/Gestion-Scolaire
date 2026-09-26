import { useMemo, useState } from "react";
import {
  Alert, Avatar, Badge, EmptyState, FormActions, FormFields, LoadingState, Modal, ModuleHeader, ModulePage,
  RefreshButton, SearchInput, StatCard, StatGrid, Tabs, Toolbar, loadAll, useAsyncData, useFlash,
} from "../../components/module/ModuleKit";
import { establishmentId, userId } from "../../services/apiClient";
import { getUtilisateurs } from "../../services/administrationApi";
import { createAnnonce, getAnnonces } from "../../services/communicationApi";
import { formatDateTime, fullName, includesText, mapBy } from "../pageUtils";
import "./Annonces.css";

function etatAnnonce(a, now = new Date()) {
  if (!a.publiee) return { key: "brouillon", label: "Brouillon", tone: "neutral" };
  if (a.date_expiration && new Date(a.date_expiration) < now) return { key: "expiree", label: "Expirée", tone: "red" };
  return { key: "active", label: "Publiée", tone: "green" };
}

function relative(value) {
  if (!value) return "";
  const diff = (Date.now() - new Date(value).getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) return `il y a ${Math.floor(diff / 86400)} j`;
  return formatDateTime(value);
}

const EMPTY = { titre: "", contenu: "", date_expiration: "", publiee: true };

export default function Annonces() {
  const idEtab = establishmentId();
  const [tab, setTab] = useState("active");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [flash, showFlash, clearFlash] = useFlash();

  const { data, loading, error, setError, reload } = useAsyncData(() =>
    loadAll({ annonces: () => getAnnonces(idEtab), utilisateurs: () => getUtilisateurs({ limit: 1000 }) }),
  );
  const refs = data || { annonces: [], utilisateurs: [] };
  const usersMap = useMemo(() => mapBy(refs.utilisateurs, "id_utilisateur"), [refs.utilisateurs]);
  const authorName = (id) => (usersMap.get(String(id)) ? fullName(usersMap.get(String(id))) : `Utilisateur #${id}`);

  const all = useMemo(
    () => refs.annonces.map((a) => ({ ...a, etat: etatAnnonce(a) })).sort((a, b) => String(b.date_publication).localeCompare(String(a.date_publication))),
    [refs.annonces],
  );
  const counts = all.reduce((acc, a) => ({ ...acc, [a.etat.key]: (acc[a.etat.key] || 0) + 1 }), {});
  const visible = all.filter((a) => tab === "toutes" || a.etat.key === tab).filter((a) => includesText([a.titre, a.contenu, authorName(a.id_auteur)], search));

  function openCreate(prefill = EMPTY) {
    setForm({ ...EMPTY, ...prefill });
    setFormError("");
    setModal(true);
  }

  async function submit(event) {
    event.preventDefault();
    if (form.date_expiration && new Date(form.date_expiration) < new Date()) return setFormError("La date d'expiration doit être dans le futur.");
    try {
      setSaving(true);
      setFormError("");
      await createAnnonce({
        id_etablissement: idEtab,
        id_auteur: userId(),
        titre: form.titre.trim(),
        contenu: form.contenu.trim(),
        date_expiration: form.date_expiration || null,
        publiee: Boolean(form.publiee),
      });
      showFlash(form.publiee ? "Annonce publiée." : "Brouillon enregistré.");
      setModal(false);
      setTab(form.publiee ? "active" : "brouillon");
      await reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModulePage>
      <ModuleHeader icon="📣" title="Annonces" subtitle="Informations diffusées à la communauté scolaire.">
        <button type="button" className="mk-btn mk-btn-primary" onClick={() => openCreate()}>＋ Nouvelle annonce</button>
      </ModuleHeader>

      <Alert message={error} onClose={() => setError("")} />
      <Alert message={flash} onClose={clearFlash} kind="success" />

      <StatGrid>
        <StatCard icon="📣" label="Annonces" value={all.length} />
        <StatCard icon="✅" label="En ligne" value={counts.active || 0} tone="green" />
        <StatCard icon="📝" label="Brouillons" value={counts.brouillon || 0} tone="orange" />
        <StatCard icon="⌛" label="Expirées" value={counts.expiree || 0} tone="red" />
      </StatGrid>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "active", label: "En ligne", count: counts.active || 0 },
          { value: "brouillon", label: "Brouillons", count: counts.brouillon || 0 },
          { value: "expiree", label: "Expirées", count: counts.expiree || 0 },
          { value: "toutes", label: "Toutes", count: all.length },
        ]}
      />

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Titre, contenu, auteur..." />
        <RefreshButton onClick={reload} loading={loading} />
      </Toolbar>

      {loading ? (
        <div className="mk-table-card"><LoadingState /></div>
      ) : visible.length === 0 ? (
        <div className="mk-table-card">
          <EmptyState icon="📣" title="Aucune annonce" text={tab === "active" ? "Aucune annonce en ligne actuellement." : "Rien à afficher dans cette catégorie."}>
            <button type="button" className="mk-btn mk-btn-primary" onClick={() => openCreate()}>Rédiger une annonce</button>
          </EmptyState>
        </div>
      ) : (
        <div className="annonce-feed">
          {visible.map((a) => {
            const long = a.contenu.length > 280;
            const open = expanded[a.id_annonce];
            return (
              <article key={a.id_annonce} className={`annonce-card etat-${a.etat.key}`}>
                <header>
                  <Avatar text={authorName(a.id_auteur)} tone="purple" />
                  <div className="annonce-author">
                    <strong>{authorName(a.id_auteur)}</strong>
                    <small title={formatDateTime(a.date_publication)}>{relative(a.date_publication)}</small>
                  </div>
                  <Badge tone={a.etat.tone}>{a.etat.label}</Badge>
                </header>
                <h3>{a.titre}</h3>
                <p className={long && !open ? "clamped" : ""}>{a.contenu}</p>
                {long && (
                  <button type="button" className="annonce-more" onClick={() => setExpanded((e) => ({ ...e, [a.id_annonce]: !open }))}>
                    {open ? "Réduire" : "Lire la suite"}
                  </button>
                )}
                <footer>
                  <span className="mk-muted">{a.date_expiration ? `${a.etat.key === "expiree" ? "Expirée le" : "Expire le"} ${formatDateTime(a.date_expiration)}` : "Sans date d'expiration"}</span>
                  <button type="button" className="mk-btn mk-btn-light mk-btn-sm" onClick={() => openCreate({ titre: a.titre, contenu: a.contenu, publiee: true })} title="Créer une nouvelle annonce à partir de celle-ci">
                    {a.etat.key === "brouillon" ? "📤 Publier une copie" : "⧉ Dupliquer"}
                  </button>
                </footer>
              </article>
            );
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => !saving && setModal(false)} title="Nouvelle annonce" width={640}>
        <form onSubmit={submit}>
          <Alert message={formError} onClose={() => setFormError("")} />
          <FormFields
            values={form}
            onChange={(n, v) => setForm((f) => ({ ...f, [n]: v }))}
            fields={[
              { name: "titre", label: "Titre", required: true, full: true, placeholder: "Ex. Réunion des parents d'élèves" },
              { name: "contenu", label: "Contenu", type: "textarea", rows: 7, required: true, full: true },
              { name: "date_expiration", label: "Date d'expiration", type: "datetime-local", help: "Laisser vide pour une annonce permanente." },
              { name: "publiee", label: "Publier immédiatement", type: "checkbox", help: "Sinon, l'annonce est enregistrée comme brouillon." },
            ]}
          />
          <p className="mk-muted mk-note">ℹ️ L'API ne permet pas encore de modifier une annonce après sa création.</p>
          <FormActions onCancel={() => setModal(false)} saving={saving} submitLabel={form.publiee ? "Publier" : "Enregistrer le brouillon"} />
        </form>
      </Modal>
    </ModulePage>
  );
}
