import { useEffect, useState } from "react";
import { getInscription } from "../services/inscriptionsApi";
import { getEleves, getEleve } from "../services/elevesApi";
import { getEnseignants } from "../services/enseignantsApi";
import { getUtilisateurs } from "../services/administrationApi";

export function toOptions(rows, valueKey, label) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    value: row[valueKey], label: typeof label === "function" ? label(row) : row[label],
  }));
}

// Seulement les routes déclarant réellement skip/limit sont paginées.
async function loadReference(loader) {
  if (![getEleves, getEnseignants, getUtilisateurs].includes(loader)) return loader();
  const rows = [];
  for (let skip = 0; ; skip += 100) {
    const page = await loader({ skip, limit: 100 });
    rows.push(...page);
    if (page.length < 100) return rows;
  }
}

export function useReferenceOptions(loaders, dependency = "", inscriptionIds = []) {
  const idsKey = [...new Set(inscriptionIds)].sort((a, b) => a - b).join(",");
  const [references, setReferences] = useState({});
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const reload = () => setRevision((value) => value + 1);
    window.addEventListener("references:changed", reload);
    return () => window.removeEventListener("references:changed", reload);
  }, []);
  useEffect(() => {
    let active = true;
    async function load() {
      const errors = [];
      const loaded = await Promise.all(Object.entries(loaders || {}).map(async ([key, loader]) => {
        try { return [key, await loadReference(loader) || []]; }
        catch (error) { errors.push(`${key} : ${error.message}`); return [key, []]; }
      }));
      const next = Object.fromEntries(loaded);
      // Résolution par GET individuel : fonctionne aussi au-delà de la première
      // page d'élèves, sans inventer de filtre ou de relation imbriquée backend.
      if (next.inscriptions) {
        const knownIds = new Set(next.inscriptions.map((row) => Number(row.id_inscription)));
        const missingIds = idsKey ? idsKey.split(",").map(Number).filter((id) => !knownIds.has(id)) : [];
        const missing = await Promise.all(missingIds.map(async (id) => {
          try { return await getInscription(id); }
          catch (error) { errors.push(`Inscription #${id} : ${error.message}`); return null; }
        }));
        next.inscriptions = [...next.inscriptions, ...missing.filter(Boolean)];
        const students = new Map((next.eleves || []).map((row) => [row.id_eleve, row]));
        await Promise.all([...new Set(next.inscriptions.map((row) => row.id_eleve))].filter((id) => !students.has(id)).map(async (id) => {
          try { students.set(id, await getEleve(id)); }
          catch (error) { errors.push(`Élève #${id} : ${error.message}`); }
        }));
        next.inscriptions = next.inscriptions.map((row) => {
          const student = students.get(row.id_eleve);
          return { ...row, eleve: student, label: `${row.numero_inscription || `Inscription #${row.id_inscription}`} — ${student ? `${student.matricule} — ${student.nom} ${student.prenom}` : `élève #${row.id_eleve}`}` };
        });
      }
      if (active) setReferences({ ...next, error: errors.join(" · ") });
    }
    load();
    return () => { active = false; };
    // Les fonctions inline ne doivent pas déclencher de boucle de requêtes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependency, revision, idsKey]);
  return references;
}
