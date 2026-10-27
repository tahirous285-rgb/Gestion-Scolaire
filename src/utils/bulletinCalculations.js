export function isEligibleInscription(inscription) {
  const status = String(inscription.statut || "active").trim().toLowerCase();
  return ![
    "inactive", "inactif", "inactife", "annule", "annulé", "annulée",
    "supprime", "supprimé", "supprimée", "radie", "radié", "radiée",
  ].includes(status);
}

export function computeClassResults(inscriptions, evaluations, notesByEvaluation) {
  const eligibleIds = new Set(inscriptions.map((row) => Number(row.id_inscription)));
  const notesByInscription = new Map(
    inscriptions.map((row) => [Number(row.id_inscription), []]),
  );

  evaluations.forEach((evaluation) => {
    const evaluationNotes = notesByEvaluation.get(Number(evaluation.id_evaluation)) || [];
    evaluationNotes.forEach((note) => {
      const inscriptionId = Number(note.id_inscription);
      if (!eligibleIds.has(inscriptionId)) return;
      notesByInscription.get(inscriptionId).push({ note, evaluation });
    });
  });

  const results = inscriptions.map((inscription) => {
    let weightedTotal = 0;
    let coefficientTotal = 0;
    let validNoteCount = 0;

    for (const entry of notesByInscription.get(Number(inscription.id_inscription)) || []) {
      const rawValue = entry.note.valeur;
      if (rawValue === null || rawValue === undefined || String(rawValue).trim() === "") continue;

      const value = Number(rawValue);
      if (!Number.isFinite(value)) continue;

      const bareme = Number(entry.evaluation.bareme);
      const coefficient = Number(
        entry.evaluation.coefficient === null || entry.evaluation.coefficient === undefined
          ? 1
          : entry.evaluation.coefficient,
      );

      if (!Number.isFinite(bareme) || bareme <= 0) {
        throw new Error(
          "Barème invalide pour l’évaluation « " +
          (entry.evaluation.libelle || ("#" + entry.evaluation.id_evaluation)) +
          " ». Le barème doit être supérieur à zéro.",
        );
      }
      if (!Number.isFinite(coefficient) || coefficient < 0) {
        throw new Error(
          "Coefficient invalide pour l’évaluation « " +
          (entry.evaluation.libelle || ("#" + entry.evaluation.id_evaluation)) +
          " ». Vérifiez sa configuration avant de générer les bulletins.",
        );
      }

      weightedTotal += (value / bareme) * 20 * coefficient;
      coefficientTotal += coefficient;
      validNoteCount += 1;
    }

    const average = validNoteCount > 0 && coefficientTotal > 0
      ? Math.round((weightedTotal / coefficientTotal + Number.EPSILON) * 100) / 100
      : null;

    return {
      id_inscription: Number(inscription.id_inscription),
      id_eleve: Number(inscription.id_eleve),
      moyenne_generale: average,
      rang: null,
      nombre_notes: validNoteCount,
    };
  });

  const ranked = results
    .filter((result) => result.moyenne_generale !== null)
    .sort((left, right) => right.moyenne_generale - left.moyenne_generale);

  let currentRank = 0;
  let previousAverage = null;
  ranked.forEach((result, index) => {
    if (index === 0 || result.moyenne_generale !== previousAverage) {
      currentRank = index + 1;
    }
    result.rang = currentRank;
    previousAverage = result.moyenne_generale;
  });

  return results;
}