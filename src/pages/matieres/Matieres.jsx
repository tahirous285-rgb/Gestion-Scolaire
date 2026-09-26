import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getMatieres,
  createMatiere,
  updateMatiere,
  deleteMatiere,
} from "../../services/matieresApi";

import "./Matieres.css";

function getEtablissementId() {
  const savedId =
    localStorage.getItem("id_etablissement");

  if (
    savedId &&
    !Number.isNaN(Number(savedId))
  ) {
    return Number(savedId);
  }

  return 1;
}

const initialForm = {
  code: "",
  nom: "",
  description: "",
  actif: true,
};

export default function Matieres() {
  const [matieres, setMatieres] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] =
    useState(false);

  const [editingMatiere, setEditingMatiere] =
    useState(null);

  const [selectedMatiere, setSelectedMatiere] =
    useState(null);

  const [openMenuId, setOpenMenuId] =
    useState(null);

  const [form, setForm] =
    useState(initialForm);

  // --------------------------------------------------
  // CHARGEMENT
  // --------------------------------------------------

  async function loadMatieres() {
    try {
      setLoading(true);
      setError("");

      const data = await getMatieres();

      setMatieres(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      setError(
        err.message ||
          "Impossible de charger les matières."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMatieres();
  }, []);

  // --------------------------------------------------
  // RECHERCHE
  // --------------------------------------------------

  const filteredMatieres = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    if (!keyword) {
      return matieres;
    }

    return matieres.filter((matiere) => {
      return (
        String(matiere.code || "")
          .toLowerCase()
          .includes(keyword) ||
        String(matiere.nom || "")
          .toLowerCase()
          .includes(keyword) ||
        String(matiere.description || "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [matieres, search]);

  // --------------------------------------------------
  // STATISTIQUES
  // --------------------------------------------------

  const totalMatieres = matieres.length;

  const matieresActives =
    matieres.filter(
      (matiere) => matiere.actif !== false
    ).length;

  const matieresInactives =
    matieres.filter(
      (matiere) => matiere.actif === false
    ).length;

  // --------------------------------------------------
  // FORMULAIRE
  // --------------------------------------------------

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
    setEditingMatiere(null);

    setForm({
      ...initialForm,
      actif: true,
    });

    setError("");
    setShowModal(true);
    setOpenMenuId(null);
  }

  function openEditModal(matiere) {
    setEditingMatiere(matiere);

    setForm({
      code: matiere.code || "",
      nom: matiere.nom || "",
      description:
        matiere.description || "",
      actif: matiere.actif !== false,
    });

    setError("");
    setShowModal(true);
    setOpenMenuId(null);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingMatiere(null);

    setForm({
      ...initialForm,
      actif: true,
    });
  }

  // --------------------------------------------------
  // ENREGISTREMENT
  // --------------------------------------------------

  async function handleSubmit(event) {
    event.preventDefault();

    const code = form.code.trim();
    const nom = form.nom.trim();

    if (!code) {
      setError(
        "Le code de la matière est obligatoire."
      );
      return;
    }

    if (!nom) {
      setError(
        "Le nom de la matière est obligatoire."
      );
      return;
    }

    const payload = {
      code,
      nom,
      description:
        form.description.trim() || null,
      actif: Boolean(form.actif),
    };

    try {
      setSaving(true);
      setError("");

      if (editingMatiere) {
        await updateMatiere(
          editingMatiere.id_matiere,
          payload
        );
      } else {
        await createMatiere({
          id_etablissement:
            getEtablissementId(),
          ...payload,
        });
      }

      await loadMatieres();

      closeModal();
    } catch (err) {
      setError(
        err.message ||
          "Une erreur est survenue lors de l'enregistrement."
      );
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // CONSULTATION
  // --------------------------------------------------

  function handleView(matiere) {
    setSelectedMatiere(matiere);
    setShowViewModal(true);
    setOpenMenuId(null);
  }

  // --------------------------------------------------
  // SUPPRESSION
  // --------------------------------------------------

  async function handleDelete(matiere) {
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer la matière "${matiere.nom}" ?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteMatiere(
        matiere.id_matiere
      );

      await loadMatieres();

      setOpenMenuId(null);
    } catch (err) {
      setError(
        err.message ||
          "Impossible de supprimer cette matière."
      );
    }
  }

  // --------------------------------------------------
  // STATUT
  // --------------------------------------------------

  async function toggleStatus(matiere) {
    try {
      setError("");

      await updateMatiere(
        matiere.id_matiere,
        {
          actif: !matiere.actif,
        }
      );

      await loadMatieres();

      setOpenMenuId(null);
    } catch (err) {
      setError(
        err.message ||
          "Impossible de modifier le statut."
      );
    }
  }

  // --------------------------------------------------
  // MENU
  // --------------------------------------------------

  function handleMenuToggle(id) {
    setOpenMenuId(
      openMenuId === id ? null : id
    );
  }

  return (
    <div className="matieres-page">
      {/* EN-TÊTE */}
      <div className="matieres-header">
        <div>
          <h1>Matières</h1>
          <p>
            Gestion des matières enseignées
          </p>
        </div>

        <button
          type="button"
          className="matieres-primary-btn"
          onClick={openCreateModal}
        >
          <span>＋</span>
          Nouvelle matière
        </button>
      </div>

      {/* ERREUR */}
      {error && (
        <div className="matieres-alert">
          <span>⚠️</span>
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      {/* STATISTIQUES */}
      <div className="matieres-stats">
        <div className="matieres-stat-card">
          <div className="matieres-stat-icon">
            📚
          </div>

          <div>
            <span>Total matières</span>
            <strong>{totalMatieres}</strong>
          </div>
        </div>

        <div className="matieres-stat-card">
          <div className="matieres-stat-icon">
            ✅
          </div>

          <div>
            <span>Matières actives</span>
            <strong>
              {matieresActives}
            </strong>
          </div>
        </div>

        <div className="matieres-stat-card">
          <div className="matieres-stat-icon">
            ⛔
          </div>

          <div>
            <span>Matières inactives</span>
            <strong>
              {matieresInactives}
            </strong>
          </div>
        </div>
      </div>

      {/* OUTILS */}
      <div className="matieres-toolbar">
        <div className="matieres-search">
          <span>🔍</span>

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Rechercher une matière..."
          />
        </div>

        <button
          type="button"
          className="matieres-refresh-btn"
          onClick={loadMatieres}
          disabled={loading}
        >
          ↻ Actualiser
        </button>
      </div>

      {/* TABLE */}
      <div className="matieres-table-card">
        {loading ? (
          <div className="matieres-state">
            <div className="matieres-spinner"></div>

            <p>
              Chargement des matières...
            </p>
          </div>
        ) : filteredMatieres.length ===
          0 ? (
          <div className="matieres-state">
            <div className="matieres-empty-icon">
              📚
            </div>

            <h3>
              {search
                ? "Aucune matière trouvée"
                : "Aucune matière enregistrée"}
            </h3>

            <p>
              {search
                ? "Essayez avec un autre terme de recherche."
                : "Commencez par créer votre première matière."}
            </p>
          </div>
        ) : (
          <div className="matieres-table-wrapper">
            <table className="matieres-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Code</th>
                  <th>Matière</th>
                  <th>Description</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredMatieres.map(
                  (matiere) => (
                    <tr
                      key={
                        matiere.id_matiere
                      }
                    >
                      <td>
                        <span className="matieres-id">
                          #
                          {
                            matiere.id_matiere
                          }
                        </span>
                      </td>

                      <td>
                        <span className="matieres-code">
                          {matiere.code}
                        </span>
                      </td>

                      <td>
                        <div className="matieres-name-cell">
                          <div className="matieres-avatar">
                            {String(
                              matiere.nom ||
                                "M"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {matiere.nom}
                            </strong>

                            <small>
                              Matière scolaire
                            </small>
                          </div>
                        </div>
                      </td>

                      <td className="matieres-description">
                        {matiere.description ||
                          "—"}
                      </td>

                      <td>
                        <span
                          className={`matieres-status ${
                            matiere.actif !==
                            false
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          {matiere.actif !==
                          false
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td className="matieres-actions-cell">
                        <button
                          type="button"
                          className="matieres-menu-btn"
                          onClick={() =>
                            handleMenuToggle(
                              matiere.id_matiere
                            )
                          }
                          aria-label="Actions"
                        >
                          ⋮
                        </button>

                        {openMenuId ===
                          matiere.id_matiere && (
                          <div className="matieres-action-menu">
                            <button
                              type="button"
                              onClick={() =>
                                handleView(
                                  matiere
                                )
                              }
                            >
                              👁️ Consulter
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  matiere
                                )
                              }
                            >
                              ✏️ Modifier
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                toggleStatus(
                                  matiere
                                )
                              }
                            >
                              {matiere.actif !==
                              false
                                ? "⛔ Désactiver"
                                : "✅ Activer"}
                            </button>

                            <button
                              type="button"
                              className="danger"
                              onClick={() =>
                                handleDelete(
                                  matiere
                                )
                              }
                            >
                              🗑️ Supprimer
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL AJOUT / MODIFICATION */}
      {showModal && (
        <div
          className="matieres-modal-overlay"
          onMouseDown={closeModal}
        >
          <div
            className="matieres-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="matieres-modal-header">
              <div>
                <h2>
                  {editingMatiere
                    ? "Modifier la matière"
                    : "Nouvelle matière"}
                </h2>

                <p>
                  {editingMatiere
                    ? "Modifiez les informations de la matière."
                    : "Ajoutez une nouvelle matière."}
                </p>
              </div>

              <button
                type="button"
                className="matieres-close-btn"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form
              className="matieres-form"
              onSubmit={handleSubmit}
            >
              <div className="matieres-form-grid">
                <div className="matieres-form-group">
                  <label>
                    Code *
                  </label>

                  <input
                    type="text"
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    placeholder="Ex. MATH"
                    required
                  />
                </div>

                <div className="matieres-form-group">
                  <label>
                    Nom *
                  </label>

                  <input
                    type="text"
                    name="nom"
                    value={form.nom}
                    onChange={handleChange}
                    placeholder="Ex. Mathématiques"
                    required
                  />
                </div>

                <div className="matieres-form-group matieres-full">
                  <label>
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={
                      form.description
                    }
                    onChange={handleChange}
                    placeholder="Description de la matière..."
                    rows="4"
                  />
                </div>
              </div>

              <label className="matieres-checkbox">
                <input
                  type="checkbox"
                  name="actif"
                  checked={form.actif}
                  onChange={handleChange}
                />

                <span>
                  Matière active
                </span>
              </label>

              <div className="matieres-form-footer">
                <button
                  type="button"
                  className="matieres-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="matieres-save-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Enregistrement..."
                    : editingMatiere
                    ? "Enregistrer les modifications"
                    : "Créer la matière"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONSULTATION */}
      {showViewModal &&
        selectedMatiere && (
          <div
            className="matieres-modal-overlay"
            onMouseDown={() =>
              setShowViewModal(false)
            }
          >
            <div
              className="matieres-modal matieres-view-modal"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              <div className="matieres-modal-header">
                <div>
                  <h2>
                    Détails de la matière
                  </h2>

                  <p>
                    Informations enregistrées
                    dans le système.
                  </p>
                </div>

                <button
                  type="button"
                  className="matieres-close-btn"
                  onClick={() =>
                    setShowViewModal(false)
                  }
                >
                  ×
                </button>
              </div>

              <div className="matieres-details">
                <div className="matieres-detail-card">
                  <span>
                    Identifiant
                  </span>

                  <strong>
                    #
                    {
                      selectedMatiere.id_matiere
                    }
                  </strong>
                </div>

                <div className="matieres-detail-card">
                  <span>
                    Code
                  </span>

                  <strong>
                    {selectedMatiere.code ||
                      "—"}
                  </strong>
                </div>

                <div className="matieres-detail-card">
                  <span>
                    Nom
                  </span>

                  <strong>
                    {selectedMatiere.nom ||
                      "—"}
                  </strong>
                </div>

                <div className="matieres-detail-card">
                  <span>
                    Statut
                  </span>

                  <strong>
                    {selectedMatiere.actif !==
                    false
                      ? "Active"
                      : "Inactive"}
                  </strong>
                </div>

                <div className="matieres-detail-card matieres-detail-full">
                  <span>
                    Description
                  </span>

                  <strong>
                    {selectedMatiere.description ||
                      "Aucune description"}
                  </strong>
                </div>
              </div>

              <div className="matieres-form-footer">
                <button
                  type="button"
                  className="matieres-cancel-btn"
                  onClick={() =>
                    setShowViewModal(false)
                  }
                >
                  Fermer
                </button>

                <button
                  type="button"
                  className="matieres-save-btn"
                  onClick={() => {
                    setShowViewModal(false);
                    openEditModal(
                      selectedMatiere
                    );
                  }}
                >
                  ✏️ Modifier
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}