import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownLeft, ArrowLeftRight, ArrowUpRight, CalendarDays, CircleAlert,
  Clock3, RefreshCw, Search, Wallet,
} from "lucide-react";
import { establishmentId } from "../../services/apiClient";
import {
  cloturerCaisse, getCaisseClotures, getCaisseMouvements, getCaisseResume,
  initialiserCaisse, rouvrirCaisse,
} from "../../services/caisseApi";
import { formatDate, formatDateTime, formatMoney } from "../pageUtils";
import "./Caisse.css";

const field = (record, names) => {
  for (const name of names) {
    const value = record?.[name];
    if (value !== null && value !== undefined && value !== "") return value;
  }
  return null;
};

function collectionFrom(response, keys) {
  if (Array.isArray(response)) return response;
  for (const key of keys) {
    if (Array.isArray(response?.[key])) return response[key];
  }
  throw new Error("Format de liste inattendu dans la réponse du serveur.");
}

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function display(value) {
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

function formatMovementSense(value) {
  const normalized = String(value || "").toLowerCase();
  if (["entree", "entrée", "in", "credit"].includes(normalized)) return "Entrée";
  if (["sortie", "out", "debit"].includes(normalized)) return "Sortie";
  return display(value);
}

function formatCategory(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("inscription") || normalized.includes("frais")) return "Frais d’inscription";
  if (normalized.includes("honoraire")) return "Honoraire";
  if (normalized.includes("depense") || normalized.includes("dépense")) return "Dépense";
  return display(value);
}

function formatApiError(error) {
  return error?.message || "Une erreur inattendue est survenue.";
}

async function fetchCaisseData(idEtablissement, queryFilters = {}) {
  const requests = await Promise.allSettled([
    getCaisseResume(idEtablissement),
    getCaisseMouvements({
      id_etablissement: idEtablissement,
      ...queryFilters,
    }),
    getCaisseClotures(idEtablissement),
  ]);
  const result = { resume: null, mouvements: [], clotures: [], errors: {} };
  if (requests[0].status === "fulfilled") {
    const response = requests[0].value;
    if (response && typeof response === "object" && !Array.isArray(response)) {
      result.resume = response;
    } else {
      result.errors.resume = "Format de résumé inattendu dans la réponse du serveur.";
    }
  } else {
    result.errors.resume = formatApiError(requests[0].reason);
  }
  if (requests[1].status === "fulfilled") {
    try {
      result.mouvements = collectionFrom(requests[1].value, ["mouvements", "items", "results"]);
    } catch (error) {
      result.errors.mouvements = formatApiError(error);
    }
  } else {
    result.errors.mouvements = formatApiError(requests[1].reason);
  }
  if (requests[2].status === "fulfilled") {
    try {
      result.clotures = collectionFrom(requests[2].value, ["clotures", "items", "results"]);
    } catch (error) {
      result.errors.clotures = formatApiError(error);
    }
  } else {
    result.errors.clotures = formatApiError(requests[2].reason);
  }
  return result;
}

function movementSearchText(row) {
  return [
    field(row, ["date_mouvement", "date_operation", "date"]),
    field(row, ["sens", "type_mouvement"]),
    field(row, ["libelle", "description", "motif"]),
    field(row, ["reference", "reference_operation", "numero_reference"]),
    field(row, ["categorie", "category", "type_operation"]),
    field(row, ["montant"]),
    field(row, ["mode_paiement", "mode"]),
    field(row, ["utilisateur", "responsable", "nom_utilisateur", "utilisateur_nom"]),
  ].filter(Boolean).join(" ").toLocaleLowerCase("fr");
}

function StatCard({ label, value, icon: Icon, kind }) {
  return (
    <article className={`caisse-stat ${kind || ""}`}>
      <div className="caisse-stat-icon"><Icon size={19} /></div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export default function Caisse() {
  const idEtablissement = establishmentId();
  const [resume, setResume] = useState(null);
  const [mouvements, setMouvements] = useState([]);
  const [clotures, setClotures] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(Boolean(idEtablissement));
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({ date_debut: "", date_fin: "", sens: "" });
  const [search, setSearch] = useState("");
  const [dateDebutSuivi, setDateDebutSuivi] = useState(today());
  const [soldeInitial, setSoldeInitial] = useState("");
  const [soldeCompte, setSoldeCompte] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [motifReouverture, setMotifReouverture] = useState("");
  const [reouvertureId, setReouvertureId] = useState(null);
  const [busy, setBusy] = useState("");
  const [success, setSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadInitialData() {
      if (!idEtablissement) return;
      const data = await fetchCaisseData(idEtablissement);
      if (!active) return;
      setResume(data.resume);
      setMouvements(data.mouvements);
      setClotures(data.clotures);
      setErrors(data.errors);
      setLoading(false);
    }
    loadInitialData();
    return () => { active = false; };
  }, [idEtablissement]);

  const refresh = useCallback(async (queryFilters = filters) => {
    if (!idEtablissement) return;
    setRefreshing(true);
    setErrors({});
    const data = await fetchCaisseData(idEtablissement, queryFilters);
    setResume(data.resume);
    setMouvements(data.mouvements);
    setClotures(data.clotures);
    setErrors(data.errors);
    setLoading(false);
    setRefreshing(false);
  }, [filters, idEtablissement]);

  const filteredMouvements = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("fr");
    return mouvements.filter((row) => !term || movementSearchText(row).includes(term));
  }, [mouvements, search]);

  const initializedValue = field(resume, [
    "initialisee", "caisse_initialisee", "est_initialisee", "is_initialisee",
  ]);
  const isInitialized = initializedValue === true || initializedValue === 1;
  const isNotInitialized = initializedValue === false || initializedValue === 0;
  const theoreticalBalance = field(resume, [
    "solde_theorique_actuel", "solde_theorique", "solde_actuel",
  ]);

  async function handleInitialize(event) {
    event.preventDefault();
    if (!idEtablissement || !window.confirm("Confirmer l’initialisation de la caisse ? Cette opération ne pourra pas être répétée depuis cette page.")) return;
    setBusy("initialisation");
    setActionError("");
    setSuccess("");
    try {
      await initialiserCaisse({
        id_etablissement: idEtablissement,
        solde_initial: Number(soldeInitial),
        date_debut_suivi: dateDebutSuivi,
      });
      setSoldeInitial("");
      setSuccess("La caisse a été initialisée.");
      await refresh();
    } catch (error) {
      setActionError(formatApiError(error));
    } finally {
      setBusy("");
    }
  }

  async function handleClose(event) {
    event.preventDefault();
    if (!idEtablissement) return;
    setBusy("cloture");
    setActionError("");
    setSuccess("");
    try {
      await cloturerCaisse({
        id_etablissement: idEtablissement,
        date_cloture: today(),
        solde_compte: Number(soldeCompte),
        commentaire: commentaire.trim() || null,
      });
      setSoldeCompte("");
      setCommentaire("");
      setSuccess("La clôture de caisse a été enregistrée.");
      await refresh();
    } catch (error) {
      setActionError(formatApiError(error));
    } finally {
      setBusy("");
    }
  }

  async function handleReopen(event, closureId) {
    event.preventDefault();
    const reason = motifReouverture.trim();
    if (!reason) {
      setActionError("Le motif de réouverture est obligatoire.");
      return;
    }
    if (!window.confirm("Confirmer la réouverture de cette clôture ?")) return;
    setBusy("reouverture");
    setActionError("");
    setSuccess("");
    try {
      await rouvrirCaisse(closureId, reason);
      setMotifReouverture("");
      setReouvertureId(null);
      setSuccess("La réouverture a été enregistrée.");
      await refresh();
    } catch (error) {
      setActionError(formatApiError(error));
    } finally {
      setBusy("");
    }
  }

  function applyFilters(event) {
    event.preventDefault();
    refresh(filters);
  }

  return (
    <main className="caisse-page">
      <header className="caisse-header">
        <div>
          <p className="caisse-eyebrow">FINANCES · SUIVI DES FLUX</p>
          <h1>Caisse</h1>
          <p>Journal centralisé des mouvements effectivement encaissés ou réglés en espèces.</p>
        </div>
        <button className="caisse-button secondary" type="button" onClick={() => refresh()} disabled={refreshing}>
          <RefreshCw size={16} className={refreshing ? "caisse-spin" : ""} />
          {refreshing ? "Actualisation…" : "Actualiser"}
        </button>
      </header>

      {!idEtablissement && <div className="caisse-alert error" role="alert">Aucun établissement n’est associé à la session. La caisse ne peut pas être chargée.</div>}
      {actionError && <div className="caisse-alert error" role="alert"><CircleAlert size={17} />{actionError}</div>}
      {success && <div className="caisse-alert success" role="status">{success}</div>}

      <section className="caisse-stats" aria-label="Résumé de la caisse">
        <StatCard label="Solde théorique actuel" value={formatMoney(theoreticalBalance)} icon={Wallet} kind="balance" />
        <StatCard label="Entrées du jour" value={formatMoney(field(resume, ["entrees_jour", "total_entrees_jour", "entrees_du_jour"]))} icon={ArrowDownLeft} kind="incoming" />
        <StatCard label="Sorties du jour" value={formatMoney(field(resume, ["sorties_jour", "total_sorties_jour", "sorties_du_jour"]))} icon={ArrowUpRight} kind="outgoing" />
        <StatCard label="Début du suivi" value={formatDate(field(resume, ["date_debut_suivi"]))} icon={CalendarDays} />
      </section>

      {loading && <div className="caisse-loading" role="status">Chargement des données de caisse…</div>}
      {errors.resume && <div className="caisse-alert error" role="alert">Résumé : {errors.resume}</div>}
      {resume && (
        <div className={`caisse-status ${isInitialized ? "initialized" : isNotInitialized ? "not-initialized" : "unknown"}`}>
          <span className="caisse-status-mark" aria-hidden="true">{isInitialized ? "✓" : isNotInitialized ? "!" : "?"}</span>
          <div>
            <strong>{isInitialized ? "Caisse initialisée" : isNotInitialized ? "Caisse non initialisée" : "État d’initialisation non communiqué"}</strong>
            <span>{isInitialized ? "Le suivi des opérations est actif." : isNotInitialized ? "Renseignez le solde de départ et la date de début du suivi." : "La réponse du résumé ne précise pas le statut d’initialisation."}</span>
          </div>
        </div>
      )}

      {isNotInitialized && (
        <section className="caisse-panel">
          <div className="caisse-panel-heading">
            <div><p className="caisse-eyebrow">MISE EN SERVICE</p><h2>Initialiser la caisse</h2></div>
          </div>
          <form className="caisse-form" onSubmit={handleInitialize}>
            <label>Solde initial (FCFA)
              <input type="number" min="0" step="0.01" required value={soldeInitial} onChange={(event) => setSoldeInitial(event.target.value)} />
            </label>
            <label>Date de début du suivi
              <input type="date" required value={dateDebutSuivi} onChange={(event) => setDateDebutSuivi(event.target.value)} />
            </label>
            <button className="caisse-button primary" type="submit" disabled={busy === "initialisation"}>
              {busy === "initialisation" ? "Initialisation…" : "Initialiser la caisse"}
            </button>
          </form>
        </section>
      )}

      <section className="caisse-panel">
        <div className="caisse-panel-heading">
          <div><p className="caisse-eyebrow">JOURNAL CENTRALISÉ</p><h2>Mouvements de caisse</h2></div>
          <span className="caisse-count">{filteredMouvements.length} mouvement{filteredMouvements.length === 1 ? "" : "s"}</span>
        </div>
        <form className="caisse-filters" onSubmit={applyFilters}>
          <label>Date de début<input type="date" value={filters.date_debut} onChange={(event) => setFilters({ ...filters, date_debut: event.target.value })} /></label>
          <label>Date de fin<input type="date" value={filters.date_fin} onChange={(event) => setFilters({ ...filters, date_fin: event.target.value })} /></label>
          <label>Sens
            <select value={filters.sens} onChange={(event) => setFilters({ ...filters, sens: event.target.value })}>
              <option value="">Tous</option><option value="entree">Entrée</option><option value="sortie">Sortie</option>
            </select>
          </label>
          <button className="caisse-button secondary" type="submit" disabled={refreshing}>Appliquer</button>
          <label className="caisse-search"><Search size={16} /><input type="search" placeholder="Rechercher un mouvement…" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        </form>
        {errors.mouvements && <div className="caisse-alert error" role="alert">Journal : {errors.mouvements}</div>}
        {!errors.mouvements && !loading && filteredMouvements.length === 0 ? (
          <div className="caisse-empty"><ArrowLeftRight size={22} /><strong>Aucun mouvement à afficher</strong><span>Les mouvements enregistrés par les modules métier apparaîtront ici.</span></div>
        ) : !errors.mouvements && (
          <div className="caisse-table-wrap">
            <table className="caisse-table">
              <thead><tr><th>Date</th><th>Sens</th><th>Catégorie</th><th>Libellé / référence</th><th>Montant</th><th>Mode</th><th>Responsable</th></tr></thead>
              <tbody>{filteredMouvements.map((row, index) => {
                const sense = field(row, ["sens", "type_mouvement"]);
                const isEntry = ["entree", "entrée", "in", "credit"].includes(String(sense || "").toLowerCase());
                const rowId = field(row, ["id_mouvement", "id"]);
                return (
                  <tr key={rowId ?? `${field(row, ["date_mouvement", "date_operation", "date"])}-${index}`}>
                    <td>{formatDateTime(field(row, ["date_mouvement", "date_operation", "date"]))}</td>
                    <td><span className={`caisse-direction ${isEntry ? "entry" : "exit"}`}><span aria-hidden="true">{isEntry ? "＋" : "−"}</span>{formatMovementSense(sense)}</span></td>
                    <td>{formatCategory(field(row, ["categorie", "category", "type_operation"]))}</td>
                    <td><strong>{display(field(row, ["libelle", "description", "motif"]))}</strong><small>Réf. {display(field(row, ["reference", "reference_operation", "numero_reference"]))}</small></td>
                    <td className="caisse-amount">{formatMoney(field(row, ["montant"]))}</td>
                    <td>{display(field(row, ["mode_paiement", "mode"]))}</td>
                    <td>{display(field(row, ["utilisateur", "responsable", "nom_utilisateur", "utilisateur_nom"]))}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
      </section>

      {isInitialized && (
        <section className="caisse-panel caisse-close-panel">
          <div className="caisse-panel-heading">
            <div><p className="caisse-eyebrow">FIN DE JOURNÉE / PÉRIODE</p><h2>Clôturer la caisse</h2></div>
          </div>
          <p className="caisse-helper">Le solde théorique est fourni par le Backend ; saisissez le montant réellement compté.</p>
          <form className="caisse-form close-form" onSubmit={handleClose}>
            <label>Montant réellement compté (FCFA)
              <input type="number" min="0" step="0.01" required value={soldeCompte} onChange={(event) => setSoldeCompte(event.target.value)} />
            </label>
            <label className="wide">Commentaire (facultatif)
              <textarea rows="2" value={commentaire} onChange={(event) => setCommentaire(event.target.value)} />
            </label>
            <button className="caisse-button primary" type="submit" disabled={busy === "cloture"}>
              {busy === "cloture" ? "Enregistrement…" : "Enregistrer la clôture"}
            </button>
          </form>
        </section>
      )}

      <section className="caisse-panel">
        <div className="caisse-panel-heading">
          <div><p className="caisse-eyebrow">ARCHIVES</p><h2>Historique des clôtures</h2></div>
          <Clock3 size={19} className="caisse-heading-icon" />
        </div>
        {errors.clotures && <div className="caisse-alert error" role="alert">Clôtures : {errors.clotures}</div>}
        {!errors.clotures && !loading && clotures.length === 0 ? (
          <div className="caisse-empty compact"><span>Aucune clôture enregistrée.</span></div>
        ) : !errors.clotures && (
          <div className="caisse-table-wrap">
            <table className="caisse-table closure-table">
              <thead><tr><th>Date de clôture</th><th>Solde théorique</th><th>Montant compté</th><th>Écart</th><th>Commentaire</th><th>Action</th></tr></thead>
              <tbody>{clotures.map((row, index) => {
                const closureId = field(row, ["id_cloture", "id"]);
                const theoretical = field(row, ["solde_theorique", "solde_theorique_cloture"]);
                const counted = field(row, ["solde_compte", "montant_compte"]);
                const backendDifference = field(row, ["ecart", "difference"]);
                const difference = backendDifference ?? (
                  theoretical !== null && counted !== null
                    ? Number(counted) - Number(theoretical)
                    : null
                );
                return (
                  <tr key={closureId ?? index}>
                    <td>{formatDateTime(field(row, ["date_cloture"]))}</td>
                    <td>{formatMoney(theoretical)}</td>
                    <td>{formatMoney(counted)}</td>
                    <td className={Number(difference) < 0 ? "difference-negative" : "difference-positive"}>{formatMoney(difference)}</td>
                    <td>{display(field(row, ["commentaire"]))}</td>
                    <td>
                      {closureId === null ? "—" : reouvertureId === closureId ? (
                        <form className="caisse-reopen-form" onSubmit={(event) => handleReopen(event, closureId)}>
                          <input aria-label="Motif de réouverture obligatoire" required value={motifReouverture} onChange={(event) => setMotifReouverture(event.target.value)} placeholder="Motif obligatoire" />
                          <button className="caisse-button secondary small" type="submit" disabled={busy === "reouverture"}>Confirmer</button>
                          <button className="caisse-text-button" type="button" onClick={() => { setReouvertureId(null); setMotifReouverture(""); }}>Annuler</button>
                        </form>
                      ) : (
                        <button className="caisse-text-button" type="button" onClick={() => { setActionError(""); setReouvertureId(closureId); }}>Rouvrir</button>
                      )}
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
      </section>

      <section className="caisse-links" aria-label="Modules financiers">
        <div><p className="caisse-eyebrow">MODULES MÉTIER</p><h2>Accéder aux opérations détaillées</h2><span>La caisse centralise les mouvements sans remplacer leur gestion d’origine.</span></div>
        <nav>
          <Link to="/frais">Frais scolaires</Link><Link to="/paiements">Paiements scolaires</Link>
          <Link to="/honoraires">Honoraires</Link><Link to="/paiements-honoraires">Paiements honoraires</Link>
          <Link to="/depenses">Dépenses</Link>
        </nav>
      </section>
    </main>
  );
}
