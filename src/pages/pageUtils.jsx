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
