import { useEffect, useState } from "react";

export function toOptions(rows, valueKey, label) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    value: row[valueKey],
    label: typeof label === "function" ? label(row) : row[label],
  }));
}

/**
 * Charge des référentiels utiles aux listes déroulantes sans empêcher la page
 * principale de fonctionner si l'un des référentiels est vide ou indisponible.
 */
export function useReferenceOptions(loaders, dependency = "") {
  const [references, setReferences] = useState({});

  useEffect(() => {
    let active = true;
    const entries = Object.entries(loaders || {});

    Promise.all(
      entries.map(async ([key, loader]) => {
        try {
          return [key, (await loader()) || []];
        } catch {
          return [key, []];
        }
      }),
    ).then((loaded) => {
      if (active) setReferences(Object.fromEntries(loaded));
    });

    return () => {
      active = false;
    };
    // The dependency is intentionally the only trigger: callers can provide
    // fresh loader functions without causing a request loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependency]);

  return references;
}
