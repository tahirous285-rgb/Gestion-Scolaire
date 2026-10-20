import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDownLeft, ArrowUpRight, CalendarDays, Check, CircleAlert, Clock3, RotateCw, Wallet } from "lucide-react";
import { establishmentId } from "../../services/apiClient";
import { CAISSE_API_READY, cloturerCaisse, getCaisseClotures, getCaisseMouvements, getCaisseResume, initialiserCaisse, rouvrirCloture } from "../../services/caisseApi";
import { formatDate, formatDateTime, formatMoney } from "../pageUtils";
import "./Caisse.css";

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getRows(value) {
  return Array.isArray(value) ? value : [];
}

function ErrorNotice({ children }) {
  return <div className="caisse-alert" role="alert"><CircleAlert size={18} /> <span>{children}</span></div>;
}

export default function Caisse() {
  const idEtablissement = establishmentId();
  const [resume, setResume] = useState(null);
  const [mouvements, setMouvements] = useState([]);
  const [clotures, setClotures] = useState([]);
  const [filters, setFilters] = useState({ date_debut: today(), date_fin: today(), sens: "" });
  const [initialForm, setInitialForm] = useState({ solde_initial: "", date_debut_suivi: today() });
  const [clotureForm, setClotureForm] = useState({ date_cloture: today(), solde_compte: "", commentaire: "" });
  const [reopenId, setReopenId] = useState(null);
  const [reopenReason, setReopenReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchData = useCallback(async () => {
    if (!CAISSE_API_READY || !idEtablissement) return null;
    const [nextResume, nextMouvements, nextClotures] = await Promise.all([
        getCaisseResume(idEtablissement, filters.date_debut),
        getCaisseMouvements({ id_etablissement: idEtablissement, ...filters }),
        getCaisseClotures(idEtablissement),
    ]);
    return { nextResume, nextMouvements, nextClotures };
  }, [filters, idEtablissement]);

  const loadData = useCallback(async () => {
    if (!CAISSE_API_READY || !idEtablissement) return;
    setLoading(true); 
    try {
      const data = await fetchData();
      if (!data) return;
      setResume(data.nextResume);
      setMouvements(getRows(data.nextMouvements));
      setClotures(getRows(data.nextClotures));
      setError("");
    } catch (requestError) {
      setResume(null);
      setMouvements([]);
      setClotures([]);
      setError(requestError.message || "Impossible de charger les données de caisse.");
    } finally {
      setLoading(false);
    }
  }, [fetchData, idEtablissement]);

  useEffect(() => {
    if (!CAISSE_API_READY) return undefined;
    let active = true;
    fetchData().then((data) => {
      if (!active || !data) return;
      setResume(data.nextResume);
      setMouvements(getRows(data.nextMouvements));
      setClotures(getRows(data.nextClotures));
      setError("");
    }).catch((requestError) => {
      if (!active) return;
      setResume(null);
      setMouvements([]);
      setClotures([]);
      setError(requestError.message || "Impossible de charger les données de caisse.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [fetchData]);

  async function submitMutation(action, successMessage) {
    setSaving(true);
    setLoading(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(successMessage);
      await loadData();
      return true;
    } catch (requestError) {
      setError(requestError.message || "L’opération n’a pas pu être enregistrée.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  function handleInitialise(event) {
    event.preventDefault();
    if (Number(initialForm.solde_initial) < 0 || initialForm.solde_initial === "") {
      setError("Le solde initial doit être un montant positif ou nul.");
      return;
    }
    submitMutation(() => initialiserCaisse({
      id_etablissement: idEtablissement,
      solde_initial: Number(initialForm.solde_initial),
      date_debut_suivi: initialForm.date_debut_suivi,
    }), "La caisse a été initialisée.");
  }

  function handleClose(event) {
    event.preventDefault();
    if (Number(clotureForm.solde_compte) < 0 || clotureForm.solde_compte === "") {
      setError("Le montant physiquement compté doit être un montant positif ou nul.");
      return;
    }
    submitMutation(() => cloturerCaisse({
      id_etablissement: idEtablissement,
      date_cloture: clotureForm.date_cloture,
      solde_compte: Number(clotureForm.solde_compte),
      commentaire: clotureForm.commentaire,
    }), "La clôture a été enregistrée.");
  }

  function handleReopen(event, id) {
    event.preventDefault();
    const motif = reopenReason.trim();
    if (!motif) {
      setError("Un motif est obligatoire pour rouvrir une clôture.");
      return;
    }
    submitMutation(() => rouvrirCloture(id, { motif_reouverture: motif }), "La clôture a été rouverte.").then((success) => {
      if (success) {
        setReopenId(null);
        setReopenReason("");
      }
    });
  }

  const initialized = resume?.initialisee === true;
  const isLoading = Boolean(idEtablissement) && loading;
  const noResume = !isLoading && !error && resume === null;

  if (!CAISSE_API_READY) {
    return (
      <main className="caisse-page">
        <header className="caisse-heading">
          <div><p className="caisse-eyebrow">FINANCES / TRÉSORERIE</p><h1>Caisse</h1><p className="caisse-subtitle">Le module attend la mise à disposition de son API Backend.</p></div>
        </header>
        <ErrorNotice>Les routes Backend <strong>/api/v1/caisse/...</strong> ne sont pas encore enregistrées dans cette branche. Aucun appel n’est envoyé et aucun solde fictif n’est affiché. Les opérations restent disponibles dans leurs modules actuels.</ErrorNotice>
        <nav className="caisse-source-links" aria-label="Modules financiers existants">
          <strong>Modules financiers</strong>
          <Link to="/paiements">Paiements scolaires</Link><Link to="/frais">Frais scolaires</Link><Link to="/paiements-honoraires">Paiements d’honoraires</Link><Link to="/honoraires">Honoraires</Link><Link to="/depenses">Dépenses</Link>
        </nav>
      </main>
    );
  }

  return (
    <main className="caisse-page">
      <header className="caisse-heading">
        <div>
          <p className="caisse-eyebrow">FINANCES / TRÉSORERIE</p>
          <h1>Caisse</h1>
          <p className="caisse-subtitle">Solde physique et journal des opérations en espèces.</p>
        </div>
        <button className="crud-secondary caisse-refresh" type="button" onClick={() => { setLoading(true); loadData(); }} disabled={loading}>
          <RotateCw size={16} /> Actualiser
        </button>
      </header>

      {!idEtablissement && <ErrorNotice>Aucun établissement n’est associé à la session. Reconnectez-vous ou contactez un administrateur.</ErrorNotice>}
      {error && <ErrorNotice>{error}</ErrorNotice>}
      {notice && <div className="caisse-success" role="status"><Check size={17} />{notice}</div>}
      {noResume && <ErrorNotice>Le serveur n’a pas retourné le résumé de caisse attendu. Vérifiez le contrat API Backend.</ErrorNotice>}

      <section className="caisse-metrics" aria-label="Résumé de caisse">
        <article className="caisse-metric caisse-metric-balance">
          <span className="caisse-metric-label"><Wallet size={16} /> Solde théorique</span>
          <strong>{isLoading ? "Chargement…" : formatMoney(resume?.solde_theorique)}</strong>
          <small>{initialized ? `Suivi depuis le ${formatDate(resume.date_debut_suivi)}` : "Caisse non initialisée"}</small>
        </article>
        <article className="caisse-metric caisse-metric-in">
          <span className="caisse-metric-label"><ArrowDownLeft size={16} /> Entrées le {formatDate(filters.date_debut)}</span>
          <strong>{isLoading ? "Chargement…" : formatMoney(resume?.total_entrees_jour)}</strong>
          <small>Total communiqué par l’API</small>
        </article>
        <article className="caisse-metric caisse-metric-out">
          <span className="caisse-metric-label"><ArrowUpRight size={16} /> Sorties le {formatDate(filters.date_debut)}</span>
          <strong>{isLoading ? "Chargement…" : formatMoney(resume?.total_sorties_jour)}</strong>
          <small>Total communiqué par l’API</small>
        </article>
        <article className="caisse-metric caisse-metric-state">
          <span className="caisse-metric-label"><Clock3 size={16} /> État</span>
          <strong>{isLoading ? "Chargement…" : initialized ? "Initialisée" : "À initialiser"}</strong>
          <small>{initialized ? `Début : ${formatDate(resume.date_debut_suivi)}` : "Saisir le fonds de départ"}</small>
        </article>
      </section>

      {!loading && !error && resume && !initialized && (
        <section className="caisse-panel caisse-init-panel">
          <div className="caisse-section-title"><div><span className="caisse-eyebrow">MISE EN SERVICE</span><h2>Initialiser la caisse</h2></div></div>
          <form className="caisse-form caisse-form-inline" onSubmit={handleInitialise}>
            <label>Solde initial (FCFA)<input type="number" min="0" step="1" required value={initialForm.solde_initial} onChange={(event) => setInitialForm({ ...initialForm, solde_initial: event.target.value })} /></label>
            <label>Date de début du suivi<input type="date" required value={initialForm.date_debut_suivi} onChange={(event) => setInitialForm({ ...initialForm, date_debut_suivi: event.target.value })} /></label>
            <button className="crud-primary" type="submit" disabled={saving}><Check size={16} /> Initialiser</button>
          </form>
        </section>
      )}

      <section className="caisse-panel">
        <div className="caisse-section-title">
          <div><span className="caisse-eyebrow">MOUVEMENTS</span><h2>Journal de caisse</h2></div>
          <span className="caisse-count">{mouvements.length} opération(s)</span>
        </div>
        <div className="caisse-filters">
          <label><CalendarDays size={15} /> Du<input type="date" value={filters.date_debut} onChange={(event) => { setLoading(true); setFilters({ ...filters, date_debut: event.target.value }); }} /></label>
          <label><CalendarDays size={15} /> Au<input type="date" value={filters.date_fin} onChange={(event) => { setLoading(true); setFilters({ ...filters, date_fin: event.target.value }); }} /></label>
          <label>Sens<select value={filters.sens} onChange={(event) => { setLoading(true); setFilters({ ...filters, sens: event.target.value }); }}><option value="">Tous</option><option value="entree">Entrées</option><option value="sortie">Sorties</option></select></label>
        </div>
        <div className="caisse-table-wrap">
          <table className="caisse-table">
            <thead><tr><th>Date</th><th>Sens</th><th>Catégorie</th><th>Libellé / référence</th><th>Mode</th><th>Utilisateur</th><th className="numeric">Montant</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="7" className="caisse-empty">Chargement des mouvements…</td></tr>
                : mouvements.length === 0 ? <tr><td colSpan="7" className="caisse-empty">Aucun mouvement pour cette période.</td></tr>
                  : mouvements.map((row) => <tr key={row.id_mouvement_caisse}>
                    <td>{formatDateTime(row.date_mouvement)}</td>
                    <td><span className={`caisse-direction ${row.sens === "entree" ? "is-in" : "is-out"}`}>{row.sens === "entree" ? <><ArrowDownLeft size={14} /> Entrée</> : <><ArrowUpRight size={14} /> Sortie</>}</span></td>
                    <td>{row.categorie || "—"}</td><td>{row.libelle || row.source_id || "—"}</td><td>{row.mode_paiement || "—"}</td><td>{row.id_utilisateur ?? "—"}</td>
                    <td className={`numeric caisse-amount ${row.sens === "entree" ? "is-in" : "is-out"}`}>{formatMoney(row.montant)}</td>
                  </tr>)}
            </tbody>
          </table>
        </div>
      </section>

      <div className="caisse-bottom-grid">
        <section className="caisse-panel">
          <div className="caisse-section-title"><div><span className="caisse-eyebrow">FIN DE JOURNÉE</span><h2>Nouvelle clôture</h2></div></div>
          <form className="caisse-form caisse-close-form" onSubmit={handleClose}>
            <label>Date de clôture<input type="date" required value={clotureForm.date_cloture} onChange={(event) => setClotureForm({ ...clotureForm, date_cloture: event.target.value })} /></label>
            <label>Montant physiquement compté (FCFA)<input type="number" min="0" step="1" required value={clotureForm.solde_compte} onChange={(event) => setClotureForm({ ...clotureForm, solde_compte: event.target.value })} /></label>
            <label>Commentaire<textarea rows="3" value={clotureForm.commentaire} onChange={(event) => setClotureForm({ ...clotureForm, commentaire: event.target.value })} /></label>
            <button className="crud-primary" type="submit" disabled={saving || !initialized}><Check size={16} /> Enregistrer la clôture</button>
            {!initialized && <small>Initialisez la caisse avant de créer une clôture.</small>}
          </form>
        </section>

        <section className="caisse-panel">
          <div className="caisse-section-title"><div><span className="caisse-eyebrow">ARCHIVE</span><h2>Historique des clôtures</h2></div></div>
          {loading ? <p className="caisse-empty">Chargement des clôtures…</p> : clotures.length === 0 ? <p className="caisse-empty">Aucune clôture enregistrée.</p> : (
            <div className="caisse-closures">
              {clotures.map((row) => <article className="caisse-closure" key={row.id_cloture_caisse}>
                <div className="caisse-closure-top"><strong>{formatDate(row.date_cloture)}</strong><span className={`caisse-status ${row.statut === "cloturee" ? "is-closed" : "is-reopened"}`}>{row.statut || "—"}</span></div>
                <dl><div><dt>Théorique</dt><dd>{formatMoney(row.solde_theorique)}</dd></div><div><dt>Compté</dt><dd>{formatMoney(row.solde_compte)}</dd></div><div><dt>Écart</dt><dd>{formatMoney(row.ecart)}</dd></div></dl>
                {(row.commentaire || row.motif_reouverture) && <p className="caisse-closure-note">{row.motif_reouverture || row.commentaire}</p>}
                {row.statut === "cloturee" && <>
                  {reopenId === row.id_cloture_caisse ? <form className="caisse-reopen-form" onSubmit={(event) => handleReopen(event, row.id_cloture_caisse)}>
                    <label>Motif obligatoire<input autoFocus required value={reopenReason} onChange={(event) => setReopenReason(event.target.value)} /></label>
                    <button className="crud-primary" type="submit" disabled={saving}>Confirmer</button>
                    <button className="crud-secondary" type="button" onClick={() => { setReopenId(null); setReopenReason(""); }}>Annuler</button>
                  </form> : <button className="caisse-reopen-button" type="button" onClick={() => { setReopenId(row.id_cloture_caisse); setReopenReason(""); }}>Rouvrir avec un motif</button>}
                </>}
              </article>)}
            </div>
          )}
        </section>
      </div>

      <nav className="caisse-source-links" aria-label="Modules financiers liés">
        <strong>Modules financiers</strong>
        <Link to="/paiements">Paiements scolaires</Link><Link to="/frais">Frais scolaires</Link><Link to="/paiements-honoraires">Paiements d’honoraires</Link><Link to="/honoraires">Honoraires</Link><Link to="/depenses">Dépenses</Link>
      </nav>
    </main>
  );
}