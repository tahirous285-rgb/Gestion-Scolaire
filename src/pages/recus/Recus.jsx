import { useState } from "react";
import BackendUnavailable from "../../components/common/BackendUnavailable";
import { generateRecuPdf, getRecuByPaiement, printRecu } from "../../services/recusApi";
import { userId } from "../../services/apiClient";
import { formatDateTime, formatMoney } from "../pageUtils";

export default function Recus() {
  const [paymentId, setPaymentId] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function search(event) {
    event.preventDefault(); setLoading(true); setError(""); setMessage(""); setReceipt(null);
    try { setReceipt(await getRecuByPaiement(paymentId)); } catch (requestError) { setError(requestError.message || "Reçu introuvable."); }
    finally { setLoading(false); }
  }
  async function action(request, successMessage) {
    setLoading(true); setError(""); setMessage("");
    try { const next = await request(); setReceipt(next); setMessage(successMessage); } catch (requestError) { setError(requestError.message || "Action impossible."); }
    finally { setLoading(false); }
  }
  return <div className="crud-page"><div className="crud-header"><div><div className="crud-eyebrow">Finance</div><h1>🧾 Reçus</h1><p>Le backend expose un reçu à partir de l’identifiant du paiement.</p></div></div><div className="crud-alert info-alert"><span>Il n’existe pas d’endpoint de liste globale des reçus : la recherche utilise exactement <code>/recus/paiement/&#123;id_paiement&#125;</code>.</span></div><section className="inline-panel"><form className="inline-form receipt-search" onSubmit={search}><label>ID paiement *<input type="number" min="1" required value={paymentId} onChange={(event) => setPaymentId(event.target.value)} /></label><button className="crud-primary" disabled={loading}>{loading ? "Recherche…" : "Rechercher"}</button></form></section>{error && <div className="crud-alert">⚠️ {error}</div>}{message && <div className="success-message">✓ {message}</div>}{receipt && <section className="receipt-card"><div className="receipt-card-head"><div><span className="crud-eyebrow">Reçu #{receipt.numero_recu}</span><h2>Reçu du paiement #{receipt.id_paiement}</h2></div><span className={`status-badge ${receipt.imprime ? "success" : "warning"}`}>{receipt.imprime ? "Imprimé" : "Non imprimé"}</span></div><div className="receipt-grid"><div><span>Montant</span><strong>{formatMoney(receipt.montant)}</strong></div><div><span>Émis le</span><strong>{formatDateTime(receipt.date_emission)}</strong></div><div><span>PDF</span><strong>{receipt.pdf || "Non généré"}</strong></div><div><span>Impression</span><strong>{formatDateTime(receipt.date_impression)}</strong></div></div><div className="receipt-actions"><button className="crud-secondary" type="button" disabled={loading} onClick={() => action(() => generateRecuPdf(receipt.id_recu), "Le PDF du reçu a été généré.")}>📄 Générer PDF</button><button className="crud-primary" type="button" disabled={loading} onClick={() => action(() => printRecu(receipt.id_recu, userId()), "Le reçu a été marqué comme imprimé.")}>🖨 Marquer imprimé</button></div></section>}{!receipt && !loading && <div className="unavailable-card"><div className="unavailable-icon">🧾</div><p>Recherchez un paiement pour consulter son reçu.</p><BackendUnavailable>la liste globale des reçus n’est pas disponible côté backend.</BackendUnavailable></div>}</div>;
}
