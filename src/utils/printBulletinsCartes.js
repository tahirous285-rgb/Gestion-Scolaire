import { getEtablissement } from "../services/administrationApi";
import { getAnnee, getPeriodes } from "../services/anneesApi";
import { getClasse } from "../services/classesApi";
import { getEleve } from "../services/elevesApi";
import { getEvaluations } from "../services/evaluationsApi";
import { getInscription } from "../services/inscriptionsApi";
import { getMatieres } from "../services/matieresApi";
import { getNotes } from "../services/notesApi";
import { establishmentId } from "../services/apiClient";
import { generateCarteQr } from "../services/cartesApi";
import { escapeHtml, formatFrDate, prepareAndPrintDocument } from "./printDocument";

function photoSrc(photo) {
  if (!photo) return "";
  const value = String(photo).trim();
  if (
    /^https?:\/\//i.test(value)
    || /^data:image\//i.test(value)
    || value.startsWith("/storage/")
  ) {
    return value;
  }
  return "";
}

function photoBlock(photo, alt, size = 110) {
  const src = photoSrc(photo);
  if (src) {
    return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" style="width:${size}px;height:${size}px;object-fit:cover;border-radius:8px;border:2px solid #1e3a8a;background:#e5e7eb;" />`;
  }
  const initials = escapeHtml(alt).slice(0, 2).toUpperCase() || "ÉL";
  return `<div style="width:${size}px;height:${size}px;border-radius:8px;border:2px dashed #94a3b8;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-weight:700;color:#64748b;font-size:22px;">${initials}</div>`;
}

async function requestForPrint(label, request) {
  try {
    return await request();
  } catch (error) {
    throw new Error(`Chargement ${label} impossible : ${error?.message || "erreur réseau"}`, { cause: error });
  }
}

async function resolveEleveContext(idInscription, printContext) {
  if (!idInscription) throw new Error("L’identifiant de l’inscription est absent du document.");
  printContext.setStatus("Chargement de l’inscription et du dossier élève…");
  const inscription = await requestForPrint("de l’inscription", () => getInscription(idInscription));
  if (!inscription?.id_eleve) throw new Error("L’inscription ne référence aucun élève.");

  const [eleve, classe, annee] = await Promise.all([
    requestForPrint("du dossier élève", () => getEleve(inscription.id_eleve)),
    inscription.id_classe
      ? requestForPrint("de la classe", () => getClasse(inscription.id_classe))
      : Promise.resolve(null),
    inscription.id_annee
      ? requestForPrint("de l’année scolaire", () => getAnnee(inscription.id_annee))
      : Promise.resolve(null),
  ]);
  if (!eleve) throw new Error(`Élève #${inscription.id_eleve} introuvable.`);

  let etablissement = null;
  const idEtab = eleve.id_etablissement || establishmentId();
  if (idEtab) {
    printContext.setStatus("Chargement des informations de l’établissement…");
    etablissement = await requestForPrint("de l’établissement", () => getEtablissement(idEtab));
  }
  return { inscription, eleve, classe, annee, etablissement };
}


function renderBulletinPage({
  bulletin,
  inscription = {},
  eleve = {},
  classe = {},
  annee = {},
  etablissement = {},
  periode = {},
  lignes = [],
  pageIndex = 0,
  pageCount = 1,
}) {
  const nom = `${eleve.prenom || ""} ${eleve.nom || ""}`.trim() || `Élève #${inscription.id_eleve || bulletin.id_eleve || "—"}`;
  const rowsHtml = lignes.length
    ? lignes.map((line) => `<tr>
        <td>${escapeHtml(line.matiere || "—")}</td>
        <td>${escapeHtml(line.evaluation || "—")}</td>
        <td style="text-align:center;">${escapeHtml(line.coef ?? 1)}</td>
        <td style="text-align:center;">${escapeHtml(line.note ?? "—")}</td>
        <td style="text-align:center;">/${escapeHtml(line.bareme ?? 20)}</td>
        <td>${escapeHtml(line.observation || "—")}</td>
      </tr>`).join("")
    : `<tr><td colspan="6" class="muted">Aucune évaluation trouvée pour cette période.</td></tr>`;
  const pageBreak = pageIndex < pageCount - 1
    ? "break-after:page;page-break-after:always;"
    : "";
  const photo = eleve.photo ? photoBlock(eleve.photo, nom, 82) : "";

  return `
    <section class="doc bulletin-print-page" style="padding:8px 2px 16px; ${pageBreak}">
      <header style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:3px solid #1e3a8a;padding-bottom:10px;margin-bottom:12px;">
        <div style="flex:1;">
          <p class="muted" style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;">République du Mali — Éducation</p>
          <h1 style="font-size:21px;color:#1e3a8a;margin-top:4px;">${escapeHtml(etablissement.nom || "Établissement scolaire")}</h1>
          <p class="muted" style="margin-top:4px;font-size:11px;">${escapeHtml(etablissement.adresse || "")}</p>
          ${etablissement.telephone ? `<p class="muted" style="font-size:11px;">Tél. : ${escapeHtml(etablissement.telephone)}</p>` : ""}
        </div>
        ${photo}
      </header>
      <h2 style="text-align:center;font-size:18px;color:#1e3a8a;margin:8px 0 12px;">BULLETIN SCOLAIRE</h2>
      <table style="margin-bottom:12px;">
        <tbody>
          <tr><th>Élève</th><td><strong>${escapeHtml(nom)}</strong></td><th>Matricule</th><td>${escapeHtml(eleve.matricule || "—")}</td></tr>
          <tr><th>Classe</th><td>${escapeHtml(classe.nom || classe.libelle || inscription.id_classe || "—")}</td><th>Année scolaire</th><td>${escapeHtml(annee.libelle || annee.code || "—")}</td></tr>
          <tr><th>Période</th><td>${escapeHtml(periode.libelle || periode.code || bulletin.id_periode || "—")}</td><th>Sexe</th><td>${escapeHtml(eleve.sexe || "—")}</td></tr>
        </tbody>
      </table>
      <table style="margin-bottom:12px;">
        <thead><tr><th>Matière</th><th>Évaluation</th><th>Coef.</th><th>Note</th><th>Barème</th><th>Observation</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <table style="margin-bottom:18px;">
        <tbody>
          <tr><th>Moyenne générale</th><td><strong>${escapeHtml(bulletin.moyenne_generale ?? "—")}${bulletin.moyenne_generale === null || bulletin.moyenne_generale === undefined ? "" : " / 20"}</strong></td>
              <th>Rang</th><td><strong>${escapeHtml(bulletin.rang ?? "—")}</strong></td></tr>
          <tr><th>Décision</th><td colspan="3">${escapeHtml(bulletin.decision || "—")}</td></tr>
          <tr><th>Appréciation</th><td colspan="3" style="min-height:42px;">${escapeHtml(bulletin.appreciation || "—")}</td></tr>
        </tbody>
      </table>
      <div style="display:flex;justify-content:space-between;gap:20px;margin-top:22px;font-size:11px;">
        <div style="text-align:center;min-width:120px;">Signature du parent<br/><br/><br/>___________________</div>
        <div style="text-align:center;min-width:120px;">Cachet et signature<br/><br/><br/>___________________</div>
      </div>
      <p class="muted" style="margin-top:14px;font-size:10px;text-align:right;">Imprimé le ${escapeHtml(new Date().toLocaleDateString("fr-FR"))}</p>
    </section>`;
}

export function printBulletinData(printData) {
  return prepareAndPrintDocument(async (printContext) => {
    printContext.setStatus("Préparation du bulletin avec les données de l’élève…");
    if (!printData?.bulletin || !printData?.inscription) {
      throw new Error("Les données nécessaires à l’impression de ce bulletin sont incomplètes.");
    }
    const studentName = `${printData.eleve?.prenom || ""} ${printData.eleve?.nom || ""}`.trim();
    return {
      title: `Bulletin — ${studentName || ("Élève #" + printData.inscription.id_eleve)}`,
      bodyHtml: renderBulletinPage(printData),
    };
  });
}

export function printBulletinsCollectifs(printDataRows) {
  return prepareAndPrintDocument(async (printContext) => {
    if (!Array.isArray(printDataRows) || printDataRows.length === 0) {
      throw new Error("Aucun bulletin prêt à imprimer pour cette sélection.");
    }
    printContext.setStatus("Préparation de " + printDataRows.length + " bulletin(s)…");
    const html = printDataRows.map((data, index) => {
      if (!data?.bulletin || !data?.inscription) {
        throw new Error("Les données d’impression sont incomplètes pour un des bulletins.");
      }
      return renderBulletinPage({ ...data, pageIndex: index, pageCount: printDataRows.length });
    }).join("");
    return {
      title: "Bulletins scolaires — classe",
      bodyHtml: html,
    };
  });
}

export function printBulletin(bulletin) {
  return prepareAndPrintDocument(async (printContext) => {
    const { inscription, eleve, classe, annee, etablissement } = await resolveEleveContext(
      bulletin?.id_inscription,
      printContext,
    );

    printContext.setStatus("Chargement de la période…");
    const periodes = await requestForPrint("de la période", () =>
      getPeriodes({ id_annee: inscription.id_annee }),
    );
    const periode = (periodes || []).find(
      (row) => Number(row.id_periode) === Number(bulletin.id_periode),
    );
    if (!periode) throw new Error(`Période #${bulletin.id_periode ?? "—"} introuvable.`);

    printContext.setStatus("Chargement des notes, évaluations et matières…");
    const [notes, evaluations, matieres] = await Promise.all([
      requestForPrint("des notes", () => getNotes({ id_inscription: bulletin.id_inscription })),
      requestForPrint("des évaluations", () =>
        getEvaluations({ id_classe: inscription.id_classe, id_periode: bulletin.id_periode }),
      ),
      requestForPrint("des matières", () => getMatieres()),
    ]);
    const noteByEvaluation = new Map(
      (notes || []).map((note) => [Number(note.id_evaluation), note]),
    );
    const matiereById = new Map((matieres || []).map((row) => [Number(row.id_matiere), row]));
    const lignes = (evaluations || []).map((evaluation) => {
      const note = noteByEvaluation.get(Number(evaluation.id_evaluation));
      const matiere = matiereById.get(Number(evaluation.id_matiere));
      return {
        matiere: matiere?.nom || matiere?.libelle || `Matière #${evaluation.id_matiere || "—"}`,
        evaluation: evaluation.libelle || "—",
        coef: evaluation.coefficient ?? 1,
        bareme: evaluation.bareme ?? 20,
        note: !note ? "—" : note.absence ? "Absent" : (note.valeur ?? "—"),
        observation: note?.observation || "",
      };
    });

    return {
      title: `Bulletin — ${eleve.prenom || ""} ${eleve.nom || ""}`.trim(),
      bodyHtml: renderBulletinPage({
        bulletin,
        inscription,
        eleve,
        classe,
        annee,
        etablissement,
        periode,
        lignes,
        pageIndex: 0,
        pageCount: 1,
      }),
    };
  });
}

export function printCarteScolaire(carte) {
  return prepareAndPrintDocument(async (printContext) => {
    const { inscription, eleve, classe, annee, etablissement } = await resolveEleveContext(
      carte?.id_inscription,
      printContext,
    );
    let printableCarte = carte;
    if (!printableCarte?.qr_token) {
      printContext.setStatus("QR absent; génération du QR de la carte…");
      printableCarte = await requestForPrint("du QR de la carte", () =>
        generateCarteQr(carte?.id_carte),
      );
    }
    if (!printableCarte?.qr_token) throw new Error("Le backend n’a fourni aucun token QR pour cette carte.");

    const nom = `${eleve.prenom || ""} ${eleve.nom || ""}`.trim() || `Élève #${inscription.id_eleve}`;
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(printableCarte.qr_token)}`;
    const bodyHtml = `
    <div class="doc" style="padding:24px;">
      <div style="width:92mm;min-height:58mm;border:2px solid #1e3a8a;border-radius:12px;padding:12px 14px;background:linear-gradient(180deg,#eff6ff 0%,#fff 45%);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1e3a8a;padding-bottom:6px;margin-bottom:10px;">
          <div>
            <p style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#1e3a8a;font-weight:700;">Carte scolaire</p>
            <h1 style="font-size:13px;margin-top:2px;">${escapeHtml(etablissement?.nom || "Établissement")}</h1>
          </div>
          <span style="font-size:10px;font-weight:700;color:#1e3a8a;">${escapeHtml(printableCarte.numero_carte || "")}</span>
        </div>
        <div style="display:flex;gap:12px;">
          ${photoBlock(eleve.photo, nom, 86)}
          <div style="flex:1;font-size:12px;line-height:1.45;">
            <p><strong>${escapeHtml(nom)}</strong></p>
            <p>Matricule : ${escapeHtml(eleve.matricule || "—")}</p>
            <p>Né(e) le : ${escapeHtml(formatFrDate(eleve.date_naissance))}</p>
            <p>Classe : ${escapeHtml(classe?.libelle || classe?.nom || "—")}</p>
            <p>Année : ${escapeHtml(annee?.libelle || annee?.code || "—")}</p>
            <p>Expire : ${escapeHtml(formatFrDate(printableCarte.date_expiration))}</p>
          </div>
          <img src="${escapeHtml(qr)}" alt="QR de la carte" width="72" height="72" style="align-self:flex-end;" />
        </div>
      </div>
      <p class="muted" style="margin-top:16px;font-size:11px;">Imprimez cette carte puis, si nécessaire, choisissez « Enregistrer au format PDF ». La photo provient du champ photo du dossier élève.</p>
    </div>`;

    return { title: `Carte — ${nom}`, bodyHtml };
  });
}
