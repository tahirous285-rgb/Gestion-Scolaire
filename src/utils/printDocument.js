const PRINT_ASSET_TIMEOUT_MS = 15000;
const PRINT_DIALOG_WATCHDOG_MS = 12000;

const FALLBACK_STYLES = `
  .print-fallback-overlay { position: fixed; z-index: 2147483000; inset: 0; display: grid; place-items: center; padding: 18px; background: rgba(15, 23, 42, .72); color: #172033; font: 14px/1.45 Arial, sans-serif; }
  .print-fallback-dialog { display: flex; flex-direction: column; width: min(1180px, 100%); height: min(900px, 96vh); overflow: hidden; border-radius: 14px; background: #fff; box-shadow: 0 24px 80px rgba(0, 0, 0, .3); }
  .print-fallback-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 15px 18px; border-bottom: 1px solid #dbe2ee; }
  .print-fallback-head h2 { margin: 0; color: #172033; font-size: 18px; }
  .print-fallback-head p { margin: 4px 0 0; color: #536078; font-size: 12px; }
  .print-fallback-actions { display: flex; flex: 0 0 auto; gap: 8px; }
  .print-fallback-actions button { min-height: 38px; padding: 0 13px; border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; color: #29364f; font-weight: 700; cursor: pointer; }
  .print-fallback-actions button:first-child { border-color: #2563eb; background: #2563eb; color: #fff; }
  .print-fallback-actions button:disabled { cursor: not-allowed; opacity: .55; }
  .print-fallback-status { min-height: 18px; padding: 0 18px 10px; color: #475569; font-size: 12px; }
  .print-fallback-error { margin: 0 18px 12px; padding: 12px; border: 1px solid #fecaca; border-radius: 8px; background: #fff1f2; color: #9f1239; white-space: pre-wrap; }
  .print-fallback-frame { display: block; flex: 1; width: 100%; min-height: 0; border: 0; background: #fff; }
  @media (max-width: 650px) { .print-fallback-overlay { padding: 0; }.print-fallback-dialog { width: 100%; height: 100%; border-radius: 0; }.print-fallback-head { align-items: flex-start; flex-direction: column; }.print-fallback-actions { width: 100%; }.print-fallback-actions button { flex: 1; } }
`;

function safeErrorMessage(error) {
  return error?.message || "Une erreur est survenue pendant la préparation du document.";
}

function writeDocument(targetWindow, html) {
  const document = targetWindow.document;
  document.open();
  document.write(html);
  document.close();
}

function baseDocument(title, bodyHtml, { landscape = false, preparing = false } = {}) {
  const status = preparing ? "Préparation du document…" : "Document prêt.";
  const content = preparing
    ? '<main class="print-loading" role="status">Préparation du document…</main>'
    : bodyHtml;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: ${landscape ? "A4 landscape" : "A4"}; margin: 12mm; }
    * { box-sizing: border-box; }
    html { color-scheme: light; }
    body { font-family: "Segoe UI", Arial, sans-serif; color: #111827; margin: 0; background: #fff; }
    .doc { max-width: ${landscape ? "273mm" : "186mm"}; margin: 0 auto; }
    h1, h2, p { margin: 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #d1d5db; padding: 6px 8px; font-size: 12px; }
    th { background: #f3f4f6; text-align: left; }
    .muted { color: #6b7280; }
    .print-toolbar { position: sticky; z-index: 1; top: 0; display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 8px; padding: 10px 12px; background: #111827; color: #fff; }
    .print-toolbar button { min-height: 36px; border: 0; background: #2563eb; color: #fff; padding: 7px 14px; border-radius: 8px; cursor: pointer; font-weight: 700; }
    .print-toolbar button.secondary { background: #475569; }
    .print-toolbar button:disabled { cursor: not-allowed; opacity: .6; }
    .print-status { margin-right: auto; font-size: 12px; line-height: 1.4; }
    .print-loading { padding: 48px 24px; color: #475569; text-align: center; }
    @media print {
      .print-toolbar { display: none !important; }
      body { background: #fff; }
      .doc { max-width: none; }
      a { color: inherit; text-decoration: none; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="print-toolbar">
    <span id="print-status" class="print-status" role="status">${escapeHtml(status)}</span>
    <button id="print-button" type="button" ${preparing ? "disabled" : ""}>Imprimer / PDF</button>
    <button id="print-finish-button" class="secondary" type="button" ${preparing ? "disabled" : ""}>Terminer sans impression</button>
  </div>
  ${content}
</body>
</html>`;
}

function createFallbackViewer() {
  const style = document.createElement("style");
  style.textContent = FALLBACK_STYLES;
  document.head.appendChild(style);

  const overlay = document.createElement("div");
  overlay.className = "print-fallback-overlay";
  overlay.setAttribute("role", "presentation");
  overlay.innerHTML = `
    <section class="print-fallback-dialog" role="dialog" aria-modal="true" aria-labelledby="print-fallback-title">
      <header class="print-fallback-head">
        <div>
          <h2 id="print-fallback-title">Aperçu d’impression</h2>
          <p>Le navigateur a bloqué la fenêtre séparée. Le document restera disponible ici; utilisez le bouton pour imprimer ou enregistrer en PDF.</p>
        </div>
        <div class="print-fallback-actions">
          <button type="button" data-print-fallback-print disabled>Imprimer / PDF</button>
          <button type="button" data-print-fallback-close disabled>Fermer</button>
        </div>
      </header>
      <div class="print-fallback-status" data-print-fallback-status role="status">Chargement des données…</div>
      <div class="print-fallback-error" data-print-fallback-error role="alert" hidden></div>
      <iframe class="print-fallback-frame" title="Document à imprimer" data-print-fallback-frame hidden></iframe>
    </section>`;
  document.body.appendChild(overlay);

  return {
    overlay,
    style,
    frame: overlay.querySelector("[data-print-fallback-frame]"),
    printButton: overlay.querySelector("[data-print-fallback-print]"),
    closeButton: overlay.querySelector("[data-print-fallback-close]"),
    status: overlay.querySelector("[data-print-fallback-status]"),
    error: overlay.querySelector("[data-print-fallback-error]"),
    dispose() {
      overlay.remove();
      style.remove();
    },
  };
}

function waitForImage(image) {
  const decode = () => {
    if (typeof image.decode !== "function") return Promise.resolve();
    return image.decode().catch(() => undefined);
  };

  if (image.complete) return decode();

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      image.removeEventListener("load", finish);
      image.removeEventListener("error", finish);
      decode().then(resolve);
    };
    image.addEventListener("load", finish, { once: true });
    image.addEventListener("error", finish, { once: true });
    if (image.complete) finish();
  });
}

async function waitForPrintableAssets(targetDocument) {
  const images = Array.from(targetDocument.images || []);
  const imageTasks = images.map(waitForImage);
  const fontsTask = targetDocument.fonts?.ready
    ? Promise.resolve(targetDocument.fonts.ready).catch(() => undefined)
    : Promise.resolve();
  let timeoutId;
  const allAssets = Promise.allSettled([...imageTasks, fontsTask]).then(() => "ready");
  const timeout = new Promise((resolve) => {
    timeoutId = window.setTimeout(() => resolve("timeout"), PRINT_ASSET_TIMEOUT_MS);
  });
  const result = await Promise.race([allAssets, timeout]);
  window.clearTimeout(timeoutId);

  return {
    ready: result === "ready",
    timedOut: result === "timeout",
    brokenImages: images.filter((image) => image.complete && image.naturalWidth === 0).length,
    pendingImages: images.filter((image) => !image.complete).length,
  };
}

function createPrintSession(targetWindow, targetDocument, {
  externalPrintButton = null,
  externalFinishButton = null,
  setStatus = () => {},
  onFinish = () => {},
} = {}) {
  let resolveSession;
  let settled = false;
  let printing = false;
  let watchdogId;
  const promise = new Promise((resolve) => {
    resolveSession = resolve;
  });
  const printButton = targetDocument.getElementById("print-button");
  const finishButton = targetDocument.getElementById("print-finish-button");

  function finish(result) {
    if (settled) return;
    settled = true;
    printing = false;
    window.clearTimeout(watchdogId);
    if (printButton) printButton.disabled = true;
    if (finishButton) finishButton.disabled = true;
    if (externalPrintButton) externalPrintButton.disabled = true;
    if (externalFinishButton) externalFinishButton.disabled = true;
    targetWindow.removeEventListener("afterprint", onAfterPrint);
    targetWindow.removeEventListener("beforeunload", onBeforeUnload);
    resolveSession(result);
    onFinish(result);
  }

  function updateStatus(message) {
    const status = targetDocument.getElementById("print-status");
    if (status) status.textContent = message;
    setStatus(message);
  }

  function requestPrint() {
    if (settled || printing) return;
    printing = true;
    if (printButton) printButton.disabled = true;
    if (externalPrintButton) externalPrintButton.disabled = true;
    updateStatus("Le dialogue d’impression est en cours. Après sa fermeture, confirmez uniquement si le document a réellement été imprimé.");
    watchdogId = window.setTimeout(() => {
      if (settled || !printing) return;
      printing = false;
      watchdogId = null;
      if (printButton) printButton.disabled = false;
      if (externalPrintButton) externalPrintButton.disabled = false;
      updateStatus("Le navigateur n’a pas signalé la fermeture du dialogue. Vous pouvez réessayer ou terminer sans impression.");
    }, PRINT_DIALOG_WATCHDOG_MS);

    try {
      targetWindow.focus?.();
      targetWindow.print();
    } catch {
      window.clearTimeout(watchdogId);
      watchdogId = null;
      printing = false;
      if (printButton) printButton.disabled = false;
      if (externalPrintButton) externalPrintButton.disabled = false;
      updateStatus("L’impression automatique n’a pas pu démarrer. Cliquez sur « Imprimer / PDF » ou terminez sans impression.");
    }
  }

  function finishWithoutPrint() {
    finish({ status: "not-printed" });
  }

  function onAfterPrint() {
    finish({ status: "dialog-closed" });
  }

  function onBeforeUnload() {
    finish({ status: "closed" });
  }

  printButton?.addEventListener("click", requestPrint);
  finishButton?.addEventListener("click", finishWithoutPrint);
  externalPrintButton?.addEventListener("click", requestPrint);
  externalFinishButton?.addEventListener("click", finishWithoutPrint);
  targetWindow.addEventListener("afterprint", onAfterPrint, { once: true });
  targetWindow.addEventListener("beforeunload", onBeforeUnload, { once: true });

  return { promise, requestPrint, finish, setStatus: updateStatus };
}

/**
 * Ouvre immédiatement le contexte d’impression, avant toute opération réseau.
 * Si le popup est bloqué, un aperçu intégré permet de continuer sans perdre le document.
 */
export function openPrintContext() {
  let popup = null;
  try {
    // Ne pas utiliser noopener ici : certains navigateurs renvoient null même si la fenêtre s’ouvre.
    popup = window.open("about:blank", "_blank", "popup,width=920,height=740");
  } catch {
    popup = null;
  }

  if (popup) {
    try {
      // La référence reste disponible au parent, mais le document ouvert ne peut pas piloter l’onglet d’origine.
      popup.opener = null;
      writeDocument(popup, baseDocument("Préparation de l’impression", "", { preparing: true }));
    } catch {
      try {
        popup.close();
      } catch {
        // La fenêtre peut déjà avoir été fermée par le navigateur.
      }
      popup = null;
    }
  }

  let fallback = null;
  let activeSession = null;
  let contextClosed = false;

  function setStatus(message) {
    if (popup && !popup.closed) {
      const status = popup.document.getElementById("print-status");
      if (status) status.textContent = message;
    }
    if (fallback && fallback.overlay.isConnected) {
      fallback.status.textContent = message;
    }
  }

  function closeFallback() {
    if (!fallback || !fallback.overlay.isConnected) return;
    fallback.dispose();
    contextClosed = true;
  }

  function ensureFallback() {
    if (!fallback) {
      fallback = createFallbackViewer();
      fallback.closeButton.disabled = false;
      fallback.closeButton.addEventListener("click", () => {
        activeSession?.finish({ status: "closed" });
        closeFallback();
      });
    }
    return fallback;
  }

  function showError(error) {
    const message = safeErrorMessage(error);
    if (popup && !popup.closed) {
      try {
        writeDocument(popup, `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Erreur d’impression</title><style>body{font-family:Arial,sans-serif;color:#172033;margin:0;padding:32px}.error{max-width:760px;margin:auto;padding:22px;border:1px solid #fecaca;border-radius:12px;background:#fff1f2;color:#9f1239}.error p{white-space:pre-wrap;line-height:1.5}button{margin-top:12px;padding:9px 14px;border:0;border-radius:8px;background:#334155;color:#fff;cursor:pointer}</style></head><body><main class="error" role="alert"><h1>Impossible de préparer l’impression</h1><p>${escapeHtml(message)}</p><button id="close-print-error" type="button">Fermer</button></main></body></html>`);
        popup.document.getElementById("close-print-error")?.addEventListener("click", () => popup.close());
        popup.focus();
        return;
      } catch {
        // Si la fenêtre n’est plus accessible, l’erreur sera affichée dans l’aperçu intégré.
      }
    }

    if (contextClosed) return;
    if (!fallback) ensureFallback();
    fallback.frame.hidden = true;
    fallback.error.hidden = false;
    fallback.error.textContent = `La préparation du document a échoué. Vos données n’ont pas été modifiées.\n\n${message}`;
    fallback.status.textContent = "Corrigez le problème puis relancez l’impression.";
    fallback.closeButton.disabled = false;
  }

  function setFallbackDocument(html) {
    if (!fallback || contextClosed) return Promise.resolve(null);
    fallback.error.hidden = true;
    fallback.frame.hidden = false;
    return new Promise((resolve) => {
      fallback.frame.addEventListener("load", () => resolve(fallback.frame.contentDocument), { once: true });
      fallback.frame.srcdoc = html;
    });
  }

  async function render(title, bodyHtml, { landscape = false } = {}) {
    const html = baseDocument(title, bodyHtml, { landscape });
    if (contextClosed) return { status: "closed" };

    if (popup && !popup.closed) {
      try {
        writeDocument(popup, html);
        popup.focus();
        const session = createPrintSession(popup, popup.document, { setStatus });
        activeSession = session;
        const assets = await waitForPrintableAssets(popup.document);
        if (popup.closed) {
          session.finish({ status: "closed" });
          return session.promise;
        }
        if (!assets.ready || assets.brokenImages > 0) {
          session.setStatus(
            assets.pendingImages > 0
              ? "Une ou plusieurs images chargent encore. Vérifiez l’aperçu puis cliquez sur « Imprimer / PDF » lorsqu’il est complet."
              : assets.brokenImages > 0
                ? "Une image n’a pas pu être chargée. Vérifiez l’aperçu puis lancez l’impression manuellement si le document est correct."
                : "Le chargement des polices prend du temps. Vérifiez l’aperçu puis lancez l’impression manuellement lorsqu’il est prêt.",
          );
        } else {
          session.setStatus("Document prêt. Ouverture du dialogue d’impression…");
          session.requestPrint();
        }
        return session.promise;
      } catch (error) {
        showError(error);
        throw error;
      }
    }

    ensureFallback();
    fallback.status.textContent = "La fenêtre séparée n’est plus disponible; chargement de l’aperçu dans cette page…";
    const targetDocument = await setFallbackDocument(html);
    if (!targetDocument || contextClosed) return { status: "closed" };

    const session = createPrintSession(fallback.frame.contentWindow, targetDocument, {
      externalPrintButton: fallback.printButton,
      setStatus,
      onFinish: (result) => {
        if (result.status === "dialog-closed" || result.status === "not-printed") closeFallback();
      },
    });
    activeSession = session;
    fallback.closeButton.disabled = false;
    const assets = await waitForPrintableAssets(targetDocument);
    if (contextClosed) {
      session.finish({ status: "closed" });
      return session.promise;
    }
    fallback.printButton.disabled = false;
    fallback.closeButton.disabled = false;
    setStatus(
      !assets.ready
        ? "Le chargement d’une image ou d’une police prend du temps. Vérifiez l’aperçu avant d’imprimer."
        : assets.brokenImages > 0
          ? "Une image n’a pas pu être chargée. Vous pouvez vérifier l’aperçu et choisir de poursuivre ou non."
          : "Aperçu prêt. Cliquez sur « Imprimer / PDF » pour continuer.",
    );
    return session.promise;
  }

  if (!popup) ensureFallback();

  return {
    popup,
    setStatus,
    showError,
    render,
    cancel() {
      activeSession?.finish({ status: "closed" });
      closeFallback();
      try {
        if (popup && !popup.closed) popup.close();
      } catch {
        // Le navigateur peut interdire la fermeture d’une fenêtre déjà naviguée.
      }
      contextClosed = true;
    },
  };
}

/** Écrit le document dans le contexte déjà ouvert et attend les événements d’impression. */
export function printHtml(title, bodyHtml, { context, ...options } = {}) {
  const printContext = context || openPrintContext();
  return printContext.render(title, bodyHtml, options);
}

/** Ouvre la fenêtre depuis le clic, puis récupère et met en page les données asynchrones. */
export function prepareAndPrintDocument(prepareDocument, options = {}) {
  const context = openPrintContext();
  return (async () => {
    try {
      const documentData = await prepareDocument(context);
      if (!documentData || typeof documentData.bodyHtml !== "string") {
        throw new Error("La préparation n’a pas fourni le contenu HTML du document.");
      }
      return await printHtml(documentData.title || "Document à imprimer", documentData.bodyHtml, {
        ...options,
        ...documentData.printOptions,
        context,
      });
    } catch (error) {
      context.showError(error);
      throw error;
    }
  })();
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
