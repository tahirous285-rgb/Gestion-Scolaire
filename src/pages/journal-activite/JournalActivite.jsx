import { useMemo, useState } from "react";
import {
  Alert, Avatar, Badge, DetailGrid, EmptyState, FilterSelect, FormActions, FormFields, LoadingState, Modal,
  ModuleHeader, ModulePage, RefreshButton, SearchInput, StatCard, StatGrid, Toolbar, loadAll, useAsyncData, useFlash,
} from "../../components/module/ModuleKit";
import { establishmentId, userId } from "../../services/apiClient";
import { createJournalEntry, getJournal, getUtilisateurs } from "../../services/administrationApi";
import { cleanPayload, fullName, groupBy, includesText, mapBy, toNumberOrNull } from "../pageUtils";
import "./JournalActivite.css";

const LIMITS = [20, 50, 100, 250, 500];

function actionTone(action = "") {
  const a = action.toLowerCase();
  if (/(suppr|delete|annul|rejet)/.test(a)) return "red";
  if (/(cr[ée]|ajout|insert|create)/.test(a)) return "green";
  if (/(modif|update|mise|edit)/.test(a)) return "orange";
  if (/(connex|login|auth)/.test(a)) return "purple";
  return "blue";
}

const dayKey = (value) => (value ? String(value).slice(0, 10) : "inconnu");
function dayLabel(key) {
  if (key === "inconnu") return "Date inconnue";
  const d = new Date(`${key}T00:00:00`);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
const timeLabel = (value) => (value ? new Date(value).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "");

const EMPTY = { action: "", module: "", table_cible: "", id_cible: "", ancienne_valeur: "", nouvelle_valeur: "", adresse_ip: "" };

export default function JournalActivite() {
  const idEtab = establishmentId();
  const [limit, setLimit] = useState("100");
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [detail, setDetail] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [flash, showFlash, clearFlash] = useFlash();

  const { data, loading, error, setError, reload } = useAsyncData(
    () => loadAll({ journal: () => getJournal({ idEtablissement: idEtab, limit: Number(limit) }), utilisateurs: () => getUtilisateurs({ limit: 1000 }) }),
    [limit],
  );
  const refs = data || { journal: [], utilisateurs: [] };
  const usersMap = useMemo(() => mapBy(refs.utilisateurs, "id_utilisateur"), [refs.utilisateurs]);
  const userName = (id) => (id ? (usersMap.get(String(id)) ? fullName(usersMap.get(String(id))) : `Utilisateur #${id}`) : "Système");

  const entries = refs.journal
    .filter((e) => !moduleFilter || (e.module || "—") === moduleFilter)
    .filter((e) => !userFilter || String(e.id_utilisateur ?? "") === userFilter)
    .filter((e) => includesText([e.action, e.module, e.table_cible, e.adresse_ip, userName(e.id_utilisateur)], search))
    .sort((a, b) => String(b.date_action).localeCompare(String(a.date_action)));
  const days = [...groupBy(entries, (e) => dayKey(e.date_action)).entries()];

  const modules = [...new Set(refs.journal.map((e) => e.module || "—"))].sort();
  const actors = [...new Set(refs.journal.map((e) => e.id_utilisateur).filter(Boolean))];
  const todayCount = refs.journal.filter((e) => dayKey(e.date_action) === new Date().toISOString().slice(0, 10)).length;

  async function submit(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setFormError("");
      await createJournalEntry(cleanPayload({ ...form, id_cible: toNumberOrNull(form.id_cible), id_etablissement: idEtab, id_utilisateur: userId() }));
      showFlash("Entrée ajoutée au journal.");
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
      <ModuleHeader icon="🧾" title="Journal d'activité" subtitle="Traçabilité des opérations effectuées dans l'établissement.">
        <button type="button" className="mk-btn mk-btn-light" onClick={() => { setForm(EMPTY); setFormError(""); setModal(true); }}>＋ Entrée manuelle</button>
      </ModuleHeader>

      <Alert message={error} onClose={() => setError("")} />
      <Alert message={flash} onClose={clearFlash} kind="success" />

      <StatGrid>
        <StatCard icon="🧾" label="Entrées chargées" value={refs.journal.length} hint={`${limit} dernières max.`} />
        <StatCard icon="📅" label="Aujourd'hui" value={todayCount} tone="green" />
        <StatCard icon="🧩" label="Modules concernés" value={modules.length} tone="purple" />
        <StatCard icon="👤" label="Utilisateurs actifs" value={actors.length} tone="orange" />
      </StatGrid>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Action, module, table, IP..." />
        <FilterSelect label="Module" value={moduleFilter} onChange={setModuleFilter} placeholder="Tous" options={modules.map((m) => ({ value: m, label: m }))} />
        <FilterSelect label="Utilisateur" value={userFilter} onChange={setUserFilter} placeholder="Tous" options={actors.map((id) => ({ value: String(id), label: userName(id) }))} />
        <FilterSelect label="Afficher" value={limit} onChange={(v) => setLimit(v || "100")} placeholder="100" options={LIMITS.map((l) => ({ value: String(l), label: `${l} dernières` }))} />
        <RefreshButton onClick={reload} loading={loading} />
      </Toolbar>

      {loading ? (
        <div className="mk-table-card"><LoadingState /></div>
      ) : entries.length === 0 ? (
        <div className="mk-table-card"><EmptyState icon="🧾" title="Aucune activité" text="Aucune entrée ne correspond aux filtres." /></div>
      ) : (
        <div className="mk-table-card journal-timeline">
          {days.map(([key, items]) => (
            <section key={key} className="journal-day">
              <h3>{dayLabel(key)} <span className="mk-muted">· {items.length} opération{items.length > 1 ? "s" : ""}</span></h3>
              <ol>
                {items.map((e) => (
                  <li key={e.id_journal} className={`journal-item tone-${actionTone(e.action)}`} onClick={() => setDetail(e)}>
                    <span className="journal-dot" />
                    <span className="journal-time">{timeLabel(e.date_action)}</span>
                    <div className="journal-body">
                      <div className="journal-line">
                        <strong>{e.action}</strong>
                        {e.module && <Badge tone={actionTone(e.action)}>{e.module}</Badge>}
                        {e.table_cible && <span className="mk-id">{e.table_cible}{e.id_cible ? ` #${e.id_cible}` : ""}</span>}
                      </div>
                      <div className="journal-meta">
                        <Avatar text={userName(e.id_utilisateur)} />
                        <span>{userName(e.id_utilisateur)}</span>
                        {e.adresse_ip && <span className="mk-muted">· {e.adresse_ip}</span>}
                        {(e.ancienne_valeur || e.nouvelle_valeur) && <span className="mk-muted">· détails disponibles</span>}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.action || ""} width={640}>
        {detail && (
          <>
            <DetailGrid
              items={[
                { label: "Date", value: detail.date_action ? new Date(detail.date_action).toLocaleString("fr-FR") : null },
                { label: "Utilisateur", value: userName(detail.id_utilisateur) },
                { label: "Module", value: detail.module },
                { label: "Cible", value: detail.table_cible ? `${detail.table_cible}${detail.id_cible ? ` #${detail.id_cible}` : ""}` : null },
                { label: "Adresse IP", value: detail.adresse_ip },
                { label: "Identifiant", value: `#${detail.id_journal}` },
              ]}
            />
            {(detail.ancienne_valeur || detail.nouvelle_valeur) && (
              <div className="journal-diff">
                <div><span>Avant</span><pre>{detail.ancienne_valeur || "—"}</pre></div>
                <div><span>Après</span><pre>{detail.nouvelle_valeur || "—"}</pre></div>
              </div>
            )}
          </>
        )}
      </Modal>

      <Modal open={modal} onClose={() => !saving && setModal(false)} title="Nouvelle entrée de journal" width={640}>
        <form onSubmit={submit}>
          <Alert message={formError} onClose={() => setFormError("")} />
          <FormFields
            values={form}
            onChange={(n, v) => setForm((f) => ({ ...f, [n]: v }))}
            fields={[
              { name: "action", label: "Action", required: true, full: true, placeholder: "Ex. Correction manuelle de note" },
              { name: "module", label: "Module", placeholder: "Ex. notes" },
              { name: "table_cible", label: "Table cible", placeholder: "Ex. note" },
              { name: "id_cible", label: "ID cible", type: "number", min: 1 },
              { name: "adresse_ip", label: "Adresse IP" },
              { name: "ancienne_valeur", label: "Ancienne valeur", type: "textarea", rows: 2, full: true },
              { name: "nouvelle_valeur", label: "Nouvelle valeur", type: "textarea", rows: 2, full: true },
            ]}
          />
          <FormActions onCancel={() => setModal(false)} saving={saving} submitLabel="Ajouter" />
        </form>
      </Modal>
    </ModulePage>
  );
}
