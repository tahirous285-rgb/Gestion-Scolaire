import { useState } from "react";
import BackendUnavailable from "../../components/common/BackendUnavailable";
import {
  generateRecuPdf,
  getRecuByPaiement,
  printRecu as markReceiptPrinted,
} from "../../services/recusApi";
import { userId } from "../../services/apiClient";
import { formatDateTime, formatMoney } from "../pageUtils";
import { printReceiptDocument } from "../../utils/printReceipt";

export default function Recus() {
  const [paymentId, setPaymentId] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function search(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setReceipt(null);
    try {
      setReceipt(await getRecuByPaiement(paymentId));
    } catch (requestError) {
      setError("Chargement du reçu impossible : " + (requestError.message || "erreur réseau"));
    } finally {
      setLoading(false);
    }
  }

  async function runReceiptAction(request, successMessage, errorPrefix) {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const nextReceipt = await request();
      if (nextReceipt) setReceipt(nextReceipt);
      setMessage(successMessage);
    } catch (requestError) {
      setError(errorPrefix + " : " + (requestError.message || "erreur réseau"));
    } finally {
      setLoading(false);
    }
  }

  async function printLocally() {
    if (!receipt) return;
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await printReceiptDocument(receipt);

      if (result?.status !== "dialog-closed") {
        setMessage("Le reçu n’a pas été marqué comme imprimé. Vous pourrez réessayer depuis cette page.");
        return;
      }

      const confirmed = window.confirm(
        "Le dialogue d’impression est fermé. Le navigateur ne peut pas confirmer que le reçu est réellement sorti de l’imprimante.\n\nOK : confirmer l’impression et mettre à jour le statut du reçu.\nAnnuler : conserver le reçu comme non confirmé.",
      );

      if (!confirmed) {
        setMessage("Impression non confirmée : le statut du reçu n’a pas été modifié.");
        return;
      }

      const idImprimeur = userId();
      if (!idImprimeur) {
        throw new Error("L’identifiant de l’utilisateur connecté est indisponible. Le statut n’a pas été modifié.");
      }

      const nextReceipt = await markReceiptPrinted(receipt.id_recu, idImprimeur);
      if (nextReceipt) setReceipt(nextReceipt);
      setMessage("Impression confirmée et statut du reçu mis à jour.");
    } catch (requestError) {
      setError("Impression ou mise à jour du reçu impossible : " + (requestError.message || "erreur inattendue"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="crud-page">
      <div className="crud-header">
        <div>
          <div className="crud-eyebrow">Finance</div>
          <h1>🧾 Reçus</h1>
          <p>Recherchez un reçu par identifiant de paiement, puis imprimez-le ou enregistrez-le en PDF depuis le navigateur.</p>
        </div>
      </div>

      <div className="crud-alert info-alert">
        <span>
          La liste globale des reçus n’est pas exposée par l’API : la recherche se fait avec l’identifiant du paiement.
          La génération PDF serveur renvoie un chemin de fichier, pas un téléchargement binaire. Pour obtenir un document,
          utilisez « Imprimer / PDF » et choisissez une imprimante ou « Enregistrer au format PDF ».
        </span>
      </div>

      <section className="inline-panel">
        <div className="inline-panel-heading">
          <div>
            <h2>Rechercher un reçu</h2>
            <p>Entrez l’identifiant du paiement associé.</p>
          </div>
        </div>
        <form className="inline-form receipt-search" onSubmit={search}>
          <label>
            ID paiement *
            <input
              type="number"
              min="1"
              required
              value={paymentId}
              onChange={(event) => setPaymentId(event.target.value)}
              placeholder="Ex. : 12"
            />
          </label>
          <button className="crud-primary" type="submit" disabled={loading}>
            {loading ? "Chargement…" : "Rechercher"}
          </button>
        </form>
      </section>

      {error && <div className="crud-alert" role="alert">⚠️ {error}</div>}
      {message && <div className="success-message" role="status">✓ {message}</div>}

      {receipt && (
        <section className="receipt-card">
          <div className="receipt-card-head">
            <div>
              <span className="crud-eyebrow">Reçu #{receipt.numero_recu || receipt.id_recu}</span>
              <h2>Reçu du paiement #{receipt.id_paiement}</h2>
            </div>
            <span className={"status-badge " + (receipt.imprime ? "success" : "warning")}>
              {receipt.imprime ? "Imprimé" : "Non imprimé"}
            </span>
          </div>

          <div className="receipt-grid">
            <div><span>Montant</span><strong>{formatMoney(receipt.montant)}</strong></div>
            <div><span>Émis le</span><strong>{formatDateTime(receipt.date_emission)}</strong></div>
            <div><span>Chemin PDF serveur</span><strong>{receipt.pdf || "Non généré"}</strong></div>
            <div><span>Dernière impression enregistrée</span><strong>{formatDateTime(receipt.date_impression)}</strong></div>
          </div>

          <div className="receipt-actions">
            <button
              className="crud-secondary"
              type="button"
              disabled={loading}
              onClick={() => runReceiptAction(
                () => generateRecuPdf(receipt.id_recu),
                "La demande de génération serveur a abouti. Si le backend renvoie un chemin, aucun fichier binaire n’est téléchargé automatiquement.",
                "Génération PDF serveur impossible",
              )}
            >
              📄 Générer PDF serveur
            </button>
            <button
              className="crud-primary"
              type="button"
              disabled={loading}
              onClick={printLocally}
            >
              {loading ? "Préparation…" : "🖨 Imprimer / PDF"}
            </button>
          </div>
        </section>
      )}

      {!receipt && !loading && !error && (
        <div className="unavailable-card">
          <div className="unavailable-icon">🧾</div>
          <h2>Aucun reçu sélectionné</h2>
          <p>Recherchez le reçu à partir de l’identifiant d’un paiement existant.</p>
          <BackendUnavailable>La liste globale des reçus n’est pas disponible côté backend.</BackendUnavailable>
        </div>
      )}
    </div>
  );
}
