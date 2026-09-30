import { getEtablissement } from "../services/administrationApi";
import { getAnnee, getPeriodes } from "../services/anneesApi";
import { getClasse } from "../services/classesApi";
import { getEleve } from "../services/elevesApi";
import { getEvaluations } from "../services/evaluationsApi";
import { getInscription } from "../services/inscriptionsApi";
import { getMatieres } from "../services/matieresApi";
import { getNotes } from "../services/notesApi";
import { establishmentId } from "../services/apiClient";
import { escapeHtml, formatFrDate, printHtml } from "./printDocument";

function photoSrc(photo) {
  if (!photo) return "";
  const value = String(photo).trim();
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;
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

async function resolveEleveContext(idInscription) {
  const inscription = await getInscription(idInscription);
  const [eleve, classe, annee] = await Promise.all([
    getEleve(inscription.id_eleve),
    inscription.id_classe ? getClasse(inscription.id_classe).catch(() => null) : null,
    inscription.id_annee ? getAnnee(inscription.id_annee).catch(() => null) : null,
  ]);
  let etablissement = null;
  const idEtab = eleve?.id_etablissement || establishmentId();
  if (idEtab) {
    try {
      etablissement = await getEtablissement(idEtab);
    } catch {
      etablissement = null;
    }
  }
  return { inscription, eleve, classe, annee, etablissement };
}

export async function printBulletin(bulletin) {
  const { inscription, eleve, classe, annee, etablissement } = await resolveEleveContext(
    bulletin.id_inscription,
  );
  const periodes = await getPeriodes({ id_annee: inscription.id_annee }).catch(() => []);
  const periode = (periodes || []).find((row) => Number(row.id_periode) === Number(bulletin.id_periode));

  let lignes = [];
  try {
    const [notes, evaluations, matieres] = await Promise.all([
      getNotes({ id_inscription: bulletin.id_inscription }),
      getEvaluations({ id_classe: inscription.id_classe, id_periode: bulletin.id_periode }),
      getMatieres(),
    ]);
    const evalIds = new Set((evaluations || []).map((row) => Number(row.id_evaluation)));
    const matiereById = new Map((matieres || []).map((row) => [Number(row.id_matiere), row]));
    const evalById = new Map((evaluations || []).map((row) => [Number(row.id_evaluation), row]));
    lignes = (notes || [])
      .filter((note) => evalIds.has(Number(note.id_evaluation)))
      .map((note) => {
        const evaluation = evalById.get(Number(note.id_evaluation));
        const matiere = evaluation ? matiereById.get(Number(evaluation.id_matiere)) : null;
        return {
          matiere: matiere?.libelle || matiere?.nom || `Matière #${evaluation?.id_matiere || "—"}`,
          evaluation: evaluation?.libelle || "—",
          coef: evaluation?.coefficient ?? 1,
          bareme: evaluation?.bareme ?? 20,
          note: note.absence ? "Abs" : note.valeur,
        };
      });
  } catch {
    lignes = [];
  }

  const nom = `${eleve?.prenom || ""} ${eleve?.nom || ""}`.trim() || `Élève #${inscription.id_eleve}`;
  const rowsHtml = lignes.length
    ? lignes
        .map(
          (line) => `<tr>
            <td>${escapeHtml(line.matiere)}</td>
            <td>${escapeHtml(line.evaluation)}</td>
            <td>${escapeHtml(line.coef)}</td>
            <td>${escapeHtml(line.note ?? "—")}</td>
            <td>/${escapeHtml(line.bareme)}</td>
          </tr>`,
        )
        .join("")
    : `<tr><td colspan="5" class="muted">Aucune note liée à cette période.</td></tr>`;

  const html = `
  <div class="doc" style="padding:18px;">
    <header style="display:flex;justify-content:space-between;gap:16px;border-bottom:3px solid #1e3a8a;padding-bottom:12px;margin-bottom:16px;">
      <div>
        <p class="muted" style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;">République du Mali — Éducation</p>
        <h1 style="font-size:22px;color:#1e3a8a;margin-top:4px;">${escapeHtml(etablissement?.nom || "Établissement scolaire")}</h1>
        <p class="muted" style="margin-top:4px;">${escapeHtml(etablissement?.adresse || "")}</p>
      </div>
      ${photoBlock(eleve?.photo, nom, 92)}
    </header>
    <h2 style="text-align:center;font-size:18px;margin-bottom:14px;">Bulletin scolaire</h2>
    <table style="margin-bottom:16px;">
      <tr><th>Élève</th><td>${escapeHtml(nom)}</td><th>Matricule</th><td>${escapeHtml(eleve?.matricule || "—")}</td></tr>
      <tr><th>Classe</th><td>${escapeHtml(classe?.libelle || classe?.nom || inscription.id_classe)}</td><th>Année</th><td>${escapeHtml(annee?.libelle || annee?.code || "—")}</td></tr>
      <tr><th>Période</th><td>${escapeHtml(periode?.libelle || periode?.code || bulletin.id_periode)}</td><th>Sexe</th><td>${escapeHtml(eleve?.sexe || "—")}</td></tr>
    </table>
    <table style="margin-bottom:16px;">
      <thead><tr><th>Matière</th><th>Évaluation</th><th>Coef.</th><th>Note</th><th>Barème</th></tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <table>
      <tr><th>Moyenne générale</th><td><strong>${escapeHtml(bulletin.moyenne_generale ?? "—")} / 20</strong></td>
          <th>Rang</th><td><strong>${escapeHtml(bulletin.rang ?? "—")}</strong></td></tr>
      <tr><th>Décision</th><td colspan="3">${escapeHtml(bulletin.decision || "—")}</td></tr>
      <tr><th>Appréciation</th><td colspan="3">${escapeHtml(bulletin.appreciation || "—")}</td></tr>
    </table>
    <p class="muted" style="margin-top:28px;font-size:11px;">Document généré le ${escapeHtml(new Date().toLocaleDateString("fr-FR"))}. Utilisez « Imprimer » puis « Enregistrer au format PDF ».</p>
  </div>`;

  printHtml(`Bulletin — ${nom}`, html);
}

export async function printCarteScolaire(carte) {
  const { inscription, eleve, classe, annee, etablissement } = await resolveEleveContext(
    carte.id_inscription,
  );
  const nom = `${eleve?.prenom || ""} ${eleve?.nom || ""}`.trim() || `Élève #${inscription.id_eleve}`;
  const qr = carte.qr_token
    ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(carte.qr_token)}`
    : "";

  const html = `
  <div class="doc" style="padding:24px;">
    <div style="width:92mm;min-height:58mm;border:2px solid #1e3a8a;border-radius:12px;padding:12px 14px;background:linear-gradient(180deg,#eff6ff 0%,#fff 45%);">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1e3a8a;padding-bottom:6px;margin-bottom:10px;">
        <div>
          <p style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#1e3a8a;font-weight:700;">Carte scolaire</p>
          <h1 style="font-size:13px;margin-top:2px;">${escapeHtml(etablissement?.nom || "Établissement")}</h1>
        </div>
        <span style="font-size:10px;font-weight:700;color:#1e3a8a;">${escapeHtml(carte.numero_carte || "")}</span>
      </div>
      <div style="display:flex;gap:12px;">
        ${photoBlock(eleve?.photo, nom, 86)}
        <div style="flex:1;font-size:12px;line-height:1.45;">
          <p><strong>${escapeHtml(nom)}</strong></p>
          <p>Matricule : ${escapeHtml(eleve?.matricule || "—")}</p>
          <p>Né(e) le : ${escapeHtml(formatFrDate(eleve?.date_naissance))}</p>
          <p>Classe : ${escapeHtml(classe?.libelle || classe?.nom || "—")}</p>
          <p>Année : ${escapeHtml(annee?.libelle || annee?.code || "—")}</p>
          <p>Expire : ${escapeHtml(formatFrDate(carte.date_expiration))}</p>
        </div>
        ${qr ? `<img src="${qr}" alt="QR" width="72" height="72" style="align-self:flex-end;" />` : ""}
      </div>
    </div>
    <p class="muted" style="margin-top:16px;font-size:11px;">Imprimez cette carte (recto) puis enregistrez-la en PDF si besoin. La photo est celle du dossier élève.</p>
  </div>`;

  printHtml(`Carte — ${nom}`, html);
}
