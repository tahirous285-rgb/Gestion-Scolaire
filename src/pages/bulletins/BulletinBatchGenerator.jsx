import { useEffect, useState } from "react";
import { establishmentId } from "../../services/apiClient";
import { getAnnees, getPeriodes } from "../../services/anneesApi";
import { getClasses } from "../../services/classesApi";
import { getEleve } from "../../services/elevesApi";
import { getEvaluations } from "../../services/evaluationsApi";
import { getInscriptions } from "../../services/inscriptionsApi";
import { createBulletin, getBulletins, updateBulletin } from "../../services/bulletinsApi";
import { getNotes } from "../../services/notesApi";

const API_LIST_LIMIT = 100;

function numericId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function isEligibleInscription(inscription) {
  const status = String(inscription.statut || "active").trim().toLowerCase();
  return ![
    "inactive", "inactif", "inactife", "annule", "annulé", "annulée",
    "supprime", "supprimé", "supprimée", "radie", "radié", "radiée",
  ].includes(status);
}

function displayStudentName(student, inscription) {
  if (!student) return "Élève #" + inscription.id_eleve;
  const fullName = [student.prenom, student.nom].filter(Boolean).join(" ").trim();
  return fullName || ("Élève #" + inscription.id_eleve);
}

function computeClassResults(inscriptions, evaluations, notesByEvaluation) {
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

      const scoreOnTwenty = (value / bareme) * 20;
      weightedTotal += scoreOnTwenty * coefficient;
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

function formatAverage(value) {
  return value === null || value === undefined
    ? "—"
    : Number(value).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " / 20";
}

function ordinalRank(value) {
  if (!value) return "—";
  return value === 1 ? "1er" : (value + "e");
}

export default function BulletinBatchGenerator({ onGenerated }) {
  const [open, setOpen] = useState(false);
  const [loadingReferences, setLoadingReferences] = useState(true);
  const [annees, setAnnees] = useState([]);
  const [classes, setClasses] = useState([]);
  const [periodes, setPeriodes] = useState([]);
  const [anneeId, setAnneeId] = useState("");
  const [classeId, setClasseId] = useState("");
  const [periodeId, setPeriodeId] = useState("");
  const [loadingPeriodes, setLoadingPeriodes] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [referenceError, setReferenceError] = useState("");
  const [progress, setProgress] = useState(null);
  const [report, setReport] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const idEtablissement = establishmentId();

    if (!idEtablissement) {
      setReferenceError("La session ne contient pas d’établissement valide. Reconnectez-vous avant de générer les bulletins.");
      setLoadingReferences(false);
      return () => {
        cancelled = true;
      };
    }

    Promise.all([getAnnees(), getClasses()])
      .then(([anneesData, classesData]) => {
        if (cancelled) return;
        const anneesRows = Array.isArray(anneesData) ? anneesData : [];
        const classesRows = Array.isArray(classesData) ? classesData : [];
        if (anneesRows.length >= API_LIST_LIMIT || classesRows.length >= API_LIST_LIMIT) {
          setAnnees([]);
          setClasses([]);
          setReferenceError(
            "L’API limite les listes d’années et de classes à 100 éléments sans pagination. " +
            "La génération est désactivée pour éviter de choisir à partir d’une liste incomplète.",
          );
          return;
        }
        setAnnees(anneesRows.filter(
          (row) => Number(row.id_etablissement) === idEtablissement,
        ));
        setClasses(classesRows.filter(
          (row) => Number(row.id_etablissement) === idEtablissement,
        ));
      })
      .catch((requestError) => {
        if (!cancelled) {
          setReferenceError(
            requestError.message || "Impossible de charger les années scolaires et les classes.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingReferences(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!anneeId) return undefined;

    let cancelled = false;
    setLoadingPeriodes(true);
    getPeriodes({ id_annee: Number(anneeId) })
      .then((rows) => {
        if (!cancelled) {
          setPeriodes(Array.isArray(rows) ? rows : []);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setPeriodes([]);
          setError(requestError.message || "Impossible de charger les périodes de cette année.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPeriodes(false);
      });

    return () => {
      cancelled = true;
    };
  }, [anneeId]);

  function closeDialog() {
    if (busy) return;
    setOpen(false);
    setError("");
  }

  async function generateForClass(event) {
    event.preventDefault();
    if (busy) return;

    const selectedAnneeId = numericId(anneeId);
    const selectedClasseId = numericId(classeId);
    const selectedPeriodeId = numericId(periodeId);

    if (!selectedAnneeId || !selectedClasseId || !selectedPeriodeId) {
      setError("Sélectionnez une année scolaire, une classe et une période.");
      return;
    }

    setBusy(true);
    setError("");
    setReport(null);
    setProgress({ current: 0, total: 0, label: "Vérification des données pédagogiques…" });

    try {
      const [allInscriptions, rawEvaluations] = await Promise.all([
        getInscriptions({ id_annee: selectedAnneeId }),
        getEvaluations({ id_classe: selectedClasseId, id_periode: selectedPeriodeId }),
      ]);

      if (!Array.isArray(allInscriptions) || !Array.isArray(rawEvaluations)) {
        throw new Error("L’API n’a pas renvoyé les listes attendues. Aucune génération n’a été lancée.");
      }

      if (allInscriptions.length >= API_LIST_LIMIT) {
        throw new Error(
          "L’API renvoie au maximum 100 inscriptions par année et ne propose pas de pagination sur cette route. " +
          "Pour garantir un classement complet, la génération est interrompue plutôt que de créer des bulletins partiels.",
        );
      }
      if (rawEvaluations.length >= API_LIST_LIMIT) {
        throw new Error(
          "L’API renvoie au maximum 100 évaluations par requête. Impossible de garantir un calcul complet pour cette sélection.",
        );
      }

      const inscriptions = allInscriptions.filter((row) =>
        Number(row.id_annee) === selectedAnneeId &&
        Number(row.id_classe) === selectedClasseId &&
        isEligibleInscription(row),
      );

      if (!inscriptions.length) {
        throw new Error("Aucune inscription active n’a été trouvée dans cette classe pour l’année sélectionnée.");
      }

      const evaluations = rawEvaluations.filter((row) =>
        Number(row.id_classe) === selectedClasseId &&
        Number(row.id_periode) === selectedPeriodeId &&
        Number(row.id_annee) === selectedAnneeId,
      );

      if (!evaluations.length) {
        throw new Error(
          "Aucune évaluation n’a été trouvée pour cette classe, cette période et cette année. " +
          "Créez ou vérifiez les évaluations avant de générer les bulletins.",
        );
      }

      setProgress({
        current: 0,
        total: evaluations.length,
        label: "Récupération des notes de " + evaluations.length + " évaluation(s)…",
      });

      const noteSets = await Promise.all(evaluations.map(async (evaluation) => {
        const notes = await getNotes({ id_evaluation: Number(evaluation.id_evaluation) });
        if (!Array.isArray(notes)) {
          throw new Error("La réponse des notes est invalide pour l’évaluation #" + evaluation.id_evaluation + ".");
        }
        if (notes.length >= API_LIST_LIMIT) {
          throw new Error(
            "L’évaluation « " + (evaluation.libelle || evaluation.id_evaluation) +
            " » renvoie 100 notes. La liste peut être tronquée par l’API ; la génération est arrêtée pour éviter un classement incomplet.",
          );
        }
        return [Number(evaluation.id_evaluation), notes];
      }));
      const notesByEvaluation = new Map(noteSets);

      const calculations = computeClassResults(inscriptions, evaluations, notesByEvaluation);
      const noAverageCount = calculations.filter((row) => row.moyenne_generale === null).length;

      setProgress({
        current: 0,
        total: inscriptions.length,
        label: "Vérification des bulletins existants et préparation des résultats…",
      });

      const [existingLists, studentEntries] = await Promise.all([
        Promise.all(inscriptions.map((inscription) =>
          getBulletins({
            id_inscription: Number(inscription.id_inscription),
            id_periode: selectedPeriodeId,
          }),
        )),
        Promise.all(inscriptions.map(async (inscription) => {
          try {
            const student = await getEleve(Number(inscription.id_eleve));
            return [Number(inscription.id_inscription), displayStudentName(student, inscription)];
          } catch {
            return [Number(inscription.id_inscription), "Élève #" + inscription.id_eleve];
          }
        })),
      ]);

      if (existingLists.some((rows) => !Array.isArray(rows))) {
        throw new Error("Impossible de vérifier les bulletins déjà enregistrés. Aucun bulletin n’a été modifié.");
      }

      const existingByInscription = new Map();
      existingLists.forEach((rows, index) => {
        if (rows.length > 1) {
          throw new Error(
            "Plusieurs bulletins existent déjà pour l’inscription #" +
            inscriptions[index].id_inscription + " et cette période. Corrigez ce doublon avant de continuer.",
          );
        }
        existingByInscription.set(
          Number(inscriptions[index].id_inscription),
          rows[0] || null,
        );
      });

      const validatedBulletins = Array.from(existingByInscription.values()).filter(
        (bulletin) => bulletin && Boolean(bulletin.valide),
      );
      if (validatedBulletins.length > 0) {
        const confirmed = window.confirm(
          validatedBulletins.length +
          " bulletin(s) de cette sélection sont déjà validés. Si vous continuez, leurs moyennes et rangs seront recalculés et leur validation sera réinitialisée afin de préserver un classement cohérent. Continuer ?",
        );
        if (!confirmed) {
          setProgress(null);
          setError("Génération annulée. Aucun bulletin n’a été modifié.");
          return;
        }
      }

      const nameByInscription = new Map(studentEntries);
      const calculationByInscription = new Map(
        calculations.map((row) => [Number(row.id_inscription), row]),
      );
      const summary = {
        created: 0,
        updated: 0,
        validationReinitialisee: 0,
        failed: 0,
        withoutAverage: noAverageCount,
      };
      const rowsReport = [];

      setProgress({
        current: 0,
        total: inscriptions.length,
        label: "Enregistrement des bulletins…",
      });

      for (let index = 0; index < inscriptions.length; index += 1) {
        const inscription = inscriptions[index];
        const idInscription = Number(inscription.id_inscription);
        const result = calculationByInscription.get(idInscription);
        const existing = existingByInscription.get(idInscription);
        const studentName = nameByInscription.get(idInscription) || ("Élève #" + inscription.id_eleve);

        try {
          const wasValidated = Boolean(existing && existing.valide);
          const payload = {
            moyenne_generale: result.moyenne_generale,
            rang: result.rang,
          };

          if (existing) {
            if (wasValidated) {
              payload.valide = false;
              payload.id_validateur = null;
            }
            await updateBulletin(Number(existing.id_bulletin), payload);
            summary.updated += 1;
            if (wasValidated) summary.validationReinitialisee += 1;
            rowsReport.push({
              id_inscription: idInscription,
              nom: studentName,
              moyenne_generale: result.moyenne_generale,
              rang: result.rang,
              statut: wasValidated
                ? "Bulletin recalculé — validation réinitialisée"
                : "Bulletin actualisé",
            });
          } else {
            await createBulletin({
              id_inscription: idInscription,
              id_periode: selectedPeriodeId,
              moyenne_generale: result.moyenne_generale,
              rang: result.rang,
              valide: false,
            });
            summary.created += 1;
            rowsReport.push({
              id_inscription: idInscription,
              nom: studentName,
              moyenne_generale: result.moyenne_generale,
              rang: result.rang,
              statut: "Bulletin créé",
            });
          }
        } catch (writeError) {
          summary.failed += 1;
          rowsReport.push({
            id_inscription: idInscription,
            nom: studentName,
            moyenne_generale: result.moyenne_generale,
            rang: result.rang,
            statut: "Échec : " + (writeError.message || "erreur d’enregistrement"),
          });
        }

        setProgress({
          current: index + 1,
          total: inscriptions.length,
          label: "Traitement de " + (index + 1) + " sur " + inscriptions.length + " élèves…",
        });
      }

      rowsReport.sort((left, right) => {
        if (left.rang === null || left.rang === undefined) {
          return right.rang === null || right.rang === undefined ? left.nom.localeCompare(right.nom, "fr") : 1;
        }
        if (right.rang === null || right.rang === undefined) return -1;
        return left.rang - right.rang || left.nom.localeCompare(right.nom, "fr");
      });

      setReport({
        annee: (annees.find((row) => Number(row.id_annee) === selectedAnneeId) || {}).libelle || "",
        classe: (classes.find((row) => Number(row.id_classe) === selectedClasseId) || {}).nom || "",
        periode: (periodes.find((row) => Number(row.id_periode) === selectedPeriodeId) || {}).libelle || "",
        summary,
        rows: rowsReport,
      });
      setProgress({
        current: inscriptions.length,
        total: inscriptions.length,
        label: "Traitement terminé.",
      });

      if (summary.created + summary.updated > 0) {
        onGenerated?.();
      }
    } catch (requestError) {
      setError(requestError.message || "La génération collective des bulletins a échoué.");
      setProgress(null);
    } finally {
      setBusy(false);
    }
  }

  const canGenerate = !referenceError && !loadingReferences && !loadingPeriodes && !busy &&
    numericId(anneeId) && numericId(classeId) && numericId(periodeId);

  return (
    <>
      <button
        type="button"
        className="crud-secondary"
        onClick={() => {
          setOpen(true);
          setError("");
        }}
      >
        📚 Générer par classe
      </button>

      {open && (
        <div className="crud-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}>
          <div className="crud-modal" role="dialog" aria-modal="true" aria-labelledby="bulletin-batch-title">
            <div className="crud-modal-head">
              <div>
                <div className="crud-eyebrow">Génération collective</div>
                <h2 id="bulletin-batch-title">Bulletins de toute une classe</h2>
                <p>Les moyennes et rangs sont calculés à partir des notes de la période sélectionnée.</p>
              </div>
              <button type="button" onClick={closeDialog} disabled={busy} aria-label="Fermer">×</button>
            </div>

            {referenceError && <div className="crud-alert" role="alert">{referenceError}</div>}
            {error && <div className="crud-alert" role="alert">{error}</div>}

            <form onSubmit={generateForClass} className="crud-form">
              <div className="crud-form-grid">
                <div className="crud-field">
                  <label htmlFor="bulletin-batch-annee">Année scolaire *</label>
                  <select
                    id="bulletin-batch-annee"
                    value={anneeId}
                    onChange={(event) => {
                      setAnneeId(event.target.value);
                      setPeriodeId("");
                      setReport(null);
                      setError("");
                    }}
                    disabled={loadingReferences || busy}
                    required
                  >
                    <option value="">Sélectionner une année…</option>
                    {annees.map((row) => (
                      <option key={row.id_annee} value={row.id_annee}>{row.libelle}</option>
                    ))}
                  </select>
                </div>

                <div className="crud-field">
                  <label htmlFor="bulletin-batch-classe">Classe *</label>
                  <select
                    id="bulletin-batch-classe"
                    value={classeId}
                    onChange={(event) => {
                      setClasseId(event.target.value);
                      setReport(null);
                      setError("");
                    }}
                    disabled={loadingReferences || busy}
                    required
                  >
                    <option value="">Sélectionner une classe…</option>
                    {classes.map((row) => (
                      <option key={row.id_classe} value={row.id_classe}>
                        {row.nom}{row.niveau ? " — " + row.niveau : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="crud-field full">
                  <label htmlFor="bulletin-batch-periode">Période *</label>
                  <select
                    id="bulletin-batch-periode"
                    value={periodeId}
                    onChange={(event) => {
                      setPeriodeId(event.target.value);
                      setReport(null);
                      setError("");
                    }}
                    disabled={!anneeId || loadingPeriodes || busy}
                    required
                  >
                    <option value="">Sélectionner une période…</option>
                    {periodes.map((row) => (
                      <option key={row.id_periode} value={row.id_periode}>
                        {row.code} — {row.libelle}
                      </option>
                    ))}
                  </select>
                  {loadingPeriodes && <small>Chargement des périodes…</small>}
                </div>
              </div>

              <p className="crud-field-help">
                Si des bulletins sont déjà validés, une confirmation sera demandée avant de recalculer leurs moyennes et rangs. En cas de limite de l’API, la génération s’arrête avant toute modification.
              </p>

              {progress && (
                <div className="crud-state" role="status">
                  <p>{progress.label}</p>
                  {progress.total > 0 && (
                    <progress value={progress.current} max={progress.total} style={{ width: "100%" }} />
                  )}
                </div>
              )}

              {report && (
                <section aria-labelledby="bulletin-batch-summary">
                  <h3 id="bulletin-batch-summary">Résultat de la génération</h3>
                  <p>
                    {report.classe} — {report.periode} — {report.annee}
                  </p>
                  <div className="crud-details">
                    <div className="crud-detail"><span>Créés</span><strong>{report.summary.created}</strong></div>
                    <div className="crud-detail"><span>Actualisés</span><strong>{report.summary.updated}</strong></div>
                    <div className="crud-detail"><span>Validations réinitialisées après recalcul</span><strong>{report.summary.validationReinitialisee}</strong></div>
                    <div className="crud-detail"><span>Sans moyenne calculable</span><strong>{report.summary.withoutAverage}</strong></div>
                    <div className="crud-detail"><span>Échecs</span><strong>{report.summary.failed}</strong></div>
                  </div>

                  <div className="crud-table-wrap" style={{ marginTop: "16px", maxHeight: "320px", overflow: "auto" }}>
                    <table className="crud-table">
                      <thead>
                        <tr>
                          <th>Élève</th>
                          <th>Moyenne</th>
                          <th>Rang</th>
                          <th>Résultat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.rows.map((row) => (
                          <tr key={row.id_inscription}>
                            <td>{row.nom}</td>
                            <td>{formatAverage(row.moyenne_generale)}</td>
                            <td>{ordinalRank(row.rang)}</td>
                            <td>{row.statut}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              <div className="crud-form-actions">
                <button type="button" className="crud-secondary" onClick={closeDialog} disabled={busy}>
                  Fermer
                </button>
                <button type="submit" className="crud-primary" disabled={!canGenerate}>
                  {busy ? "Génération en cours…" : "Générer les bulletins"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
