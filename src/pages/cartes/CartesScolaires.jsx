import { useMemo, useState } from "react";
import {
  Alert, Badge, EmptyState, FilterSelect, FormActions, FormFields, LoadingState, Modal, ModuleHeader,
  ModulePage, RefreshButton, SearchInput, StatCard, StatGrid, Toolbar, loadAll, useAsyncData, useFlash,
} from "../../components/module/ModuleKit";
import { establishmentId, userId } from "../../services/apiClient";
import { getEtablissement } from "../../services/administrationApi";
import { getAnnees } from "../../services/anneesApi";
import { createCarte, generateCarteQr, getCartes, reimprimerCarte } from "../../services/cartesApi";
import { getClasses } from "../../services/classesApi";
import { getEleves } from "../../services/elevesApi";
import { getInscriptions } from "../../services/inscriptionsApi";
import { buildInscriptionIndex, formatDate, formatDateTime, includesText, todayISO } from "../pageUtils";
import "./CartesScolaires.css";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function carteEtat(carte) {
  if (carte.statut && !["active", "actif", "valide"].includes(String(carte.statut).toLowerCase())) return { label: carte.statut, tone: "red" };
  if (carte.date_expiration && String(carte.date_expiration) < todayISO()) return { label: "Expirée", tone: "red" };
  return { label: "Valide", tone: "green" };
}

export default function CartesScolaires() {
  const [search, setSearch] = useState("");
  const [classeFilter, setClasseFilter] = useState("");
  const [etatFilter, setEtatFilter] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ mode: "unique", id_inscription: "", id_classe: "", date_expiration: "" });
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [formError, setFormError] = useState("");
  const [flash, showFlash, clearFlash] = useFlash();

  const { data, loading, error, setError, reload } = useAsyncData(async () => {
    const refs = await loadAll({ cartes: () => getCartes(), inscriptions: () => getInscriptions(), eleves: () => getEleves({ limit: 1000 }), classes: getClasses, annees: getAnnees });
    let etablissement = null;
    try {
      etablissement = await getEtablissement(establishmentId());
    } catch {
      etablissement = null;
    }
    return { ...refs, etablissement };
  });
  const refs = data || { cartes: [], inscriptions: [], eleves: [], classes: [], annees: [], etablissement: null };

  const inscriptionIndex = useMemo(
    () => buildInscriptionIndex(refs.inscriptions, refs.eleves, refs.classes, refs.annees),
    [refs.inscriptions, refs.eleves, refs.classes, refs.annees],
  );

  const cartes = useMemo(
    () =>
      refs.cartes
        .map((c) => ({ ...c, ins: inscriptionIndex.get(String(c.id_inscription)), etat: carteEtat(c) }))
        .filter((c) => !classeFilter || String(c.ins?.id_classe) === classeFilter)
        .filter((c) => !etatFilter || (etatFilter === "valide" ? c.etat.tone === "green" : c.etat.tone === "red"))
        .filter((c) => includesText([c.numero_carte, c.ins?.eleveNom, c.ins?.matricule, c.ins?.classeNom], search))
        .sort((a, b) => (a.ins?.eleveNom || "").localeCompare(b.ins?.eleveNom || "")),
    [refs.cartes, inscriptionIndex, classeFilter, etatFilter, search],
  );

  const inscriptionsAvecCarte = useMemo(() => new Set(refs.cartes.map((c) => String(c.id_inscription))), [refs.cartes]);
  const sansCarte = refs.inscriptions.filter((i) => !inscriptionsAvecCarte.has(String(i.id_inscription)));
  const cibles = form.mode === "classe" ? sansCarte.filter((i) => String(i.id_classe) === String(form.id_classe)) : [];

  function defaultExpiration() {
    const annee = refs.annees.find((a) => a.statut === "en_cours" || a.statut === "active") || refs.annees[refs.annees.length - 1];
    return annee?.date_fin ? String(annee.date_fin).slice(0, 10) : "";
  }

  function openCreate(prefill = {}) {
    setForm({ mode: "unique", id_inscription: "", id_classe: "", date_expiration: defaultExpiration(), ...prefill });
    setFormError("");
    setModal(true);
  }

  async function submit(event) {
    event.preventDefault();
    const ids = form.mode === "classe" ? cibles.map((i) => i.id_inscription) : [Number(form.id_inscription)];
    if (!ids.length) return setFormError("Tous les élèves de cette classe ont déjà une carte.");
    try {
      setSaving(true);
      setFormError("");
      const results = await Promise.allSettled(ids.map((id) => createCarte({ id_inscription: id, date_expiration: form.date_expiration || null, id_generateur: userId() })));
      const failed = results.filter((r) => r.status === "rejected");
      setModal(false);
      if (failed.length) setError(`${failed.length} carte(s) non générée(s) : ${failed[0].reason?.message || ""}`);
      showFlash(`${results.length - failed.length} carte(s) générée(s).`);
      await reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function action(carte, fn, message) {
    try {
      setBusyId(carte.id_carte);
      await fn(carte.id_carte);
      showFlash(message);
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  function printCards(list) {
    const etab = refs.etablissement;
    const win = window.open("", "_blank", "width=900,height=900");
    if (!win) return setError("Autorisez les fenêtres pop-up pour imprimer les cartes.");
    const cardsHtml = list
      .map(
        (c) => `<div class="c"><div class="t"><b>${escapeHtml(etab?.nom || "Établissement")}</b><span>CARTE SCOLAIRE ${escapeHtml(c.ins?.anneeLibelle || "")}</span></div>
        <div class="b"><div class="p">${escapeHtml((c.ins?.eleve?.prenom || "?").charAt(0))}${escapeHtml((c.ins?.eleve?.nom || "").charAt(0))}</div>
        <div><h3>${escapeHtml(c.ins?.eleveNom || "")}</h3><p>Matricule : <b>${escapeHtml(c.ins?.matricule || "—")}</b></p><p>Classe : <b>${escapeHtml(c.ins?.classeNom || "—")}</b></p>
        <p>Né(e) le : ${escapeHtml(formatDate(c.ins?.eleve?.date_naissance))}</p></div></div>
        <div class="f"><span>N° ${escapeHtml(c.numero_carte)}</span><span>Expire le ${escapeHtml(formatDate(c.date_expiration))}</span></div>
        <div class="q">${escapeHtml((c.qr_token || "").slice(0, 16))}</div></div>`,
      )
      .join("");
    win.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Cartes scolaires</title><style>
      body{font-family:Arial,sans-serif;margin:20px}.g{display:grid;grid-template-columns:repeat(2,86mm);gap:8mm}
      .c{width:86mm;height:54mm;border-radius:4mm;overflow:hidden;border:1px solid #cbd5e1;position:relative;box-sizing:border-box;page-break-inside:avoid;background:#fff}
      .t{background:linear-gradient(135deg,#1e3a8a,#2563eb);color:#fff;padding:2.5mm 4mm;display:flex;justify-content:space-between;align-items:center;font-size:8pt}
      .t span{font-size:6pt;letter-spacing:.08em}.b{display:flex;gap:3mm;padding:3mm 4mm}
      .p{width:18mm;height:22mm;border-radius:2mm;background:#dbeafe;color:#1d4ed8;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14pt}
      h3{margin:0 0 1.5mm;font-size:10pt}p{margin:.6mm 0;font-size:7pt;color:#334155}
      .f{position:absolute;bottom:0;left:0;right:0;display:flex;justify-content:space-between;padding:1.8mm 4mm;background:#f1f5f9;font-size:6.5pt;color:#475569}
      .q{position:absolute;right:4mm;top:12mm;font-family:monospace;font-size:5pt;color:#94a3b8;writing-mode:vertical-rl}
      </style></head><body><div class="g">${cardsHtml}</div><script>window.onload=function(){window.print()}</script></body></html>`);
    win.document.close();
  }

  async function printAndCount(carte) {
    printCards([carte]);
    await action(carte, reimprimerCarte, `Impression de la carte ${carte.numero_carte} comptabilisée.`);
  }

  const stats = {
    total: refs.cartes.length,
    valides: refs.cartes.filter((c) => carteEtat(c).tone === "green").length,
    qr: refs.cartes.filter((c) => c.fichier).length,
    sansCarte: sansCarte.length,
  };

  const inscriptionOptions = [...inscriptionIndex.values()]
    .filter((i) => !inscriptionsAvecCarte.has(String(i.id_inscription)))
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((i) => ({ value: i.id_inscription, label: i.label }));

  return (
    <ModulePage>
      <ModuleHeader icon="🪪" title="Cartes scolaires" subtitle="Génération, QR code et impression des cartes d'identité scolaire.">
        {cartes.length > 0 && <button type="button" className="mk-btn mk-btn-light" onClick={() => printCards(cartes)}>🖨️ Imprimer la sélection ({cartes.length})</button>}
        <button type="button" className="mk-btn mk-btn-primary" onClick={() => openCreate()}>＋ Générer des cartes</button>
      </ModuleHeader>

      <Alert message={error} onClose={() => setError("")} />
      <Alert message={flash} onClose={clearFlash} kind="success" />

      <StatGrid>
        <StatCard icon="🪪" label="Cartes générées" value={stats.total} />
        <StatCard icon="✅" label="Cartes valides" value={stats.valides} tone="green" />
        <StatCard icon="🔳" label="QR codes générés" value={stats.qr} tone="purple" />
        <StatCard icon="⚠️" label="Élèves sans carte" value={stats.sansCarte} tone="orange" />
      </StatGrid>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Nom, matricule, n° de carte..." />
        <FilterSelect label="Classe" value={classeFilter} onChange={setClasseFilter} placeholder="Toutes" options={refs.classes.map((c) => ({ value: String(c.id_classe), label: c.nom }))} />
        <FilterSelect label="État" value={etatFilter} onChange={setEtatFilter} placeholder="Tous" options={[{ value: "valide", label: "Valides" }, { value: "expire", label: "Expirées / inactives" }]} />
        <RefreshButton onClick={reload} loading={loading} />
      </Toolbar>

      {loading ? (
        <div className="mk-table-card"><LoadingState /></div>
      ) : cartes.length === 0 ? (
        <div className="mk-table-card">
          <EmptyState icon="🪪" title="Aucune carte" text="Générez les cartes pour un élève ou pour toute une classe." />
        </div>
      ) : (
        <div className="mk-card-grid cartes-grid">
          {cartes.map((c) => (
            <div key={c.id_carte} className="carte">
              <div className="carte-top">
                <strong>{refs.etablissement?.nom || "Établissement"}</strong>
                <span>CARTE SCOLAIRE {c.ins?.anneeLibelle}</span>
              </div>
              <div className="carte-body">
                <div className="carte-photo">{(c.ins?.eleve?.prenom || "?").charAt(0)}{(c.ins?.eleve?.nom || "").charAt(0)}</div>
                <div className="carte-info">
                  <h3>{c.ins?.eleveNom || `Inscription #${c.id_inscription}`}</h3>
                  <p>Matricule <b>{c.ins?.matricule || "—"}</b></p>
                  <p>Classe <b>{c.ins?.classeNom || "—"}</b></p>
                  <p>Expire le <b>{formatDate(c.date_expiration)}</b></p>
                </div>
                <div className={`carte-qr ${c.fichier ? "ready" : ""}`} title={c.fichier ? `QR généré : ${c.fichier}` : "QR non généré"}>
                  {Array.from({ length: 25 }).map((_, i) => (
                    <span key={i} style={{ opacity: parseInt((c.qr_token || "0").charAt(i % (c.qr_token || "0").length), 16) > 7 ? 1 : 0.12 }} />
                  ))}
                </div>
              </div>
              <div className="carte-foot">
                <span>N° {c.numero_carte}</span>
                <Badge tone={c.etat.tone}>{c.etat.label}</Badge>
              </div>
              <div className="carte-meta">
                <span>Générée le {formatDateTime(c.date_generation)}</span>
                <span>{c.nombre_reeditions || 0} réédition(s){c.derniere_impression ? ` · dernière ${formatDate(c.derniere_impression)}` : ""}</span>
              </div>
              <div className="carte-actions">
                <button type="button" className="mk-btn mk-btn-light mk-btn-sm" disabled={busyId === c.id_carte} onClick={() => printAndCount(c)}>🖨️ Imprimer</button>
                <button type="button" className="mk-btn mk-btn-light mk-btn-sm" disabled={busyId === c.id_carte} onClick={() => action(c, generateCarteQr, `QR code généré pour ${c.ins?.eleveNom || c.numero_carte}.`)}>🔳 {c.fichier ? "Régénérer QR" : "Générer QR"}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => !saving && setModal(false)} title="Générer des cartes scolaires" width={600}>
        <form onSubmit={submit}>
          <Alert message={formError} onClose={() => setFormError("")} />
          <FormFields
            values={form}
            onChange={(n, v) => setForm((f) => ({ ...f, [n]: v }))}
            fields={[
              { name: "mode", label: "Génération", type: "select", required: true, full: true, options: [{ value: "unique", label: "Pour un élève" }, { value: "classe", label: "Pour tous les élèves sans carte d'une classe" }] },
              form.mode === "classe"
                ? { name: "id_classe", label: "Classe", type: "select", required: true, full: true, options: refs.classes.map((c) => ({ value: c.id_classe, label: c.nom })), help: form.id_classe ? `${cibles.length} élève(s) sans carte dans cette classe.` : undefined }
                : { name: "id_inscription", label: "Élève (inscription)", type: "select", required: true, full: true, options: inscriptionOptions, placeholder: inscriptionOptions.length ? "Sélectionner..." : "Tous les élèves ont déjà une carte" },
              { name: "date_expiration", label: "Date d'expiration", type: "date", help: "Par défaut : fin de l'année scolaire en cours." },
            ]}
          />
          <FormActions onCancel={() => setModal(false)} saving={saving} submitLabel={form.mode === "classe" ? `Générer ${cibles.length} carte(s)` : "Générer la carte"} />
        </form>
      </Modal>
    </ModulePage>
  );
}
