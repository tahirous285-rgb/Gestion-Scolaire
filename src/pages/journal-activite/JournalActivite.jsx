import { useEffect, useState } from "react";
import { AlertCircle, ClipboardList, RefreshCw } from "lucide-react";

import { establishmentId } from "../../services/apiClient";
import { getJournal } from "../../services/administrationApi";

import "./JournalActivite.css";

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function JournalActivite() {
  const [entries, setEntries] = useState([]);
  const [limit, setLimit] = useState("20");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadJournal() {
    try {
      setLoading(true);
      setError("");
      const data = await getJournal(establishmentId(), Number(limit));
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Impossible de charger le journal d’activité.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJournal();
  }, [limit]);

  return (
    <div className="activity-log-page">
      <header className="activity-log-header">
        <div>
          <span className="activity-log-eyebrow">ADMINISTRATION</span>
          <h1>Journal d’activité</h1>
          <p>Consultation des activités enregistrées pour votre établissement.</p>
        </div>
        <div className="activity-log-actions">
          <label htmlFor="activity-limit">Afficher</label>
          <select id="activity-limit" value={limit} onChange={(event) => setLimit(event.target.value)}>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <button type="button" onClick={loadJournal} disabled={loading} aria-label="Actualiser le journal" title="Actualiser">
            <RefreshCw size={17} />
          </button>
        </div>
      </header>

      {error && <div className="activity-log-alert"><AlertCircle size={18} /><span>{error}</span></div>}

      <section className="activity-log-card">
        {loading ? (
          <div className="activity-log-state">Chargement du journal...</div>
        ) : entries.length === 0 ? (
          <div className="activity-log-state"><ClipboardList size={34} /><h2>Aucune activité</h2><p>Le journal ne contient aucune entrée pour cet établissement.</p></div>
        ) : (
          <div className="activity-log-table-wrap"><table className="activity-log-table"><thead><tr><th>Date</th><th>Action</th><th>Module</th><th>Cible</th><th>Utilisateur</th><th>Adresse IP</th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.id_journal}><td>{formatDate(entry.date_action)}</td><td><strong>{entry.action}</strong></td><td>{entry.module || "—"}</td><td>{entry.table_cible ? `${entry.table_cible}${entry.id_cible ? ` #${entry.id_cible}` : ""}` : "—"}</td><td>{entry.id_utilisateur ?? "—"}</td><td>{entry.adresse_ip || "—"}</td></tr>)}</tbody></table></div>
        )}
      </section>
    </div>
  );
}
