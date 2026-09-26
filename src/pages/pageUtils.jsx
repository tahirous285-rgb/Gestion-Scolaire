import { useMemo } from "react";

export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("fr-FR");
}

export function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

export function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "—";
  return `${Number(value).toLocaleString("fr-FR")} FCFA`;
}

export function badge(value, kind = "neutral") {
  return <span className={`status-badge ${kind}`}>{value ?? "—"}</span>;
}

export function optionsFrom(rows, idKey, label) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    value: row[idKey],
    label: typeof label === "function" ? label(row) : row[label],
  }));
}

export function mapBy(rows, key) {
  return new Map((Array.isArray(rows) ? rows : []).map((row) => [String(row[key]), row]));
}

export function useStableOptions(rows, idKey, label) {
  return useMemo(() => optionsFrom(rows, idKey, label), [rows, idKey, label]);
}

export const commonStatusOptions = [
  { value: "actif", label: "Actif" },
  { value: "inactif", label: "Inactif" },
];

/* ---------- Aides partagées par les modules ---------- */

export function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function nowLocalInput() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function sum(rows, key) {
  return (Array.isArray(rows) ? rows : []).reduce(
    (total, row) => total + (Number(typeof key === "function" ? key(row) : row[key]) || 0),
    0,
  );
}

export function groupBy(rows, key) {
  const map = new Map();
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const k = typeof key === "function" ? key(row) : row[key];
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(row);
  });
  return map;
}

export function monthKey(value) {
  return value ? String(value).slice(0, 7) : "";
}

export function monthLabel(key) {
  if (!key) return "—";
  const [y, m] = key.split("-").map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function generateReference(prefix = "REF") {
  const d = new Date();
  const stamp = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}-${random}`;
}

export function fullName(person) {
  if (!person) return "";
  return [person.prenom, person.nom].filter(Boolean).join(" ");
}

export function includesText(values, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  return values.some((value) => String(value ?? "").toLowerCase().includes(q));
}

export function toNumberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Supprime les chaînes vides (champs optionnels non renseignés). */
export function cleanPayload(data) {
  return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v === "" ? null : v]));
}

export const MODES_PAIEMENT = ["Espèces", "Orange Money", "Moov Money", "Wave", "Virement", "Chèque", "Carte bancaire"];

/**
 * Libellés d'inscription « Prénom Nom — Classe (Année) » à partir des
 * référentiels élèves, classes et années.
 */
export function buildInscriptionIndex(inscriptions, eleves, classes, annees = []) {
  const elevesMap = mapBy(eleves, "id_eleve");
  const classesMap = mapBy(classes, "id_classe");
  const anneesMap = mapBy(annees, "id_annee");
  const index = new Map();
  (Array.isArray(inscriptions) ? inscriptions : []).forEach((ins) => {
    const eleve = elevesMap.get(String(ins.id_eleve));
    const classe = classesMap.get(String(ins.id_classe));
    const annee = anneesMap.get(String(ins.id_annee));
    index.set(String(ins.id_inscription), {
      ...ins,
      eleve,
      classe,
      annee,
      eleveNom: eleve ? fullName(eleve) : `Élève #${ins.id_eleve}`,
      matricule: eleve?.matricule || "",
      classeNom: classe?.nom || `Classe #${ins.id_classe}`,
      anneeLibelle: annee?.libelle || "",
      label: `${eleve ? fullName(eleve) : `Élève #${ins.id_eleve}`} — ${classe?.nom || `Classe #${ins.id_classe}`}${annee ? ` (${annee.libelle})` : ""}`,
    });
  });
  return index;
}

export function honoraireStatut(h) {
  if (Number(h.montant_net) > 0 && Number(h.solde) <= 0) return { key: "paye", label: "Payé", tone: "green" };
  if (Number(h.montant_paye) > 0) return { key: "partiel", label: "Partiellement payé", tone: "orange" };
  if (h.statut === "valide") return { key: "valide", label: "Validé", tone: "blue" };
  if (h.statut === "rejete") return { key: "rejete", label: "Rejeté", tone: "red" };
  return { key: "calcule", label: "Calculé", tone: "yellow" };
}
