import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getEvaluations,
  createEvaluation,
} from "../../services/evaluationsApi";

import { getAnnees } from "../../services/anneesApi";
import { getPeriodes } from "../../services/periodesApi";
import { getClasses } from "../../services/classesApi";
import { getMatieres } from "../../services/matieresApi";
import { getEnseignants } from "../../services/enseignantsApi";

import "./Evaluations.css";

function getToday() {
  return new Date()
    .toISOString()
    .split("T")[0];
}

const initialForm = {
  id_annee: "",
  id_periode: "",
  id_classe: "",
  id_matiere: "",
  id_enseignant: "",
  libelle: "",
  type_evaluation: "",
  date_evaluation: getToday(),
  bareme: "20",
  coefficient: "1",
  observation: "",
};

export default function Evaluations() {
  const [evaluations, setEvaluations] =
    useState([]);

  const [annees, setAnnees] = useState([]);
  const [periodes, setPeriodes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [enseignants, setEnseignants] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [loadingPeriodes, setLoadingPeriodes] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [showViewModal, setShowViewModal] =
    useState(false);

  const [selectedEvaluation, setSelectedEvaluation] =
    useState(null);

  const [search, setSearch] = useState("");

  const [form, setForm] =
    useState(initialForm);

  async function loadReferences() {
    try {
      setLoading(true);
      setError("");

      const [
        anneesData,
        classesData,
        matieresData,
        enseignantsData,
      ] = await Promise.all([
        getAnnees(),
        getClasses(),
        getMatieres(),
        getEnseignants(),
      ]);

      setAnnees(
        Array.isArray(anneesData)
          ? anneesData
          : []
      );

      setClasses(
        Array.isArray(classesData)
          ? classesData
          : []
      );

      setMatieres(
        Array.isArray(matieresData)
          ? matieresData
          : []
      );

      setEnseignants(
        Array.isArray(enseignantsData)
          ? enseignantsData
          : []
      );
    } catch (err) {
      setError(
        err.message ||
          "Impossible de charger les données de référence."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadEvaluations() {
    try {
      setError("");

      const data =
        await getEvaluations();

      setEvaluations(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      setError(
        err.message ||
          "Impossible de charger les évaluations."
      );
    }
  }

  useEffect(() => {
    async function load() {
      await loadReferences();
      await loadEvaluations();
    }

    load();
  }, []);

  async function handleAnneeChange(event) {
    const idAnnee =
      event.target.value;

    setForm((previous) => ({
      ...previous,
      id_annee: idAnnee,
      id_periode: "",
    }));

    setPeriodes([]);

    if (!idAnnee) {
      return;
    }

    try {
      setLoadingPeriodes(true);
      setError("");

      const data = await getPeriodes(Number(idAnnee));

      setPeriodes(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      setError(
        err.message ||
          "Impossible de charger les périodes."
      );
    } finally {
      setLoadingPeriodes(false);
    }
  }

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function openCreateModal() {
    setForm({
      ...initialForm,
      date_evaluation: getToday(),
    });

    setSuccess("");
    setError("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.id_annee) {
      setError(
        "Sélectionnez une année scolaire."
      );
      return;
    }

    if (!form.id_periode) {
      setError(
        "Sélectionnez une période."
      );
      return;
    }

    if (!form.id_classe) {
      setError(
        "Sélectionnez une classe."
      );
      return;
    }

    if (!form.id_matiere) {
      setError(
        "Sélectionnez une matière."
      );
      return;
    }

    if (!form.id_enseignant) {
      setError(
        "Sélectionnez un enseignant."
      );
      return;
    }

    if (!form.libelle.trim()) {
      setError(
        "Le libellé est obligatoire."
      );
      return;
    }

    const bareme = Number(form.bareme);
    const coefficient = Number(
      form.coefficient
    );

    if (
      Number.isNaN(bareme) ||
      bareme <= 0
    ) {
      setError(
        "Le barème doit être supérieur à 0."
      );
      return;
    }

    if (
      Number.isNaN(coefficient) ||
      coefficient <= 0
    ) {
      setError(
        "Le coefficient doit être supérieur à 0."
      );
      return;
    }

    const payload = {
      id_annee: Number(form.id_annee),
      id_periode:
        Number(form.id_periode),
      id_classe:
        Number(form.id_classe),
      id_matiere:
        Number(form.id_matiere),
      id_enseignant:
        Number(form.id_enseignant),
      libelle:
        form.libelle.trim(),
      type_evaluation:
        form.type_evaluation.trim() ||
        null,
      date_evaluation:
        form.date_evaluation || null,
      bareme,
      coefficient,
      observation:
        form.observation.trim() ||
        null,
    };

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await createEvaluation(payload);

      await loadEvaluations();

      setSuccess(
        "Évaluation créée avec succès."
      );

      closeModal();
    } catch (err) {
      setError(
        err.message ||
          "Impossible de créer l'évaluation."
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredEvaluations = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    if (!keyword) {
      return evaluations;
    }

    return evaluations.filter(
      (evaluation) => {
        return (
          String(
            evaluation.libelle || ""
          )
            .toLowerCase()
            .includes(keyword) ||
          String(
            evaluation.type_evaluation ||
              ""
          )
            .toLowerCase()
            .includes(keyword)
        );
      }
    );
  }, [evaluations, search]);

  function findClasse(id) {
    return classes.find(
      (item) =>
        Number(item.id_classe) ===
        Number(id)
    );
  }

  function findMatiere(id) {
    return matieres.find(
      (item) =>
        Number(item.id_matiere) ===
        Number(id)
    );
  }

  function findEnseignant(id) {
    return enseignants.find(
      (item) =>
        Number(
          item.id_enseignant
        ) === Number(id)
    );
  }

  function findAnnee(id) {
    return annees.find(
      (item) =>
        Number(item.id_annee) ===
        Number(id)
    );
  }

  function findPeriode(id) {
    return periodes.find(
      (item) =>
        Number(item.id_periode) ===
        Number(id)
    );
  }

  return (
    <div className="evaluations-page">
      <div className="evaluations-header">
        <div>
          <h1>Évaluations</h1>
          <p>
            Gestion des contrôles et évaluations
            pédagogiques
          </p>
        </div>

        <button
          type="button"
          className="evaluations-primary"
          onClick={openCreateModal}
        >
          ＋ Nouvelle évaluation
        </button>
      </div>

      {error && (
        <div className="evaluations-alert error">
          ⚠️ {error}

          <button
            type="button"
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="evaluations-alert success">
          ✅ {success}

          <button
            type="button"
            onClick={() =>
              setSuccess("")
            }
          >
            ×
          </button>
        </div>
      )}

      <div className="evaluations-stats">
        <div>
          <span>📝</span>
          <div>
            <small>
              Total évaluations
            </small>
            <strong>
              {evaluations.length}
            </strong>
          </div>
        </div>

        <div>
          <span>📚</span>
          <div>
            <small>
              Matières concernées
            </small>
            <strong>
              {
                new Set(
                  evaluations.map(
                    (item) =>
                      item.id_matiere
                  )
                ).size
              }
            </strong>
          </div>
        </div>

        <div>
          <span>🏫</span>
          <div>
            <small>
              Classes concernées
            </small>
            <strong>
              {
                new Set(
                  evaluations.map(
                    (item) =>
                      item.id_classe
                  )
                ).size
              }
            </strong>
          </div>
        </div>
      </div>

      <div className="evaluations-toolbar">
        <div className="evaluations-search">
          🔍
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Rechercher une évaluation..."
          />
        </div>

        <button
          type="button"
          onClick={loadEvaluations}
          className="evaluations-refresh"
        >
          ↻ Actualiser
        </button>
      </div>

      <div className="evaluations-table-card">
        {loading ? (
          <div className="evaluations-state">
            Chargement...
          </div>
        ) : filteredEvaluations.length ===
          0 ? (
          <div className="evaluations-state">
            <div>📝</div>

            <h3>
              Aucune évaluation
            </h3>

            <p>
              Commencez par créer une
              évaluation.
            </p>
          </div>
        ) : (
          <div className="evaluations-table-wrapper">
            <table className="evaluations-table">
              <thead>
                <tr>
                  <th>Évaluation</th>
                  <th>Classe</th>
                  <th>Matière</th>
                  <th>Enseignant</th>
                  <th>Date</th>
                  <th>Barème</th>
                  <th>Coefficient</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredEvaluations.map(
                  (evaluation) => {
                    const classe =
                      findClasse(
                        evaluation.id_classe
                      );

                    const matiere =
                      findMatiere(
                        evaluation.id_matiere
                      );

                    const enseignant =
                      findEnseignant(
                        evaluation.id_enseignant
                      );

                    return (
                      <tr
                        key={
                          evaluation.id_evaluation
                        }
                      >
                        <td>
                          <strong>
                            {
                              evaluation.libelle
                            }
                          </strong>

                          <small>
                            {
                              evaluation.type_evaluation ||
                              "Évaluation"
                            }
                          </small>
                        </td>

                        <td>
                          {classe?.nom ||
                            "—"}
                        </td>

                        <td>
                          {matiere?.nom ||
                            "—"}
                        </td>

                        <td>
                          {enseignant
                            ? `${enseignant.prenom} ${enseignant.nom}`
                            : "—"}
                        </td>

                        <td>
                          {
                            evaluation.date_evaluation ||
                            "—"
                          }
                        </td>

                        <td>
                          {
                            evaluation.bareme
                          }
                        </td>

                        <td>
                          {
                            evaluation.coefficient
                          }
                        </td>

                        <td>
                          <button
                            type="button"
                            className="evaluations-view-btn"
                            onClick={() => {
                              setSelectedEvaluation(
                                evaluation
                              );
                              setShowViewModal(
                                true
                              );
                            }}
                          >
                            👁️
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="evaluations-modal-overlay">
          <div className="evaluations-modal">
            <div className="evaluations-modal-header">
              <div>
                <h2>
                  Nouvelle évaluation
                </h2>
                <p>
                  Définissez les paramètres de
                  l'évaluation.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="evaluations-close"
              >
                ×
              </button>
            </div>

            <form
              className="evaluations-form"
              onSubmit={handleSubmit}
            >
              <div className="evaluations-grid">
                <div>
                  <label>
                    Année scolaire *
                  </label>

                  <select
                    name="id_annee"
                    value={form.id_annee}
                    onChange={
                      handleAnneeChange
                    }
                  >
                    <option value="">
                      -- Sélectionner --
                    </option>

                    {annees.map(
                      (annee) => (
                        <option
                          key={
                            annee.id_annee
                          }
                          value={
                            annee.id_annee
                          }
                        >
                          {annee.libelle}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label>
                    Période *
                  </label>

                  <select
                    name="id_periode"
                    value={
                      form.id_periode
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      !form.id_annee ||
                      loadingPeriodes
                    }
                  >
                    <option value="">
                      {loadingPeriodes
                        ? "Chargement..."
                        : "-- Sélectionner --"}
                    </option>

                    {periodes.map(
                      (periode) => (
                        <option
                          key={
                            periode.id_periode
                          }
                          value={
                            periode.id_periode
                          }
                        >
                          {periode.code} —{" "}
                          {periode.libelle}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label>
                    Classe *
                  </label>

                  <select
                    name="id_classe"
                    value={
                      form.id_classe
                    }
                    onChange={
                      handleChange
                    }
                  >
                    <option value="">
                      -- Sélectionner --
                    </option>

                    {classes.map(
                      (classe) => (
                        <option
                          key={
                            classe.id_classe
                          }
                          value={
                            classe.id_classe
                          }
                        >
                          {classe.nom}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label>
                    Matière *
                  </label>

                  <select
                    name="id_matiere"
                    value={
                      form.id_matiere
                    }
                    onChange={
                      handleChange
                    }
                  >
                    <option value="">
                      -- Sélectionner --
                    </option>

                    {matieres.map(
                      (matiere) => (
                        <option
                          key={
                            matiere.id_matiere
                          }
                          value={
                            matiere.id_matiere
                          }
                        >
                          {matiere.code} —{" "}
                          {matiere.nom}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="evaluations-full">
                  <label>
                    Enseignant *
                  </label>

                  <select
                    name="id_enseignant"
                    value={
                      form.id_enseignant
                    }
                    onChange={
                      handleChange
                    }
                  >
                    <option value="">
                      -- Sélectionner --
                    </option>

                    {enseignants.map(
                      (enseignant) => (
                        <option
                          key={
                            enseignant.id_enseignant
                          }
                          value={
                            enseignant.id_enseignant
                          }
                        >
                          {
                            enseignant.prenom
                          }{" "}
                          {enseignant.nom}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label>
                    Libellé *
                  </label>

                  <input
                    name="libelle"
                    value={form.libelle}
                    onChange={
                      handleChange
                    }
                    placeholder="Ex. Contrôle 1"
                  />
                </div>

                <div>
                  <label>
                    Type d'évaluation
                  </label>

                  <input
                    name="type_evaluation"
                    value={
                      form.type_evaluation
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Ex. Interrogation"
                  />
                </div>

                <div>
                  <label>
                    Date
                  </label>

                  <input
                    type="date"
                    name="date_evaluation"
                    value={
                      form.date_evaluation
                    }
                    onChange={
                      handleChange
                    }
                  />
                </div>

                <div>
                  <label>
                    Barème *
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    name="bareme"
                    value={form.bareme}
                    onChange={
                      handleChange
                    }
                  />
                </div>

                <div>
                  <label>
                    Coefficient *
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    name="coefficient"
                    value={
                      form.coefficient
                    }
                    onChange={
                      handleChange
                    }
                  />
                </div>

                <div className="evaluations-full">
                  <label>
                    Observation
                  </label>

                  <textarea
                    name="observation"
                    value={
                      form.observation
                    }
                    onChange={
                      handleChange
                    }
                    rows="4"
                    placeholder="Observation facultative..."
                  />
                </div>
              </div>

              <div className="evaluations-footer">
                <button
                  type="button"
                  className="evaluations-cancel"
                  onClick={closeModal}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="evaluations-save"
                  disabled={saving}
                >
                  {saving
                    ? "Création..."
                    : "Créer l'évaluation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal &&
        selectedEvaluation && (
          <div className="evaluations-modal-overlay">
            <div className="evaluations-modal">
              <div className="evaluations-modal-header">
                <div>
                  <h2>
                    Détails de l'évaluation
                  </h2>
                </div>

                <button
                  type="button"
                  className="evaluations-close"
                  onClick={() =>
                    setShowViewModal(
                      false
                    )
                  }
                >
                  ×
                </button>
              </div>

              <div className="evaluations-details">
                <div>
                  <span>
                    Libellé
                  </span>

                  <strong>
                    {
                      selectedEvaluation.libelle
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Type
                  </span>

                  <strong>
                    {
                      selectedEvaluation.type_evaluation ||
                      "—"
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Année
                  </span>

                  <strong>
                    {
                      findAnnee(
                        selectedEvaluation.id_annee
                      )?.libelle ||
                      "—"
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Période
                  </span>

                  <strong>
                    {
                      findPeriode(
                        selectedEvaluation.id_periode
                      )?.libelle ||
                      `#${selectedEvaluation.id_periode}`
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Classe
                  </span>

                  <strong>
                    {
                      findClasse(
                        selectedEvaluation.id_classe
                      )?.nom ||
                      "—"
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Matière
                  </span>

                  <strong>
                    {
                      findMatiere(
                        selectedEvaluation.id_matiere
                      )?.nom ||
                      "—"
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Enseignant
                  </span>

                  <strong>
                    {(() => {
                      const teacher =
                        findEnseignant(
                          selectedEvaluation.id_enseignant
                        );

                      return teacher
                        ? `${teacher.prenom} ${teacher.nom}`
                        : "—";
                    })()}
                  </strong>
                </div>

                <div>
                  <span>
                    Date
                  </span>

                  <strong>
                    {
                      selectedEvaluation.date_evaluation ||
                      "—"
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Barème
                  </span>

                  <strong>
                    {
                      selectedEvaluation.bareme
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Coefficient
                  </span>

                  <strong>
                    {
                      selectedEvaluation.coefficient
                    }
                  </strong>
                </div>

                <div className="evaluations-detail-full">
                  <span>
                    Observation
                  </span>

                  <strong>
                    {
                      selectedEvaluation.observation ||
                      "Aucune observation"
                    }
                  </strong>
                </div>
              </div>

              <div className="evaluations-footer">
                <button
                  type="button"
                  className="evaluations-cancel"
                  onClick={() =>
                    setShowViewModal(
                      false
                    )
                  }
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}