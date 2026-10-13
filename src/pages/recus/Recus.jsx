import { useState } from "react";
import { generateRecuPdf, getRecuByPaiement, printRecu } from "../../services/recusApi";
import { userId } from "../../services/apiClient";
import { printReceipt } from "../../utils/printReceipt";
import { formatDateTime, formatMoney } from "../pageUtils";

const initialStatus = {
  kind: "idle",
  text: "Saisissez l’identifiant d’un paiement pour retrouver le reçu associé.",
};

export default function Recus() {
  const [paymentId, setPaymentId] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [searching, setSearching] = useState(false);
  const [action, setAction] = useState("");
  const [status, setStatus] = useState(initialStatus);

  const busy = searching || Boolean(action);

  async function search(event) {
    event.preventDefault();
    if (searching) return;

    const normalizedId = paymentId.trim();
    if (!normalizedId) {
      setReceipt(null);
      setStatus({ kind: "error", text: "Saisissez un identifiant de paiement avant de lancer la recherche." });
      return;
    }

    const numericId = Number(normalizedId);
    if (!Number.isInteger(numericId) || numericId < 1) {
      setReceipt(null);
      setStatus({ kind: "error", text: "L’identifiant de paiement doit être un nombre entier supérieur à zéro." });
      return;
    }

    setSearching(true);
    setReceipt(null);
    setStatus({ kind: "loading", text: `Recherche du reçu lié au paiement #${numericId}…` });
    try {
      const foundReceipt = await getRecuByPaiement(numericId);
      if (!foundReceipt) {
        setStatus({ kind: "not-found", text: `Aucun reçu n’a été trouvé pour le paiement #${numericId}.` });
        return;
      }
      setReceipt(foundReceipt);
      setStatus({ kind: "found", text: `Reçu ${foundReceipt.numero_recu || `#${foundReceipt.id_recu}`} trouvé.` });
    } catch (requestError) {
      if (requestError?.status === 404) {
        setStatus({ kind: "not-found", text: `Aucun reçu n’a été trouvé pour le paiement #${numericId}.` });
      } else {
        setStatus({
          kind: "error",
          text: `La recherche du reçu a échoué : ${requestError?.message || "erreur réseau"}`,
        });
      }
    } finally {
      setSearching(false);
    }
  }

  async function generateServerPdf() {
    if (!receipt || action) return;
    setAction("pdf");
    setStatus({ kind: "loading", text: "Génération du PDF sur le serveur…" });
    try {
      const updatedReceipt = await generateRecuPdf(receipt.id_recu);
      if (updatedReceipt) setReceipt(updatedReceipt);
      if (updatedReceipt?.pdf) {
        setStatus({
          kind: "warning",
          text: "Le PDF a été créé dans le stockage local du serveur. L’API renvoie son chemin, mais ne fournit ni URL publique ni téléchargement de fichier.",
        });
      } else {
        setStatus({
          kind: "warning",
          text: "La requête a abouti, mais l’API n’a retourné aucun chemin PDF téléchargeable.",
        });
      }
    } catch (requestError) {
      setStatus({
        kind: "error",
        text: `La génération du PDF serveur a échoué : ${requestError?.message || "erreur réseau"}`,
      });
    } finally {
      setAction("");
    }
  }

  async function openPrintDialog() {
    if (!receipt || action) return;
    setAction("print");
    setStatus({ kind: "loading", text: "Préparation de l’aperçu et du dialogue d’impression…" });
    try {
      const result = await printReceipt(receipt);
      const closedWithoutPrint = result?.status === "not-printed" || result?.status === "closed";
      setStatus({
        kind: "warning",
        text: closedWithoutPrint
          ? "L’aperçu a été fermé sans confirmation d’impression."
          : "Le dialogue d’impression a été fermé. Le navigateur ne permet pas de confirmer si l’impression a été réalisée ou annulée.",
      });
    } catch (printError) {
      setStatus({
        kind: "error",
        text: `Impossible de préparer l’impression : ${printError?.message || "erreur inconnue"}`,
      });
    } finally {
      setAction("");
    }
  }

  async function markAsPrinted() {
    if (!receipt || action) return;
    const printerId = userId();
    if (!printerId) {
      setStatus({ kind: "error", text: "L’utilisateur connecté ne possède pas d’identifiant permettant de marquer ce reçu comme imprimé." });
      return;
    }

    setAction("mark");
    setStatus({ kind: "loading", text: "Mise à jour du statut d’impression…" });
    try {
      const updatedReceipt = await printRecu(receipt.id_recu, printerId);
      if (updatedReceipt) setReceipt(updatedReceipt);
      setStatus({ kind: "found", text: "Le reçu a été marqué comme imprimé par le serveur." });
    } catch (requestError) {
      setStatus({
        kind: "error",
        text: `La mise à jour du statut d’impression a échoué : ${requestError?.message || "erreur réseau"}`,
      });
    } finally {
      setAction("");
    }
  }

  return (
    <div className="crud-page">
      <div className="crud-header">
        <div>
          <div className="crud-eyebrow">Finance</div>
          <h1>🧾 Reçus</h1>
          <p>Retrouvez un reçu à partir de l’identifiant du paiement, puis imprimez-le depuis votre navigateur.</p>
        </div>
      </div>
      <section className="inline-panel receipt-search-panel" aria-labelledby="receipt-search-title">
        <div className="inline-panel-heading">
          <div>
            <h2 id="receipt-search-title">Rechercher un reçu</h2>
            <p>La recherche porte sur l’identifiant numérique du paiement.</p>
          </div>
        </div>
        <form className="inline-form receipt-search" onSubmit={search} noValidate>
          <label htmlFor="receipt-payment-id">
            Identifiant du paiement *
            <input
              id="receipt-payment-id"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              placeholder="Ex. 125"
              value={paymentId}
              disabled={busy}
              onChange={(event) => setPaymentId(event.target.value)}
            />
          </label>
          <button className="crud-primary" type="submit" disabled={busy}>
            {searching ? "Recherche…" : "Rechercher"}
          </button>
        </form>
      </section>

      <div className={`receipt-status ${status.kind}`} role={status.kind === "error" ? "alert" : "status"} aria-live="polite">
        {status.kind === "loading" && <span className="receipt-status-spinner" aria-hidden="true" />}
        <span>{status.text}</span>
      </div>

      {receipt && (
        <section className="receipt-card" aria-labelledby="receipt-title">
          <div className="receipt-card-head">
            <div>
              <span className="crud-eyebrow">Reçu {receipt.numero_recu || `#${receipt.id_recu}`}</span>
              <h2 id="receipt-title">Paiement #{receipt.id_paiement}</h2>
            </div>
            <span className={`status-badge ${receipt.imprime ? "success" : "warning"}`}>
              {receipt.imprime ? "Marqué imprimé" : "Non marqué imprimé"}
            </span>
          </div>

          <div className="receipt-grid">
            <div><span>ID reçu</span><strong>{receipt.id_recu}</strong></div>
            <div><span>Numéro du reçu</span><strong>{receipt.numero_recu}</strong></div>
            <div><span>Montant</span><strong>{formatMoney(receipt.montant)}</strong></div>
            <div><span>Date d’émission</span><strong>{formatDateTime(receipt.date_emission)}</strong></div>
            <div><span>ID paiement</span><strong>{receipt.id_paiement}</strong></div>
            <div><span>Date d’impression enregistrée</span><strong>{formatDateTime(receipt.date_impression)}</strong></div>
            <div><span>ID imprimeur</span><strong>{receipt.id_imprimeur ?? "—"}</strong></div>
            <div>
              <span>PDF serveur</span>
              <strong>{receipt.pdf ? "Généré (non téléchargeable)" : "Non généré"}</strong>
            </div>
          </div>

          {receipt.pdf && (
            <div className="receipt-pdf-note">
              <strong>Chemin retourné par l’API</strong>
              <code>{receipt.pdf}</code>
              <span>Ce chemin désigne le stockage local du serveur. Il n’est pas ouvert comme une URL, car le backend ne l’expose pas publiquement.</span>
            </div>
          )}

          <div className="receipt-actions">
            <button className="crud-secondary" type="button" disabled={busy} onClick={generateServerPdf}>
              {action === "pdf" ? "Génération…" : "📄 Générer le PDF serveur"}
            </button>
            <button className="crud-primary" type="button" disabled={busy} onClick={openPrintDialog}>
              {action === "print" ? "Préparation…" : "🖨 Imprimer"}
            </button>
            <button className="crud-secondary" type="button" disabled={busy || receipt.imprime} onClick={markAsPrinted}>
              {action === "mark" ? "Mise à jour…" : receipt.imprime ? "Déjà marqué imprimé" : "Marquer comme imprimé"}
            </button>
          </div>
          <p className="receipt-action-help">
            « Imprimer » ouvre réellement l’aperçu et le dialogue du navigateur. Le statut serveur n’est pas modifié automatiquement,
            car le navigateur ne permet pas de savoir si vous avez imprimé ou annulé.
          </p>
        </section>
      )}

      {!receipt && !searching && (
        <section className="unavailable-card receipt-empty-state">
          <div className="unavailable-icon" aria-hidden="true">🧾</div>
          <h2>{status.kind === "not-found" ? "Aucun reçu trouvé" : "Recherche par paiement"}</h2>
          <p>
            {status.kind === "not-found"
              ? "Vérifiez l’identifiant saisi ou recherchez un autre paiement."
              : "Saisissez un identifiant de paiement pour afficher les informations réelles de son reçu."}
          </p>
          <small>Le backend ne propose pas de liste globale des reçus ; cela n’empêche pas la recherche individuelle.</small>
        </section>
      )}
    </div>
  );
}
