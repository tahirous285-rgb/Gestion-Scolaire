import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Alert, Badge, DataTable, DetailGrid, FilterSelect, MenuItem, Modal, ModuleHeader, ModulePage,
  RefreshButton, SearchInput, StatCard, StatGrid, Toolbar, loadAll, useAsyncData, useFlash,
} from "../../components/module/ModuleKit";
import { establishmentId, userId } from "../../services/apiClient";
import { getEtablissement } from "../../services/administrationApi";
import { getAnnees } from "../../services/anneesApi";
import { getClasses } from "../../services/classesApi";
import { getEleves } from "../../services/elevesApi";
import { generateRecuPdf, getFrais, getPaiements, getRecuByPaiement, getTypesFrais, printRecu } from "../../services/financeApi";
import { getInscriptions } from "../../services/inscriptionsApi";
import { buildInscriptionIndex, formatDateTime, formatMoney, includesText, mapBy, sum } from "../pageUtils";
import "./Recus.css";

/**
 * Le backend n'expose pas de liste globale des reçus : chaque paiement génère
 * un reçu (relation 1-1) consultable via GET /recus/paiement/{id}. La liste est
 * donc reconstituée à partir des paiements existants.
 */
async function loadRecus() {
  const [refs, paiements] = await Promise.all([
    loadAll({
      inscriptions: () => getInscriptions(),
      eleves: () => getEleves({ limit: 1000 }),
      classes: getClasses,
      annees: getAnnees,
      frais: () => getFrais(),
      types: () => getTypesFrais(establishmentId()),
    }),
    getPaiements(),
  ]);
  const recus = await Promise.all(
    (paiements || []).map(async (paiement) => {
      try {
        const recu = await getRecuByPaiement(paiement.id_paiement);
        return { ...recu, paiement };
      } catch {
        return null;
      }
    }),
  );
  let etablissement = null;
  try {
    etablissement = await getEtablissement(establishmentId());
  } catch {
    etablissement = null;
  }
  return { ...refs, paiements: paiements || [], recus: recus.filter(Boolean), etablissement };
}

function numberToWordsFr(value) {
  const n = Math.round(Number(value) || 0);
  if (n === 0) return "zéro";
  const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize"];
  const tens = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];
  function below100(x) {
    if (x <= 16) return units[x];
    if (x < 20) return `dix-${units[x - 10]}`;
    const t = Math.floor(x / 10);
    let u = x % 10;
    if (t === 7 || t === 9) u += 10;
    let word = tens[t];
    if (u === 0) return t === 8 ? "quatre-vingts" : word;
    if ((u === 1 || u === 11) && t !== 8 && t !== 9) return `${word} et ${units[u]}`;
    return `${word}-${u <= 16 ? units[u] : `dix-${units[u - 10]}`}`;
  }
  function below1000(x) {
    const h = Math.floor(x / 100);
    const r = x % 100;
    let word = "";
    if (h > 0) word = h === 1 ? "cent" : `${units[h]} cent${r === 0 ? "s" : ""}`;
    if (r > 0) word += `${word ? " " : ""}${below100(r)}`;
    return word;
  }
  const parts = [];
  const millions = Math.floor(n / 1000000);
  const thousands = Math.floor((n % 1000000) / 1000);
  const rest = n % 1000;
  if (millions) parts.push(`${below1000(millions)} million${millions > 1 ? "s" : ""}`);
  if (thousands) parts.push(thousands === 1 ? "mille" : `${below1000(thousands)} mille`);
  if (rest) parts.push(below1000(rest));
  return parts.join(" ");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

export default function Recus() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [printFilter, setPrintFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [flash, showFlash, clearFlash] = useFlash();

  const { data, loading, error, setError, reload } = useAsyncData(loadRecus);
  const refs = data || { recus: [], inscriptions: [], eleves: [], classes: [], annees: [], frais: [], types: [], etablissement: null };

  const inscriptionIndex = useMemo(
    () => buildInscriptionIndex(refs.inscriptions, refs.eleves, refs.classes, refs.annees),
    [refs.inscriptions, refs.eleves, refs.classes, refs.annees],
  );
  const fraisMap = useMemo(() => mapBy(refs.frais, "id_frais"), [refs.frais]);
  const typesMap = useMemo(() => mapBy(refs.types, "id_type_frais"), [refs.types]);

  const enriched = useMemo(
    () =>
      refs.recus.map((recu) => {
        const ins = inscriptionIndex.get(String(recu.paiement?.id_inscription));
        const frais = fraisMap.get(String(recu.paiement?.id_frais));
        const type = frais ? typesMap.get(String(frais.id_type_frais)) : null;
        return { ...recu, ins, fraisLibelle: type?.libelle || (frais ? `Frais #${frais.id_frais}` : "Paiement libre") };
      }),
    [refs.recus, inscriptionIndex, fraisMap, typesMap],
  );

  // Ouverture directe depuis la page Paiements (?paiement=ID)
  const paiementParam = params.get("paiement");
  useEffect(() => {
    if (!paiementParam || loading) return;
    const match = enriched.find((r) => String(r.id_paiement) === paiementParam);
    if (match) setSelected(match);
    else if (!loading) setError(`Aucun reçu trouvé pour le paiement #${paiementParam}.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paiementParam, loading]);

  const rows = useMemo(
    () =>
      enriched
        .filter((r) => (printFilter === "printed" ? r.imprime : printFilter === "pending" ? !r.imprime : true))
        .filter((r) => includesText([r.numero_recu, r.paiement?.reference, r.ins?.eleveNom, r.ins?.matricule, r.ins?.classeNom], search))
        .sort((a, b) => String(b.date_emission).localeCompare(String(a.date_emission))),
    [enriched, printFilter, search],
  );

  const stats = {
    total: enriched.length,
    printed: enriched.filter((r) => r.imprime).length,
    pdf: enriched.filter((r) => r.pdf).length,
    montant: sum(enriched, "montant"),
  };

  function closeDetail() {
    setSelected(null);
    if (paiementParam) setParams({}, { replace: true });
  }

  function replaceRecu(updated) {
    const merged = { ...selected, ...updated };
    setSelected((current) => (current && current.id_recu === updated.id_recu ? merged : current));
    reload();
  }

  async function handlePrint(recu) {
    const etab = refs.etablissement;
    const win = window.open("", "_blank", "width=820,height=900");
    if (!win) {
      setError("Autorisez les fenêtres pop-up pour imprimer le reçu.");
      return;
    }
    const devise = etab?.devise || "FCFA";
    win.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${escapeHtml(recu.numero_recu)}</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:32px}
        .r{border:2px solid #1d4ed8;border-radius:12px;padding:28px;max-width:680px;margin:auto}
        .h{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding-bottom:14px;margin-bottom:18px}
        .h h1{margin:0;font-size:20px;color:#1d4ed8}.h p{margin:3px 0;font-size:12px;color:#555}
        .n{text-align:right}.n strong{font-size:18px}
        table{width:100%;border-collapse:collapse;margin:12px 0}td{padding:8px 4px;border-bottom:1px dashed #ddd;font-size:14px}
        td:first-child{color:#555;width:40%}
        .m{background:#eff6ff;border-radius:8px;padding:14px;margin-top:14px;font-size:15px}
        .m strong{font-size:22px;color:#1d4ed8}.s{display:flex;justify-content:space-between;margin-top:48px;font-size:13px;color:#555}
      </style></head><body><div class="r">
      <div class="h"><div><h1>${escapeHtml(etab?.nom || "Établissement scolaire")}</h1>
      <p>${escapeHtml(etab?.adresse || "")}</p><p>${escapeHtml([etab?.telephone, etab?.email].filter(Boolean).join(" · "))}</p></div>
      <div class="n"><p>REÇU DE PAIEMENT</p><strong>${escapeHtml(recu.numero_recu)}</strong><p>${escapeHtml(formatDateTime(recu.date_emission))}</p></div></div>
      <table>
        <tr><td>Élève</td><td><b>${escapeHtml(recu.ins?.eleveNom || "")}</b></td></tr>
        <tr><td>Matricule</td><td>${escapeHtml(recu.ins?.matricule || "—")}</td></tr>
        <tr><td>Classe</td><td>${escapeHtml(recu.ins?.classeNom || "—")} ${escapeHtml(recu.ins?.anneeLibelle ? `(${recu.ins.anneeLibelle})` : "")}</td></tr>
        <tr><td>Objet</td><td>${escapeHtml(recu.fraisLibelle)}</td></tr>
        <tr><td>Référence paiement</td><td>${escapeHtml(recu.paiement?.reference || "")}</td></tr>
        <tr><td>Date du paiement</td><td>${escapeHtml(formatDateTime(recu.paiement?.date_paiement))}</td></tr>
        <tr><td>Mode de paiement</td><td>${escapeHtml(recu.paiement?.mode_paiement || "—")}</td></tr>
      </table>
      <div class="m">Montant reçu : <strong>${escapeHtml(Number(recu.montant).toLocaleString("fr-FR"))} ${escapeHtml(devise)}</strong><br>
      <small>Arrêté à la somme de ${escapeHtml(numberToWordsFr(recu.montant))} ${escapeHtml(devise)}.</small></div>
      <div class="s"><span>Signature du payeur</span><span>Cachet et signature de l'établissement</span></div>
      </div><script>window.onload=function(){window.print()}</script></body></html>`);
    win.document.close();

    if (!recu.imprime) {
      try {
        const updated = await printRecu(recu.id_recu, userId());
        replaceRecu(updated);
        showFlash(`Reçu ${recu.numero_recu} marqué comme imprimé.`);
      } catch (err) {
        setError(err.message);
      }
    }
  }

  async function handleMarkPrinted(recu) {
    try {
      setBusy(true);
      const updated = await printRecu(recu.id_recu, userId());
      replaceRecu(updated);
      showFlash(`Reçu ${recu.numero_recu} marqué comme imprimé.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handlePdf(recu) {
    try {
      setBusy(true);
      const updated = await generateRecuPdf(recu.id_recu);
      replaceRecu(updated);
      showFlash(`PDF généré sur le serveur : ${updated.pdf}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModulePage>
      <ModuleHeader icon="🧾" title="Reçus" subtitle="Reçus générés automatiquement à chaque paiement : impression, PDF et suivi." />

      <Alert message={error} onClose={() => setError("")} />
      <Alert message={flash} onClose={clearFlash} kind="success" />

      <StatGrid>
        <StatCard icon="🧾" label="Reçus émis" value={stats.total} />
        <StatCard icon="🖨️" label="Imprimés" value={stats.printed} hint={`${stats.total - stats.printed} en attente`} tone="green" />
        <StatCard icon="📄" label="PDF générés" value={stats.pdf} tone="purple" />
        <StatCard icon="💰" label="Montant total" value={formatMoney(stats.montant)} tone="orange" />
      </StatGrid>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="N° de reçu, référence, élève, matricule..." />
        <FilterSelect label="Impression" value={printFilter} onChange={setPrintFilter} placeholder="Tous" options={[{ value: "printed", label: "Imprimés" }, { value: "pending", label: "Non imprimés" }]} />
        <RefreshButton onClick={reload} loading={loading} />
      </Toolbar>

      <DataTable
        loading={loading}
        rows={rows}
        rowKey="id_recu"
        emptyIcon="🧾"
        emptyTitle="Aucun reçu"
        emptyText="Les reçus apparaissent ici dès qu'un paiement est enregistré."
        onRowClick={setSelected}
        columns={[
          { key: "numero", label: "N° reçu", render: (r) => <span className="mk-id">{r.numero_recu}</span> },
          { key: "eleve", label: "Élève", render: (r) => (<div><strong>{r.ins?.eleveNom || "—"}</strong><div className="mk-muted" style={{ fontSize: 12 }}>{r.ins?.classeNom}</div></div>) },
          { key: "objet", label: "Objet", render: (r) => r.fraisLibelle },
          { key: "date", label: "Émis le", render: (r) => formatDateTime(r.date_emission) },
          { key: "montant", label: "Montant", align: "right", render: (r) => <span className="mk-money">{formatMoney(r.montant)}</span> },
          { key: "imprime", label: "Impression", render: (r) => (r.imprime ? <Badge tone="green">Imprimé</Badge> : <Badge tone="orange">À imprimer</Badge>) },
          { key: "pdf", label: "PDF", render: (r) => (r.pdf ? <Badge tone="purple">Généré</Badge> : <span className="mk-muted">—</span>) },
        ]}
        actions={(r, close) => (
          <>
            <MenuItem icon="👁️" onClick={() => { setSelected(r); close(); }}>Aperçu</MenuItem>
            <MenuItem icon="🖨️" onClick={() => { close(); handlePrint(r); }}>Imprimer</MenuItem>
            <MenuItem icon="✅" disabled={r.imprime || busy} onClick={() => { close(); handleMarkPrinted(r); }}>Marquer comme imprimé</MenuItem>
            <MenuItem icon="📄" disabled={busy} onClick={() => { close(); handlePdf(r); }}>{r.pdf ? "Régénérer le PDF" : "Générer le PDF"}</MenuItem>
          </>
        )}
      />

      <Modal open={Boolean(selected)} onClose={closeDetail} title={`Reçu ${selected?.numero_recu || ""}`} width={680}
        footer={selected && (
          <>
            <button type="button" className="mk-btn mk-btn-light" onClick={() => handlePdf(selected)} disabled={busy}>📄 {selected.pdf ? "Régénérer PDF" : "Générer PDF"}</button>
            <button type="button" className="mk-btn mk-btn-primary" onClick={() => handlePrint(selected)}>🖨️ Imprimer</button>
          </>
        )}>
        {selected && (
          <>
            <div className="recu-preview">
              <div className="recu-preview-head">
                <div>
                  <strong>{refs.etablissement?.nom || "Établissement"}</strong>
                  <span>{refs.etablissement?.adresse}</span>
                </div>
                <div className="recu-preview-num">
                  <small>REÇU N°</small>
                  <strong>{selected.numero_recu}</strong>
                </div>
              </div>
              <div className="recu-preview-amount">
                <span>Montant reçu</span>
                <strong>{formatMoney(selected.montant)}</strong>
                <small>{numberToWordsFr(selected.montant)} {refs.etablissement?.devise || "FCFA"}</small>
              </div>
            </div>
            <DetailGrid
              items={[
                { label: "Élève", value: selected.ins?.eleveNom },
                { label: "Classe", value: selected.ins?.classeNom },
                { label: "Objet", value: selected.fraisLibelle },
                { label: "Référence paiement", value: selected.paiement?.reference },
                { label: "Mode", value: selected.paiement?.mode_paiement },
                { label: "Date d'émission", value: formatDateTime(selected.date_emission) },
                { label: "Imprimé", value: selected.imprime ? `Oui — ${formatDateTime(selected.date_impression)}` : "Non" },
                { label: "Fichier PDF (serveur)", value: selected.pdf },
              ]}
            />
          </>
        )}
      </Modal>
    </ModulePage>
  );
}
