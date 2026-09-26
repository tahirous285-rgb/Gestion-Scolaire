import { useMemo, useState } from "react";
import {
  Alert, Avatar, Badge, EmptyState, FormActions, FormFields, LoadingState, Modal, ModuleHeader, ModulePage,
  RefreshButton, SearchInput, Tabs, loadAll, useAsyncData, useFlash,
} from "../../components/module/ModuleKit";
import { establishmentId, userId } from "../../services/apiClient";
import { getUtilisateurs } from "../../services/administrationApi";
import { createMessage, getMessages, markMessageRead } from "../../services/communicationApi";
import { formatDateTime, fullName, includesText, mapBy } from "../pageUtils";
import "./Messages.css";

function shortDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (d.toDateString() === new Date().toDateString()) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

const EMPTY = { id_destinataire: "", objet: "", contenu: "" };

export default function Messages() {
  const me = userId();
  const idEtab = establishmentId();
  const [folder, setFolder] = useState("recus");
  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [flash, showFlash, clearFlash] = useFlash();

  const { data, loading, error, setError, reload, setData } = useAsyncData(() =>
    loadAll({
      recus: () => getMessages({ id_destinataire: me }),
      envoyes: () => getMessages({ id_expediteur: me }),
      utilisateurs: () => getUtilisateurs({ limit: 1000 }),
    }),
  );
  const refs = data || { recus: [], envoyes: [], utilisateurs: [] };
  const usersMap = useMemo(() => mapBy(refs.utilisateurs, "id_utilisateur"), [refs.utilisateurs]);
  const nameOf = (id) => (usersMap.get(String(id)) ? fullName(usersMap.get(String(id))) : `Utilisateur #${id}`);
  const contacts = refs.utilisateurs.filter((u) => u.id_utilisateur !== me && (!idEtab || u.id_etablissement === idEtab)).sort((a, b) => fullName(a).localeCompare(fullName(b)));

  const unread = refs.recus.filter((m) => !m.lu).length;
  const list = (folder === "recus" ? refs.recus : refs.envoyes)
    .filter((m) => !unreadOnly || folder !== "recus" || !m.lu)
    .filter((m) => includesText([m.objet, m.contenu, nameOf(folder === "recus" ? m.id_expediteur : m.id_destinataire)], search))
    .sort((a, b) => String(b.date_envoi).localeCompare(String(a.date_envoi)));
  const selected = list.find((m) => m.id_message === selectedId) || null;

  async function openMessage(m) {
    setSelectedId(m.id_message);
    if (folder === "recus" && !m.lu) {
      setData((d) => ({ ...d, recus: d.recus.map((x) => (x.id_message === m.id_message ? { ...x, lu: true, date_lecture: new Date().toISOString() } : x)) }));
      try {
        await markMessageRead(m.id_message);
      } catch (err) {
        setError(err.message);
      }
    }
  }

  async function markAllRead() {
    const pending = refs.recus.filter((m) => !m.lu);
    await Promise.allSettled(pending.map((m) => markMessageRead(m.id_message)));
    showFlash(`${pending.length} message(s) marqué(s) comme lu(s).`);
    await reload();
  }

  function compose(prefill = {}) {
    setForm({ ...EMPTY, ...prefill });
    setFormError("");
    setModal(true);
  }

  function reply(m) {
    const objet = m.objet ? (m.objet.startsWith("RE :") ? m.objet : `RE : ${m.objet}`) : "RE :";
    const quote = `\n\n---- Le ${formatDateTime(m.date_envoi)}, ${nameOf(m.id_expediteur)} a écrit :\n${m.contenu.split("\n").map((l) => `> ${l}`).join("\n")}`;
    compose({ id_destinataire: String(m.id_expediteur), objet, contenu: quote });
  }

  async function submit(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setFormError("");
      await createMessage({ id_etablissement: idEtab, id_expediteur: me, id_destinataire: Number(form.id_destinataire), objet: form.objet || null, contenu: form.contenu });
      showFlash(`Message envoyé à ${nameOf(form.id_destinataire)}.`);
      setModal(false);
      setFolder("envoyes");
      await reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const other = (m) => (folder === "recus" ? m.id_expediteur : m.id_destinataire);

  return (
    <ModulePage>
      <ModuleHeader icon="✉️" title="Messagerie" subtitle="Échanges internes entre les utilisateurs de l'établissement.">
        {unread > 0 && <button type="button" className="mk-btn mk-btn-light" onClick={markAllRead}>✓ Tout marquer comme lu</button>}
        <button type="button" className="mk-btn mk-btn-primary" onClick={() => compose()}>✏️ Nouveau message</button>
      </ModuleHeader>

      <Alert message={error} onClose={() => setError("")} />
      <Alert message={flash} onClose={clearFlash} kind="success" />

      <Tabs
        value={folder}
        onChange={(v) => { setFolder(v); setSelectedId(null); }}
        tabs={[
          { value: "recus", label: "📥 Boîte de réception", count: unread || undefined },
          { value: "envoyes", label: "📤 Envoyés", count: refs.envoyes.length },
        ]}
      />

      <div className="msg-layout">
        <aside className="msg-list">
          <div className="msg-list-tools">
            <SearchInput value={search} onChange={setSearch} placeholder="Rechercher..." />
            <div className="msg-list-row">
              {folder === "recus" ? (
                <label className="mk-check"><input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} /><span>Non lus uniquement</span></label>
              ) : <span className="mk-muted">{list.length} message(s)</span>}
              <RefreshButton onClick={reload} loading={loading} />
            </div>
          </div>
          {loading ? (
            <LoadingState />
          ) : list.length === 0 ? (
            <EmptyState icon={folder === "recus" ? "📭" : "📤"} title="Aucun message" text={folder === "recus" ? "Votre boîte de réception est vide." : "Vous n'avez envoyé aucun message."} />
          ) : (
            <ul>
              {list.map((m) => (
                <li key={m.id_message}>
                  <button type="button" className={`msg-item ${selectedId === m.id_message ? "active" : ""} ${folder === "recus" && !m.lu ? "unread" : ""}`} onClick={() => openMessage(m)}>
                    <Avatar text={nameOf(other(m))} tone={folder === "recus" ? "blue" : "green"} />
                    <div className="msg-item-body">
                      <div className="msg-item-top"><strong>{folder === "envoyes" && "À : "}{nameOf(other(m))}</strong><time>{shortDate(m.date_envoi)}</time></div>
                      <div className="msg-item-subject">{m.objet || "(sans objet)"}</div>
                      <div className="msg-item-preview">{m.contenu}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="msg-reader">
          {!selected ? (
            <EmptyState icon="✉️" title="Aucun message sélectionné" text="Choisissez un message dans la liste pour le lire." />
          ) : (
            <>
              <header>
                <h2>{selected.objet || "(sans objet)"}</h2>
                <div className="msg-reader-meta">
                  <Avatar text={nameOf(selected.id_expediteur)} />
                  <div>
                    <strong>{nameOf(selected.id_expediteur)}</strong>
                    <small>À : {nameOf(selected.id_destinataire)} · {formatDateTime(selected.date_envoi)}</small>
                  </div>
                  {folder === "envoyes" && (
                    <Badge tone={selected.lu ? "green" : "neutral"}>{selected.lu ? `Lu${selected.date_lecture ? ` le ${formatDateTime(selected.date_lecture)}` : ""}` : "Non lu"}</Badge>
                  )}
                </div>
              </header>
              <div className="msg-reader-body">{selected.contenu}</div>
              <footer>
                {folder === "recus" ? (
                  <button type="button" className="mk-btn mk-btn-primary" onClick={() => reply(selected)}>↩️ Répondre</button>
                ) : (
                  <button type="button" className="mk-btn mk-btn-light" onClick={() => compose({ id_destinataire: String(selected.id_destinataire), objet: selected.objet || "" })}>✏️ Écrire à nouveau</button>
                )}
              </footer>
            </>
          )}
        </section>
      </div>

      <Modal open={modal} onClose={() => !saving && setModal(false)} title="Nouveau message" width={640}>
        <form onSubmit={submit}>
          <Alert message={formError} onClose={() => setFormError("")} />
          <FormFields
            values={form}
            onChange={(n, v) => setForm((f) => ({ ...f, [n]: v }))}
            fields={[
              { name: "id_destinataire", label: "Destinataire", type: "select", required: true, full: true, options: contacts.map((u) => ({ value: String(u.id_utilisateur), label: `${fullName(u)} (${u.login})` })) },
              { name: "objet", label: "Objet", full: true },
              { name: "contenu", label: "Message", type: "textarea", rows: 8, required: true, full: true },
            ]}
          />
          <FormActions onCancel={() => setModal(false)} saving={saving} submitLabel="Envoyer" />
        </form>
      </Modal>
    </ModulePage>
  );
}
