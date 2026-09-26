import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getPresencesEnseignants,
  createPresenceEnseignant,
  updatePresenceEnseignant,
} from "../../services/presencesEnseignantsApi";

import { getEnseignants } from "../../services/enseignantsApi";
import { getAnnees } from "../../services/anneesApi";

import "./CahierMaitre.css";

function getToday() {
  return new Date()
    .toISOString()
    .split("T")[0];
}

const initialForm = {
  id_enseignant: "",
  id_annee: "",
  date_presence: getToday(),
  heure_arrivee: "",
  heure_depart: "",
  statut: "PRESENT",
  motif: "",
  justification: "",
  justificatif: "",
  validee: false,
  id_validateur: "",
  observation: "",
};

const statuts = [
  {
    value: "PRESENT",
    label: "Présent",
  },
  {
    value: "ABSENT",
    label: "Absent",
  },
  {
    value: "RETARD",
    label: "Retard",
  },
  {
    value: "PERMISSION",
    label: "Permission",
  },
  {
    value: "MISSION",
    label: "Mission",
  },
  {
    value: "CONGE",
    label: "Congé",
  },
  {
    value: "AUTRE",
    label: "Autre",
  },
];

export default function CahierMaitre() {
  const [
    presences,
    setPresences,
  ] = useState([]);

  const [
    enseignants,
    setEnseignants,
  ] = useState([]);

  const [annees, setAnnees] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [
    selectedEnseignant,
    setSelectedEnseignant,
  ] = useState("");

  const [
    selectedAnnee,
    setSelectedAnnee,
  ] = useState("");

  const [selectedDate, setSelectedDate] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [
    editingPresence,
    setEditingPresence,
  ] = useState(null);

  const [form, setForm] =
    useState(initialForm);

  async function loadReferences() {
    try {
      const [
        enseignantsData,
        anneesData,
      ] = await Promise.all([
        getEnseignants(),
        getAnnees(),
      ]);

      setEnseignants(
        Array.isArray(enseignantsData)
          ? enseignantsData
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
          "Impossible de charger les données de référence."
      );
    }
  }

  async function loadPresences() {
    try {
      setLoading(true);
      setError("");

      const data =
        await getPresencesEnseignants({
          idEnseignant:
            selectedEnseignant || null,
        });

      setPresences(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      setError(
        err.message ||
          "Impossible de charger les présences des enseignants."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function load() {
      await loadReferences();
      await loadPresences();
    }

    load();
  }, []);

  useEffect(() => {
    loadPresences();
  }, [selectedEnseignant]);

  function findEnseignant(id) {
    return enseignants.find(
      (enseignant) =>
        Number(
          enseignant.id_enseignant
        ) === Number(id)
    );
  }

  function findAnnee(id) {
    return annees.find(
      (annee) =>
        Number(annee.id_annee) ===
        Number(id)
    );
  }

  function getTeacherName(id) {
    const teacher =
      findEnseignant(id);

    if (!teacher) {
      return `Enseignant #${id}`;
    }

    return `${teacher.prenom} ${teacher.nom}`;
  }

  function getStatusLabel(status) {
    const found = statuts.find(
      (item) =>
        item.value === status
    );

    return found
      ? found.label
      : status || "Autre";
  }

  const filteredPresences = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    return presences.filter(
      (presence) => {
        const teacherName =
          getTeacherName(
            presence.id_enseignant
          ).toLowerCase();

        const matchesSearch =
          !keyword ||
          teacherName.includes(
            keyword
          ) ||
          String(
            presence.statut || ""
          )
            .toLowerCase()
            .includes(keyword) ||
          String(
            presence.date_presence || ""
          ).includes(keyword);

        const matchesYear =
          !selectedAnnee ||
          Number(
            presence.id_annee
          ) ===
            Number(selectedAnnee);

        const matchesDate =
          !selectedDate ||
          presence.date_presence ===
            selectedDate;

        return (
          matchesSearch &&
          matchesYear &&
          matchesDate
        );
      }
    );
  }, [
    presences,
    search,
    selectedAnnee,
    selectedDate,
    enseignants,
  ]);

  const total = presences.length;

  const presents = presences.filter(
    (item) =>
      item.statut === "PRESENT"
  ).length;

  const absents = presences.filter(
    (item) =>
      item.statut === "ABSENT"
  ).length;

  const retards = presences.filter(
    (item) =>
      item.statut === "RETARD"
  ).length;

  const retardsEtAbsences =
    absents + retards;

  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  function openCreateModal() {
    setEditingPresence(null);

    const defaultAnnee =
      selectedAnnee ||
      (annees.length > 0
        ? String(
            annees.find(
              (annee) =>
                annee.statut === "active"
            )?.id_annee ||
              annees[0].id_annee
          )
        : "");

    setForm({
      ...initialForm,
      id_enseignant:
        selectedEnseignant || "",
      id_annee: defaultAnnee,
      date_presence:
        selectedDate || getToday(),
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function openEditModal(presence) {
    setEditingPresence(presence);

    setForm({
      id_enseignant:
        presence.id_enseignant || "",
      id_annee:
        presence.id_annee || "",
      date_presence:
        presence.date_presence ||
        getToday(),
      heure_arrivee:
        presence.heure_arrivee || "",
      heure_depart:
        presence.heure_depart || "",
      statut:
        presence.statut || "PRESENT",
      motif: presence.motif || "",
      justification:
        presence.justification || "",
      justificatif:
        presence.justificatif || "",
      validee:
        presence.validee === true,
      id_validateur:
        presence.id_validateur || "",
      observation:
        presence.observation || "",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingPresence(null);
    setForm(initialForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.id_enseignant) {
      setError(
        "Sélectionnez un enseignant."
      );
      return;
    }

    if (!form.id_annee) {
      setError(
        "Sélectionnez une année scolaire."
      );
      return;
    }

    if (!form.date_presence) {
      setError(
        "La date est obligatoire."
      );
      return;
    }

    if (!form.statut) {
      setError(
        "Sélectionnez un statut."
      );
      return;
    }

    if (
      form.heure_arrivee &&
      form.heure_depart &&
      form.heure_depart <=
        form.heure_arrivee
    ) {
      setError(
        "L'heure de départ doit être supérieure à l'heure d'arrivée."
      );
      return;
    }

    const payload = {
      id_enseignant:
        Number(form.id_enseignant),
      id_annee:
        Number(form.id_annee),
      date_presence:
        form.date_presence,
      heure_arrivee:
        form.heure_arrivee || null,
      heure_depart:
        form.heure_depart || null,
      statut:
        form.statut,
      motif:
        form.motif.trim() || null,
      justification:
        form.justification.trim() ||
        null,
      justificatif:
        form.justificatif.trim() ||
        null,
      validee:
        Boolean(form.validee),
      id_validateur:
        form.id_validateur
          ? Number(form.id_validateur)
          : null,
      observation:
        form.observation.trim() ||
        null,
    };

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingPresence) {
        await updatePresenceEnseignant(
          editingPresence.id_presence,
          {
            heure_arrivee:
              payload.heure_arrivee,
            heure_depart:
              payload.heure_depart,
            statut:
              payload.statut,
            motif:
              payload.motif,
            justification:
              payload.justification,
            justificatif:
              payload.justificatif,
            validee:
              payload.validee,
            id_validateur:
              payload.id_validateur,
            observation:
              payload.observation,
          }
        );
      } else {
        await createPresenceEnseignant(
          payload
        );
      }

      await loadPresences();

      setSuccess(
        editingPresence
          ? "Présence modifiée avec succès."
          : "Présence enregistrée avec succès."
      );

      closeModal();
    } catch (err) {
      setError(
        err.message ||
          "Impossible d'enregistrer la présence."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="cahier-maitre-page">
      <div className="cahier-maitre-header">
        <div>
          <h1>Cahier des maîtres</h1>

          <p>
            Suivi des présences et de la
            situation des enseignants
          </p>
        </div>

        <button
          type="button"
          className="cahier-maitre-primary"
          onClick={openCreateModal}
        >
          ＋ Nouvelle présence
        </button>
      </div>

      {error && (
        <div className="cahier-maitre-alert error">
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
        <div className="cahier-maitre-alert success">
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

      <div className="cahier-maitre-stats">
        <div>
          <span>👨‍🏫</span>
          <div>
            <small>Total présences</small>
            <strong>{total}</strong>
          </div>
        </div>

        <div>
          <span>✅</span>
          <div>
            <small>Présents</small>
            <strong>
              {presents}
            </strong>
          </div>
        </div>

        <div>
          <span>❌</span>
          <div>
            <small>Absences</small>
            <strong>
              {absents}
            </strong>
          </div>
        </div>

        <div>
          <span>⏰</span>
          <div>
            <small>Retards</small>
            <strong>
              {retards}
            </strong>
          </div>
        </div>
      </div>

      <div className="cahier-maitre-filters">
        <div>
          <label>Enseignant</label>

          <select
            value={selectedEnseignant}
            onChange={(event) =>
              setSelectedEnseignant(
                event.target.value
              )
            }
          >
            <option value="">
              Tous les enseignants
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
                  {enseignant.nom}
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <label>Année scolaire</label>

          <select
            value={selectedAnnee}
            onChange={(event) =>
              setSelectedAnnee(
                event.target.value
              )
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
          <label>Date</label>

          <input
            type="date"
            value={selectedDate}
            onChange={(event) =>
              setSelectedDate(
                event.target.value
              )
            }
          />
        </div>
      </div>

      <div className="cahier-maitre-toolbar">
        <div className="cahier-maitre-search">
          🔍

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Rechercher un enseignant, un statut..."
          />
        </div>

        <button
          type="button"
          className="cahier-maitre-refresh"
          onClick={loadPresences}
        >
          ↻ Actualiser
        </button>
      </div>

      <div className="cahier-maitre-table-card">
        {loading ? (
          <div className="cahier-maitre-state">
            <div className="cahier-maitre-spinner"></div>
            <p>
              Chargement du cahier des maîtres...
            </p>
          </div>
        ) : filteredPresences.length ===
          0 ? (
          <div className="cahier-maitre-state">
            <div>📘</div>

            <h3>
              Aucune présence trouvée
            </h3>

            <p>
              Modifiez vos filtres ou
              enregistrez une nouvelle présence.
            </p>
          </div>
        ) : (
          <div className="cahier-maitre-table-wrapper">
            <table className="cahier-maitre-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Enseignant</th>
                  <th>Année</th>
                  <th>Arrivée</th>
                  <th>Départ</th>
                  <th>Statut</th>
                  <th>Validée</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredPresences.map(
                  (presence) => (
                    <tr
                      key={
                        presence.id_presence
                      }
                    >
                      <td>
                        {
                          presence.date_presence
                        }
                      </td>

                      <td>
                        <strong>
                          {getTeacherName(
                            presence.id_enseignant
                          )}
                        </strong>
                      </td>

                      <td>
                        {findAnnee(
                          presence.id_annee
                        )?.libelle ||
                          `#${presence.id_annee}`}
                      </td>

                      <td>
                        {
                          presence.heure_arrivee ||
                          "—"
                        }
                      </td>

                      <td>
                        {
                          presence.heure_depart ||
                          "—"
                        }
                      </td>

                      <td>
                        <span
                          className={`cahier-status ${String(
                            presence.statut ||
                              ""
                          ).toLowerCase()}`}
                        >
                          {getStatusLabel(
                            presence.statut
                          )}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`cahier-validation ${
                            presence.validee
                              ? "yes"
                              : "no"
                          }`}
                        >
                          {presence.validee
                            ? "Oui"
                            : "Non"}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="cahier-edit-btn"
                          onClick={() =>
                            openEditModal(
                              presence
                            )
                          }
                        >
                          ✏️ Modifier
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="cahier-maitre-modal-overlay">
          <div className="cahier-maitre-modal">
            <div className="cahier-maitre-modal-header">
              <div>
                <h2>
                  {editingPresence
                    ? "Modifier la présence"
                    : "Nouvelle présence"}
                </h2>

                <p>
                  Enregistrez la situation de
                  l'enseignant.
                </p>
              </div>

              <button
                type="button"
                className="cahier-maitre-close"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form
              className="cahier-maitre-form"
              onSubmit={handleSubmit}
            >
              <div className="cahier-maitre-grid">
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
                    disabled={
                      Boolean(
                        editingPresence
                      )
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
                          {
                            enseignant.nom
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label>
                    Année scolaire *
                  </label>

                  <select
                    name="id_annee"
                    value={form.id_annee}
                    onChange={
                      handleChange
                    }
                    disabled={
                      Boolean(
                        editingPresence
                      )
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
                    Date *
                  </label>

                  <input
                    type="date"
                    name="date_presence"
                    value={
                      form.date_presence
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      Boolean(
                        editingPresence
                      )
                    }
                  />
                </div>

                <div>
                  <label>
                    Statut *
                  </label>

                  <select
                    name="statut"
                    value={form.statut}
                    onChange={
                      handleChange
                    }
                  >
                    {statuts.map(
                      (item) => (
                        <option
                          key={
                            item.value
                          }
                          value={
                            item.value
                          }
                        >
                          {item.label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label>
                    Heure d'arrivée
                  </label>

                  <input
                    type="time"
                    name="heure_arrivee"
                    value={
                      form.heure_arrivee
                    }
                    onChange={
                      handleChange
                    }
                  />
                </div>

                <div>
                  <label>
                    Heure de départ
                  </label>

                  <input
                    type="time"
                    name="heure_depart"
                    value={
                      form.heure_depart
                    }
                    onChange={
                      handleChange
                    }
                  />
                </div>

                <div>
                  <label>
                    Motif
                  </label>

                  <input
                    type="text"
                    name="motif"
                    value={form.motif}
                    onChange={
                      handleChange
                    }
                    placeholder="Motif éventuel"
                  />
                </div>

                <div>
                  <label>
                    Justification
                  </label>

                  <input
                    type="text"
                    name="justification"
                    value={
                      form.justification
                    }
                    onChange={
                      handleChange
                    }
                  />
                </div>

                <div>
                  <label>
                    Justificatif
                  </label>

                  <input
                    type="text"
                    name="justificatif"
                    value={
                      form.justificatif
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Nom ou chemin du justificatif"
                  />
                </div>

                <div>
                  <label>
                    Identifiant validateur
                  </label>

                  <input
                    type="number"
                    min="1"
                    name="id_validateur"
                    value={
                      form.id_validateur
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Facultatif"
                  />
                </div>

                <div className="cahier-maitre-full">
                  <label className="cahier-checkbox">
                    <input
                      type="checkbox"
                      name="validee"
                      checked={
                        form.validee
                      }
                      onChange={
                        handleChange
                      }
                    />
                    Présence validée
                  </label>
                </div>

                <div className="cahier-maitre-full">
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
                    placeholder="Observation éventuelle..."
                  />
                </div>
              </div>

              <div className="cahier-maitre-footer">
                <button
                  type="button"
                  className="cahier-maitre-cancel"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="cahier-maitre-save"
                  disabled={saving}
                >
                  {saving
                    ? "Enregistrement..."
                    : editingPresence
                    ? "Enregistrer"
                    : "Enregistrer la présence"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}