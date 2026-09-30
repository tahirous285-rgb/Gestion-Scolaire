/** Ouvre une fenêtre d’impression (Enregistrer au format PDF dans le dialogue). */
export function printHtml(title, bodyHtml, { landscape = false } = {}) {
  const popup = window.open("", "_blank", "noopener,noreferrer,width=920,height=740");
  if (!popup) {
    throw new Error("Autorisez les fenêtres pop-up pour imprimer le document.");
  }

  popup.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: ${landscape ? "A4 landscape" : "A4"}; margin: 12mm; }
    * { box-sizing: border-box; }
    body { font-family: "Segoe UI", Arial, sans-serif; color: #111827; margin: 0; background: #fff; }
    .doc { max-width: 210mm; margin: 0 auto; }
    h1, h2, p { margin: 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #d1d5db; padding: 6px 8px; font-size: 12px; }
    th { background: #f3f4f6; text-align: left; }
    .muted { color: #6b7280; }
    .print-bar { display: flex; justify-content: flex-end; gap: 8px; padding: 10px 12px; background: #111827; }
    .print-bar button { border: 0; background: #2563eb; color: #fff; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-weight: 600; }
    @media print { .print-bar { display: none; } }
  </style>
</head>
<body>
  <div class="print-bar">
    <button type="button" onclick="window.print()">Imprimer / PDF</button>
  </div>
  ${bodyHtml}
</body>
</html>`);
  popup.document.close();
  popup.focus();
  setTimeout(() => {
    try {
      popup.print();
    } catch {
      /* l’utilisateur peut cliquer sur le bouton */
    }
  }, 400);
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatFrDate(value) {
  if (!value) return "—";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("fr-FR");
}
