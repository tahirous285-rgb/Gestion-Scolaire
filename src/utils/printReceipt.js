import { escapeHtml, printHtml } from "./printDocument";

function formatReceiptDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });
}

function formatReceiptMoney(value) {
  if (value === null || value === undefined || value === "") return "—";
  const amount = Number(value);
  return Number.isFinite(amount)
    ? `${amount.toLocaleString("fr-FR")} FCFA`
    : `${String(value)} FCFA`;
}

/**
 * Produit le même contenu métier que le PDF serveur (numéro, montant et date),
 * sans tenter d'ouvrir le chemin de stockage local renvoyé par l'API.
 */
export function printReceipt(receipt) {
  if (!receipt?.numero_recu) {
    return Promise.reject(new Error("Les données du reçu sont incomplètes."));
  }

  const number = escapeHtml(receipt.numero_recu);
  const paymentId = escapeHtml(receipt.id_paiement ?? "—");
  const amount = escapeHtml(formatReceiptMoney(receipt.montant));
  const issuedAt = escapeHtml(formatReceiptDate(receipt.date_emission));

  const bodyHtml = `
    <main class="doc" style="padding:24px;">
      <section style="min-height:150mm;border:1px solid #d8deea;border-radius:14px;overflow:hidden;box-shadow:0 8px 28px rgba(30,58,138,.08);">
        <header style="padding:24px 28px;background:linear-gradient(135deg,#172554,#1e40af);color:#fff;">
          <p style="font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;opacity:.75;">Gestion scolaire</p>
          <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-top:8px;">
            <h1 style="font-size:25px;letter-spacing:-.03em;">Reçu de paiement</h1>
            <strong style="font-size:14px;">${number}</strong>
          </div>
        </header>

        <div style="padding:30px 28px;">
          <p class="muted" style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;">Montant reçu</p>
          <p style="margin-top:6px;color:#1e3a8a;font-size:30px;font-weight:800;letter-spacing:-.04em;">${amount}</p>

          <table style="margin-top:28px;">
            <tbody>
              <tr><th style="width:42%;">Numéro de reçu</th><td><strong>${number}</strong></td></tr>
              <tr><th>Identifiant du paiement</th><td>#${paymentId}</td></tr>
              <tr><th>Date d’émission</th><td>${issuedAt}</td></tr>
            </tbody>
          </table>

          <div style="display:flex;justify-content:space-between;gap:24px;margin-top:52px;">
            <div style="width:44%;padding-top:8px;border-top:1px solid #94a3b8;color:#64748b;font-size:11px;">Cachet de l’établissement</div>
            <div style="width:44%;padding-top:8px;border-top:1px solid #94a3b8;color:#64748b;font-size:11px;text-align:right;">Signature</div>
          </div>
        </div>

        <footer style="margin:20px 28px 0;padding:14px 0;border-top:1px solid #e5e7eb;color:#64748b;font-size:10px;line-height:1.5;">
          Reçu établi à partir des informations enregistrées pour le paiement #${paymentId}.
        </footer>
      </section>
    </main>`;

  return printHtml(`Reçu ${receipt.numero_recu}`, bodyHtml);
}
