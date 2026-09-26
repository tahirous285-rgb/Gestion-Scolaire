import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getEnseignants,
  linkEnseignantMatiere,
  getMatieresOfEnseignant,
  linkEnseignantClasse,
  getClassesOfEnseignant,
} from "../../services/enseignantsApi";

import { getMatieres } from "../../services/matieresApi";
import { getClasses } from "../../services/classesApi";
import { getAnnees } from "../../services/anneesApi";

import "./Affectations.css";

export default function Affectations() {
  const [enseignants, setEnseignants] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [classes, setClasses] = useState([]);
  const [annees, setAnnees] = useState([]);

  const [selectedEnseignant, setSelectedEnseignant] =
    useState("");

  const [matiereAssignments, setMatiereAssignments] =
    useState([]);

  const [classeAssignments, setClasseAssignments] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingAssignments, setLoadingAssignments] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [tab, setTab] = useState("matieres");

  const [matiereForm, setMatiereForm] =
    useState({
      id_matiere: "",
      principal: false,
    });

  const [classeForm, setClasseForm] =
    useState({
      id_classe: "",
      id_annee: "",
      principal: false,
    });

  async function loadReferences() {
    try {
      setLoading(true);
      setError("");

      const [
        enseignantsData,
        matieresData,
        classesData,
        anneesData,
      ] = await Promise.all([
        getEnseignants(),
        getMatieres(),
        getClasses(),
        getAnnees(),
      ]);

      setEnseignants(
        Array.isArray(enseignantsData)
          ? enseignantsData
          : []
      );

      setMatieres(
        Array.isArray(matieresData)
          ? matieresData
          : []
      );

      setClasses(
        Array.isArray(classesData)
          ? classesData
          : []
      );

      setAnnees(
        Array.isArray(anneesData)
          ? anneesData
          : []
      );
    } catch (err) {
      setError(
        err.message ||
          "Impossible de charger les données."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReferences();
  }, []);

  async function loadAssignments(idEnseignant) {
    if (!idEnseignant) {
      setMatiereAssignments([]);
      setClasseAssignments([]);
      return;
    }

    try {
      setLoadingAssignments(true);
      setError("");

      const [
        matieresData,
        classesData,
      ] = await Promise.all([
        getMatieresOfEnseignant(
          idEnseignant
        ),
        getClassesOfEnseignant(
          idEnseignant
        ),
      ]);

      setMatiereAssignments(
        Array.isArray(matieresData)
          ? matieresData
          : []
      );

      setClasseAssignments(
        Array.isArray(classesData)
          ? classesData
          : []
      );
    } catch (err) {
      setError(
        err.message ||
          "Impossible de charger les affectations."
      );
    } finally {
      setLoadingAssignments(false);
    }
  }

  async function handleSelectEnseignant(event) {
    const id = event.target.value;

    setSelectedEnseignant(id);
    setSuccess("");
    setError("");

    setMatiereForm({
      id_matiere: "",
      principal: false,
    });

    setClasseForm({
      id_classe: "",
      id_annee: "",
      principal: false,
    });

    await loadAssignments(
      id ? Number(id) : ""
    );
  }

  async function handleAffecterMatiere(event) {
    event.preventDefault();

    if (!selectedEnseignant) {
      setError(
        "Sélectionnez d'abord un enseignant."
      );
      return;
    }

    if (!matiereForm.id_matiere) {
      setError(
        "Sélectionnez une matière."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await linkEnseignantMatiere({
        id_enseignant:
          Number(selectedEnseignant),
        id_matiere:
          Number(
            matiereForm.id_matiere
          ),
        principal:
          Boolean(
            matiereForm.principal
          ),
      });

      setSuccess(
        "La matière a été affectée à l'enseignant."
      );

      setMatiereForm({
        id_matiere: "",
        principal: false,
      });

      await loadAssignments(
        Number(selectedEnseignant)
      );
    } catch (err) {
      setError(
        err.message ||
          "Impossible d'affecter la matière."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAffecterClasse(event) {
    event.preventDefault();

    if (!selectedEnseignant) {
      setError(
        "Sélectionnez d'abord un enseignant."
      );
      return;
    }

    if (!classeForm.id_classe) {
      setError(
        "Sélectionnez une classe."
      );
      return;
    }

    if (!classeForm.id_annee) {
      setError(
        "Sélectionnez une année scolaire."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await linkEnseignantClasse({
        id_enseignant:
          Number(selectedEnseignant),
        id_classe:
          Number(
            classeForm.id_classe
          ),
        id_annee:
          Number(
            classeForm.id_annee
          ),
        principal:
          Boolean(
            classeForm.principal
          ),
      });

      setSuccess(
        "La classe a été affectée à l'enseignant."
      );

      setClasseForm({
        id_classe: "",
        id_annee: "",
        principal: false,
      });

      await loadAssignments(
        Number(selectedEnseignant)
      );
    } catch (err) {
      setError(
        err.message ||
          "Impossible d'affecter la classe."
      );
    } finally {
      setSaving(false);
    }
  }

  const selectedTeacher = useMemo(
    () =>
      enseignants.find(
        (enseignant) =>
          Number(
            enseignant.id_enseignant
          ) ===
          Number(selectedEnseignant)
      ),
    [
      enseignants,
      selectedEnseignant,
    ]
  );

  function findMatiere(id) {
    return matieres.find(
      (matiere) =>
        Number(matiere.id_matiere) ===
        Number(id)
    );
  }

  function findClasse(id) {
    return classes.find(
      (classe) =>
        Number(classe.id_classe) ===
        Number(id)
    );
  }

  function findAnnee(id) {
    return annees.find(
      (annee) =>
        Number(annee.id_annee) ===
        Number(id)
    );
  }

  return (
    <div className="affectations-page">
      <div className="affectations-header">
        <div>
          <h1>Affectations</h1>
          <p>
            Affectation des enseignants aux matières
            et aux classes
          </p>
        </div>
      </div>

      {error && (
        <div className="affectations-alert error">
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
        <div className="affectations-alert success">
          ✅ {success}
          <button
            type="button"
            onClick={() => setSuccess("")}
          >
            ×
          </button>
        </div>
      )}

      <div className="affectations-select-card">
        <label>
          Sélectionner un enseignant
        </label>

        <select
          value={selectedEnseignant}
          onChange={handleSelectEnseignant}
        >
          <option value="">
            -- Sélectionner un enseignant --
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
                {enseignant.prenom}{" "}
                {enseignant.nom} —{" "}
                {enseignant.matricule}
              </option>
            )
          )}
        </select>

        {selectedTeacher && (
          <div className="affectations-teacher-info">
            <div className="affectations-teacher-avatar">
              {String(
                selectedTeacher.prenom ||
                  "E"
              )
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {selectedTeacher.prenom}{" "}
                {selectedTeacher.nom}
              </strong>

              <span>
                {selectedTeacher.matricule}
              </span>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="affectations-state">
          Chargement...
        </div>
      ) : !selectedEnseignant ? (
        <div className="affectations-state">
          <div>👨‍🏫</div>
          <h3>
            Sélectionnez un enseignant
          </h3>
          <p>
            Les affectations apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="affectations-content">
          <div className="affectations-tabs">
            <button
              type="button"
              className={
                tab === "matieres"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setTab("matieres")
              }
            >
              📚 Matières
            </button>

            <button
              type="button"
              className={
                tab === "classes"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setTab("classes")
              }
            >
              🏫 Classes
            </button>
          </div>

          {tab === "matieres" && (
            <div className="affectations-grid">
              <div className="affectation-form-card">
                <h2>
                  Affecter une matière
                </h2>

                <form
                  onSubmit={
                    handleAffecterMatiere
                  }
                >
                  <label>
                    Matière *
                  </label>

                  <select
                    value={
                      matiereForm.id_matiere
                    }
                    onChange={(event) =>
                      setMatiereForm(
                        (previous) => ({
                          ...previous,
                          id_matiere:
                            event.target
                              .value,
                        })
                      )
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

                  <label className="affectation-checkbox">
                    <input
                      type="checkbox"
                      checked={
                        matiereForm.principal
                      }
                      onChange={(event) =>
                        setMatiereForm(
                          (previous) => ({
                            ...previous,
                            principal:
                              event.target
                                .checked,
                          })
                        )
                      }
                    />
                    Matière principale
                  </label>

                  <button
                    type="submit"
                    disabled={saving}
                  >
                    {saving
                      ? "Enregistrement..."
                      : "Affecter la matière"}
                  </button>
                </form>
              </div>

              <div className="affectations-list-card">
                <div className="affectations-card-header">
                  <div>
                    <h2>
                      Matières affectées
                    </h2>

                    <span>
                      {
                        matiereAssignments.length
                      }{" "}
                      affectation(s)
                    </span>
                  </div>
                </div>

                {loadingAssignments ? (
                  <div className="affectations-loading">
                    Chargement...
                  </div>
                ) : matiereAssignments.length ===
                  0 ? (
                  <div className="affectations-empty">
                    Aucune matière affectée.
                  </div>
                ) : (
                  <div className="affectations-items">
                    {matiereAssignments.map(
                      (item, index) => {
                        const matiere =
                          findMatiere(
                            item.id_matiere
                          );

                        return (
                          <div
                            className="affectation-item"
                            key={`${item.id_matiere}-${index}`}
                          >
                            <div>
                              <strong>
                                {matiere?.nom ||
                                  `Matière #${item.id_matiere}`}
                              </strong>

                              <span>
                                {matiere?.code ||
                                  "Code indisponible"}
                              </span>
                            </div>

                            {item.principal && (
                              <em>
                                Principale
                              </em>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "classes" && (
            <div className="affectations-grid">
              <div className="affectation-form-card">
                <h2>
                  Affecter une classe
                </h2>

                <form
                  onSubmit={
                    handleAffecterClasse
                  }
                >
                  <label>
                    Année scolaire *
                  </label>

                  <select
                    value={
                      classeForm.id_annee
                    }
                    onChange={(event) =>
                      setClasseForm(
                        (previous) => ({
                          ...previous,
                          id_annee:
                            event.target
                              .value,
                        })
                      )
                    }
                  >
                    <option value="">
                      -- Sélectionner --
                    </option>

                    {annees.map(
                      (annee) => (
                        <option
                          key={annee.id_annee}
                          value={
                            annee.id_annee
                          }
                        >
                          {annee.libelle}
                        </option>
                      )
                    )}
                  </select>

                  <label>
                    Classe *
                  </label>

                  <select
                    value={
                      classeForm.id_classe
                    }
                    onChange={(event) =>
                      setClasseForm(
                        (previous) => ({
                          ...previous,
                          id_classe:
                            event.target
                              .value,
                        })
                      )
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

                  <label className="affectation-checkbox">
                    <input
                      type="checkbox"
                      checked={
                        classeForm.principal
                      }
                      onChange={(event) =>
                        setClasseForm(
                          (previous) => ({
                            ...previous,
                            principal:
                              event.target
                                .checked,
                          })
                        )
                      }
                    />
                    Classe principale
                  </label>

                  <button
                    type="submit"
                    disabled={saving}
                  >
                    {saving
                      ? "Enregistrement..."
                      : "Affecter la classe"}
                  </button>
                </form>
              </div>

              <div className="affectations-list-card">
                <div className="affectations-card-header">
                  <div>
                    <h2>
                      Classes affectées
                    </h2>

                    <span>
                      {
                        classeAssignments.length
                      }{" "}
                      affectation(s)
                    </span>
                  </div>
                </div>

                {loadingAssignments ? (
                  <div className="affectations-loading">
                    Chargement...
                  </div>
                ) : classeAssignments.length ===
                  0 ? (
                  <div className="affectations-empty">
                    Aucune classe affectée.
                  </div>
                ) : (
                  <div className="affectations-items">
                    {classeAssignments.map(
                      (item, index) => {
                        const classe =
                          findClasse(
                            item.id_classe
                          );

                        const annee =
                          findAnnee(
                            item.id_annee
                          );

                        return (
                          <div
                            className="affectation-item"
                            key={`${item.id_classe}-${item.id_annee}-${index}`}
                          >
                            <div>
                              <strong>
                                {classe?.nom ||
                                  `Classe #${item.id_classe}`}
                              </strong>

                              <span>
                                {annee?.libelle ||
                                  `Année #${item.id_annee}`}
                              </span>
                            </div>

                            {item.principal && (
                              <em>
                                Principale
                              </em>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}