import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getEmplois,
  createEmploi,
  updateEmploi,
  deleteEmploi,
} from "../../services/emploiTempsApi";

import { getAnnees } from "../../services/anneesApi";
import { getClasses } from "../../services/classesApi";
import { getMatieres } from "../../services/matieresApi";
import { getEnseignants } from "../../services/enseignantsApi";

import "./EmploiDuTemps.css";

const initialForm = {
  id_annee: "",
  id_classe: "",
  id_enseignant: "",
  id_matiere: "",
  jour_semaine: "Lundi",
  heure_debut: "08:00",
  heure_fin: "10:00",
  salle: "",
  observation: "",
};

const jours = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

export default function EmploiDuTemps() {
  const [emplois, setEmplois] = useState(
    []
  );

  const [annees, setAnnees] = useState([]);
  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [enseignants, setEnseignants] =
    useState([]);

  const [selectedAnnee, setSelectedAnnee] =
    useState("");

  const [selectedClasse, setSelectedClasse] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [showViewModal, setShowViewModal] =
    useState(false);

  const [editingEmploi, setEditingEmploi] =
    useState(null);

  const [selectedEmploi, setSelectedEmploi] =
    useState(null);

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
          "Impossible de charger les données."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadEmplois(filters = {}) {
    try {
      setError("");

      const data =
        await getEmplois(filters);

      setEmplois(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      setError(
        err.message ||
          "Impossible de charger l'emploi du temps."
      );
    }
  }

  useEffect(() => {
    async function load() {
      await loadReferences();
      await loadEmplois();
    }

    load();
  }, []);

  function findClasse(id) {
    return classes.find(
      (item) =>
        Number(item.id_classe) ===
        Number(id)
    );
  }

  function findAnnee(id) {
    return annees.find(
      (item) =>
        Number(item.id_annee) ===
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

  async function handleFilterAnnee(
    event
  ) {
    const value = event.target.value;

    setSelectedAnnee(value);

    await loadEmplois({
      idAnnee: value || null,
      idClasse:
        selectedClasse || null,
    });
  }

  async function handleFilterClasse(
    event
  ) {
    const value = event.target.value;

    setSelectedClasse(value);

    await loadEmplois({
      idAnnee:
        selectedAnnee || null,
      idClasse: value || null,
    });
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
    setEditingEmploi(null);

    setForm({
      ...initialForm,
      id_annee:
        selectedAnnee || "",
      id_classe:
        selectedClasse || "",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function openEditModal(emploi) {
    setEditingEmploi(emploi);

    setForm({
      id_annee: emploi.id_annee,
      id_classe: emploi.id_classe,
      id_enseignant:
        emploi.id_enseignant,
      id_matiere:
        emploi.id_matiere,
      jour_semaine:
        emploi.jour_semaine,
      heure_debut:
        emploi.heure_debut,
      heure_fin:
        emploi.heure_fin,
      salle: emploi.salle || "",
      observation:
        emploi.observation || "",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingEmploi(null);
    setForm(initialForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.id_annee) {
      setError(
        "Sélectionnez une année scolaire."
      );
      return;
    }

    if (!form.id_classe) {
      setError(
        "Sélectionnez une classe."
      );
      return;
    }

    if (!form.id_enseignant) {
      setError(
        "Sélectionnez un enseignant."
      );
      return;
    }

    if (!form.id_matiere) {
      setError(
        "Sélectionnez une matière."
      );
      return;
    }

    if (!form.jour_semaine) {
      setError(
        "Sélectionnez un jour."
      );
      return;
    }

    if (!form.heure_debut) {
      setError(
        "L'heure de début est obligatoire."
      );
      return;
    }

    if (!form.heure_fin) {
      setError(
        "L'heure de fin est obligatoire."
      );
      return;
    }

    if (
      form.heure_fin <=
      form.heure_debut
    ) {
      setError(
        "L'heure de fin doit être supérieure à l'heure de début."
      );
      return;
    }

    const payload = {
      id_annee:
        Number(form.id_annee),
      id_classe:
        Number(form.id_classe),
      id_enseignant:
        Number(form.id_enseignant),
      id_matiere:
        Number(form.id_matiere),
      jour_semaine:
        form.jour_semaine,
      heure_debut:
        form.heure_debut,
      heure_fin:
        form.heure_fin,
      salle:
        form.salle.trim() || null,
      observation:
        form.observation.trim() ||
        null,
    };

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingEmploi) {
        await updateEmploi(
          editingEmploi.id_emploi,
          {
            id_enseignant:
              payload.id_enseignant,
            id_matiere:
              payload.id_matiere,
            jour_semaine:
              payload.jour_semaine,
            heure_debut:
              payload.heure_debut,
            heure_fin:
              payload.heure_fin,
            salle:
              payload.salle,
            observation:
              payload.observation,
          }
        );
      } else {
        await createEmploi(payload);
      }

      await loadEmplois({
        idAnnee:
          selectedAnnee || null,
        idClasse:
          selectedClasse || null,
      });

      setSuccess(
        editingEmploi
          ? "Créneau modifié avec succès."
          : "Créneau créé avec succès."
      );

      closeModal();
    } catch (err) {
      setError(
        err.message ||
          "Impossible d'enregistrer le créneau."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(emploi) {
    const classe =
      findClasse(emploi.id_classe);

    const confirmed = window.confirm(
      `Supprimer le créneau de ${classe?.nom || "la classe"} le ${emploi.jour_semaine} ?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await deleteEmploi(
        emploi.id_emploi
      );

      await loadEmplois({
        idAnnee:
          selectedAnnee || null,
        idClasse:
          selectedClasse || null,
      });

      setSuccess(
        "Créneau supprimé avec succès."
      );
    } catch (err) {
      setError(
        err.message ||
          "Impossible de supprimer le créneau."
      );
    }
  }

  const emploisParJour = useMemo(() => {
    const result = {};

    jours.forEach((jour) => {
      result[jour] = [];
    });

    emplois.forEach((emploi) => {
      if (!result[emploi.jour_semaine]) {
        result[emploi.jour_semaine] =
          [];
      }

      result[
        emploi.jour_semaine
      ].push(emploi);
    });

    Object.values(result).forEach(
      (items) => {
        items.sort((a, b) =>
          String(
            a.heure_debut
          ).localeCompare(
            String(b.heure_debut)
          )
        );
      }
    );

    return result;
  }, [emplois]);

  return (
    <div className="emploi-page">
      <div className="emploi-header">
        <div>
          <h1>Emploi du temps</h1>
          <p>
            Organisation des cours par classe
          </p>
        </div>

        <button
          type="button"
          className="emploi-primary"
          onClick={openCreateModal}
        >
          ＋ Nouveau créneau
        </button>
      </div>

      {error && (
        <div className="emploi-alert error">
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
        <div className="emploi-alert success">
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

      <div className="emploi-filters">
        <div>
          <label>Année scolaire</label>

          <select
            value={selectedAnnee}
            onChange={
              handleFilterAnnee
            }
          >
            <option value="">
              Toutes les années
            </option>

            {annees.map((annee) => (
              <option
                key={annee.id_annee}
                value={annee.id_annee}
              >
                {annee.libelle}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Classe</label>

          <select
            value={selectedClasse}
            onChange={
              handleFilterClasse
            }
          >
            <option value="">
              Toutes les classes
            </option>

            {classes.map((classe) => (
              <option
                key={classe.id_classe}
                value={classe.id_classe}
              >
                {classe.nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="emploi-summary">
        <div>
          <span>📅</span>
          <div>
            <small>Créneaux</small>
            <strong>
              {emplois.length}
            </strong>
          </div>
        </div>

        <div>
          <span>🏫</span>
          <div>
            <small>Classes</small>
            <strong>
              {
                new Set(
                  emplois.map(
                    (item) =>
                      item.id_classe
                  )
                ).size
              }
            </strong>
          </div>
        </div>

        <div>
          <span>👨‍🏫</span>
          <div>
            <small>Enseignants</small>
            <strong>
              {
                new Set(
                  emplois.map(
                    (item) =>
                      item.id_enseignant
                  )
                ).size
              }
            </strong>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="emploi-state">
          Chargement...
        </div>
      ) : (
        <div className="emploi-calendar">
          {jours.map((jour) => (
            <div
              className="emploi-day"
              key={jour}
            >
              <div className="emploi-day-header">
                <h3>{jour}</h3>
                <span>
                  {
                    (
                      emploisParJour[
                        jour
                      ] || []
                    ).length
                  }{" "}
                  cours
                </span>
              </div>

              <div className="emploi-day-content">
                {(
                  emploisParJour[
                    jour
                  ] || []
                ).length === 0 ? (
                  <div className="emploi-empty">
                    Aucun cours
                  </div>
                ) : (
                  (
                    emploisParJour[
                      jour
                    ] || []
                  ).map((emploi) => {
                    const classe =
                      findClasse(
                        emploi.id_classe
                      );

                    const matiere =
                      findMatiere(
                        emploi.id_matiere
                      );

                    const enseignant =
                      findEnseignant(
                        emploi.id_enseignant
                      );

                    return (
                      <div
                        className="emploi-card"
                        key={
                          emploi.id_emploi
                        }
                      >
                        <div className="emploi-time">
                          {
                            emploi.heure_debut
                          }
                          <span>
                            →
                          </span>
                          {
                            emploi.heure_fin
                          }
                        </div>

                        <strong>
                          {matiere?.nom ||
                            "Matière"}
                        </strong>

                        <span>
                          🏫{" "}
                          {classe?.nom ||
                            "Classe"}
                        </span>

                        <span>
                          👨‍🏫{" "}
                          {enseignant
                            ? `${enseignant.prenom} ${enseignant.nom}`
                            : "Enseignant"}
                        </span>

                        {emploi.salle && (
                          <span>
                            🚪{" "}
                            {emploi.salle}
                          </span>
                        )}

                        <div className="emploi-card-actions">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEmploi(
                                emploi
                              );
                              setShowViewModal(
                                true
                              );
                            }}
                          >
                            👁️
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                emploi
                              )
                            }
                          >
                            ✏️
                          </button>

                          <button
                            type="button"
                            className="danger"
                            onClick={() =>
                              handleDelete(
                                emploi
                              )
                            }
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="emploi-modal-overlay">
          <div className="emploi-modal">
            <div className="emploi-modal-header">
              <div>
                <h2>
                  {editingEmploi
                    ? "Modifier le créneau"
                    : "Nouveau créneau"}
                </h2>

                <p>
                  Planifiez un cours.
                </p>
              </div>

              <button
                type="button"
                className="emploi-close"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form
              className="emploi-form"
              onSubmit={handleSubmit}
            >
              <div className="emploi-grid">
                <div>
                  <label>
                    Année *
                  </label>

                  <select
                    name="id_annee"
                    value={form.id_annee}
                    onChange={
                      handleChange
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

                <div>
                  <label>
                    Jour *
                  </label>

                  <select
                    name="jour_semaine"
                    value={
                      form.jour_semaine
                    }
                    onChange={
                      handleChange
                    }
                  >
                    {jours.map(
                      (jour) => (
                        <option
                          key={jour}
                          value={jour}
                        >
                          {jour}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label>
                    Salle
                  </label>

                  <input
                    name="salle"
                    value={form.salle}
                    onChange={
                      handleChange
                    }
                    placeholder="Ex. Salle 3"
                  />
                </div>

                <div>
                  <label>
                    Heure début *
                  </label>

                  <input
                    type="time"
                    name="heure_debut"
                    value={
                      form.heure_debut
                    }
                    onChange={
                      handleChange
                    }
                  />
                </div>

                <div>
                  <label>
                    Heure fin *
                  </label>

                  <input
                    type="time"
                    name="heure_fin"
                    value={
                      form.heure_fin
                    }
                    onChange={
                      handleChange
                    }
                  />
                </div>

                <div className="emploi-full">
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
                  />
                </div>
              </div>

              <div className="emploi-footer">
                <button
                  type="button"
                  className="emploi-cancel"
                  onClick={closeModal}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="emploi-save"
                  disabled={saving}
                >
                  {saving
                    ? "Enregistrement..."
                    : editingEmploi
                    ? "Enregistrer"
                    : "Créer le créneau"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal &&
        selectedEmploi && (
          <div className="emploi-modal-overlay">
            <div className="emploi-modal emploi-view-modal">
              <div className="emploi-modal-header">
                <h2>
                  Détails du créneau
                </h2>

                <button
                  type="button"
                  className="emploi-close"
                  onClick={() =>
                    setShowViewModal(
                      false
                    )
                  }
                >
                  ×
                </button>
              </div>

              <div className="emploi-details">
                <div>
                  <span>
                    Jour
                  </span>
                  <strong>
                    {
                      selectedEmploi.jour_semaine
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Horaire
                  </span>
                  <strong>
                    {
                      selectedEmploi.heure_debut
                    }{" "}
                    →{" "}
                    {
                      selectedEmploi.heure_fin
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
                        selectedEmploi.id_classe
                      )?.nom
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
                        selectedEmploi.id_matiere
                      )?.nom
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Enseignant
                  </span>
                  <strong>
                    {(() => {
                      const enseignant =
                        findEnseignant(
                          selectedEmploi.id_enseignant
                        );

                      return enseignant
                        ? `${enseignant.prenom} ${enseignant.nom}`
                        : "—";
                    })()}
                  </strong>
                </div>

                <div>
                  <span>
                    Salle
                  </span>
                  <strong>
                    {
                      selectedEmploi.salle ||
                      "—"
                    }
                  </strong>
                </div>

                <div className="emploi-detail-full">
                  <span>
                    Observation
                  </span>
                  <strong>
                    {
                      selectedEmploi.observation ||
                      "Aucune observation"
                    }
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}