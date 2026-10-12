import { escapeHtml, formatFrDate, prepareAndPrintDocument } from "./printDocument";

function formatAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount) + " FCFA";
}

function formatIssueDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatFrDate(value);
  return date.toLocaleString("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

/**
 * Prépare un reçu imprimable à partir des champs que l'API fournit réellement.
 * L'impression se fait localement via le dialogue du navigateur; aucun PDF serveur
 * inexistant n'est présenté comme un fichier déjà téléchargé.
 */
export function printReceiptDocument(receipt) {
  if (!receipt || typeof receipt !== "object") {
    return Promise.reject(new Error("Aucun reçu n’est disponible pour l’impression."));
  }

  return prepareAndPrintDocument(async (printContext) => {
    printContext.setStatus("Préparation du reçu de paiement…");

    const receiptNumber = receipt.numero_recu ?? receipt.id_recu ?? "—";
    const paymentReference = receipt.id_paiement ?? "—";
    const issuedAt = formatIssueDate(receipt.date_emission);
    const amount = formatAmount(receipt.montant);
    const printedAt = new Date().toLocaleDateString("fr-FR", { dateStyle: "long" });

    const bodyHtml = `
      <main class="doc" style="padding:22px 8px 30px;">
        <header style="display:flex;justify-content:space-between;align-items:flex-start;gap:20px;padding:0 0 18px;border-bottom:3px solid #1d3673;">
          <div>
            <p style="margin:0 0 7px;color:#52617b;font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;">Gestion scolaire</p>
            <h1 style="margin:0;color:#172b57;font-size:26px;letter-spacing:-.04em;">Reçu de paiement</h1>
            <p style="margin:8px 0 0;color:#64748b;font-size:12px;">Justificatif du paiement enregistré dans le système</p>
          </div>
          <div style="min-width:118px;padding:12px;border:1px solid #dbe4f2;border-radius:10px;background:#f5f8ff;text-align:center;">
            <span style="display:block;color:#64748b;font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;">N° reçu</span>
            <strong style="display:block;margin-top:5px;color:#1d3673;font-size:18px;">${escapeHtml(receiptNumber)}</strong>
          </div>
        </header>

        <section style="margin:24px 0 20px;padding:18px;border:1px solid #dbe4f2;border-radius:12px;">
          <p style="margin:0 0 8px;color:#64748b;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;">Montant enregistré</p>
          <p style="margin:0;color:#172b57;font-size:30px;font-weight:800;letter-spacing:-.04em;">${escapeHtml(amount)}</p>
        </section>

        <table style="margin-bottom:22px;border-collapse:collapse;width:100%;">
          <tbody>
            <tr>
              <th style="width:38%;padding:12px;text-align:left;border:1px solid #dbe4f2;background:#f5f7fb;font-size:11px;">Référence du paiement</th>
              <td style="padding:12px;border:1px solid #dbe4f2;font-size:12px;">${escapeHtml(paymentReference)}</td>
            </tr>
            <tr>
              <th style="padding:12px;text-align:left;border:1px solid #dbe4f2;background:#f5f7fb;font-size:11px;">Date d’émission</th>
              <td style="padding:12px;border:1px solid #dbe4f2;font-size:12px;">${escapeHtml(issuedAt)}</td>
            </tr>
            <tr>
              <th style="padding:12px;text-align:left;border:1px solid #dbe4f2;background:#f5f7fb;font-size:11px;">État du reçu dans le système</th>
              <td style="padding:12px;border:1px solid #dbe4f2;font-size:12px;">${receipt.imprime ? "Déjà marqué comme imprimé" : "Non marqué comme imprimé"}</td>
            </tr>
          </tbody>
        </table>

        <p style="margin:0;color:#475569;font-size:11px;line-height:1.6;">
          Ce document reprend les informations renvoyées par le système pour le reçu sélectionné.
          Conservez-le comme référence du paiement.
        </p>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:54px;">
          <div style="padding-top:10px;border-top:1px solid #94a3b8;color:#475569;font-size:11px;">Signature du responsable</div>
          <div style="padding-top:10px;border-top:1px solid #94a3b8;color:#475569;font-size:11px;">Cachet de l’établissement</div>
        </div>
        <footer style="margin-top:34px;padding-top:10px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:9px;">
          Document préparé le ${escapeHtml(printedAt)} · Référence interne : reçu ${escapeHtml(receiptNumber)}
        </footer>
      </main>
    `;

    return { title: "Reçu de paiement — " + receiptNumber, bodyHtml };
  });
}
