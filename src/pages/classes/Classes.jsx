import React, { useEffect, useMemo, useState } from "react";
import {
  getClasses,
  createClasse,
  updateClasse,
  deleteClasse,
} from "../../services/classesApi";

import "./Classes.css";

function getEtablissementId() {
  const savedId = localStorage.getItem("id_etablissement");

  if (savedId && !Number.isNaN(Number(savedId))) {
    return Number(savedId);
  }

  return 1;
}

const initialForm = {
  nom: "",
  niveau: "",
  capacite: "",
  salle: "",
  actif: true,
};

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [editingClasse, setEditingClasse] = useState(null);
  const [selectedClasse, setSelectedClasse] = useState(null);

  const [openMenuId, setOpenMenuId] = useState(null);

  const [form, setForm] = useState(initialForm);

  // --------------------------------------------------
  // CHARGEMENT
  // --------------------------------------------------

  async function loadClasses() {
    try {
      setLoading(true);
      setError("");

      const data = await getClasses();

      setClasses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.message ||
          "Impossible de charger les classes."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClasses();
  }, []);

  // --------------------------------------------------
  // RECHERCHE
  // --------------------------------------------------

  const filteredClasses = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return classes;
    }

    return classes.filter((classe) => {
      return (
        String(classe.nom || "")
          .toLowerCase()
          .includes(keyword) ||
        String(classe.niveau || "")
          .toLowerCase()
          .includes(keyword) ||
        String(classe.salle || "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [classes, search]);

  // --------------------------------------------------
  // STATISTIQUES
  // --------------------------------------------------

  const totalClasses = classes.length;

  const classesActives = classes.filter(
    (classe) => classe.actif !== false
  ).length;

  const classesInactives = classes.filter(
    (classe) => classe.actif === false
  ).length;

  const capaciteTotale = classes.reduce(
    (total, classe) =>
      total + Number(classe.capacite || 0),
    0
  );

  // --------------------------------------------------
  // FORMULAIRE
  // --------------------------------------------------

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function openCreateModal() {
    setEditingClasse(null);

    setForm({
      ...initialForm,
      actif: true,
    });

    setError("");
    setShowModal(true);
    setOpenMenuId(null);
  }

  function openEditModal(classe) {
    setEditingClasse(classe);

    setForm({
      nom: classe.nom || "",
      niveau: classe.niveau || "",
      capacite:
        classe.capacite !== null &&
        classe.capacite !== undefined
          ? String(classe.capacite)
          : "",
      salle: classe.salle || "",
      actif:
        classe.actif !== false,
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
    setEditingClasse(null);

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

    const nom = form.nom.trim();

    if (!nom) {
      setError("Le nom de la classe est obligatoire.");
      return;
    }

    let capacite = null;

    if (form.capacite !== "") {
      capacite = Number(form.capacite);

      if (
        Number.isNaN(capacite) ||
        capacite < 0
      ) {
        setError(
          "La capacité doit être un nombre positif ou nul."
        );
        return;
      }
    }

    const payload = {
      nom,
      niveau: form.niveau.trim() || null,
      capacite,
      salle: form.salle.trim() || null,
      actif: Boolean(form.actif),
    };

    try {
      setSaving(true);
      setError("");

      if (editingClasse) {
        await updateClasse(
          editingClasse.id_classe,
          payload
        );
      } else {
        await createClasse({
          id_etablissement: getEtablissementId(),
          ...payload,
        });
      }

      await loadClasses();

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

  function handleView(classe) {
    setSelectedClasse(classe);
    setShowViewModal(true);
    setOpenMenuId(null);
  }

  // --------------------------------------------------
  // SUPPRESSION
  // --------------------------------------------------

  async function handleDelete(classe) {
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer la classe "${classe.nom}" ?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteClasse(classe.id_classe);

      await loadClasses();

      setOpenMenuId(null);
    } catch (err) {
      setError(
        err.message ||
          "Impossible de supprimer cette classe."
      );
    }
  }

  // --------------------------------------------------
  // ACTIVATION / DESACTIVATION
  // --------------------------------------------------

  async function toggleStatus(classe) {
    try {
      setError("");

      await updateClasse(
        classe.id_classe,
        {
          actif: !classe.actif,
        }
      );

      await loadClasses();

      setOpenMenuId(null);
    } catch (err) {
      setError(
        err.message ||
          "Impossible de modifier le statut."
      );
    }
  }

  // --------------------------------------------------
  // FERMETURE MENU
  // --------------------------------------------------

  function handleMenuToggle(id) {
    setOpenMenuId(
      openMenuId === id ? null : id
    );
  }

  return (
    <div className="classes-page">
      {/* EN-TÊTE */}
      <div className="classes-header">
        <div>
          <h1>Classes</h1>
          <p>
            Gestion des classes de l'établissement
          </p>
        </div>

        <button
          type="button"
          className="classes-primary-btn"
          onClick={openCreateModal}
        >
          <span>＋</span>
          Nouvelle classe
        </button>
      </div>

      {/* ERREUR */}
      {error && (
        <div className="classes-alert">
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
      <div className="classes-stats">
        <div className="classes-stat-card">
          <div className="classes-stat-icon">
            🏫
          </div>

          <div>
            <span>Total classes</span>
            <strong>{totalClasses}</strong>
          </div>
        </div>

        <div className="classes-stat-card">
          <div className="classes-stat-icon">
            ✅
          </div>

          <div>
            <span>Classes actives</span>
            <strong>{classesActives}</strong>
          </div>
        </div>

        <div className="classes-stat-card">
          <div className="classes-stat-icon">
            ⛔
          </div>

          <div>
            <span>Classes inactives</span>
            <strong>{classesInactives}</strong>
          </div>
        </div>

        <div className="classes-stat-card">
          <div className="classes-stat-icon">
            👥
          </div>

          <div>
            <span>Capacité totale</span>
            <strong>{capaciteTotale}</strong>
          </div>
        </div>
      </div>

      {/* OUTILS */}
      <div className="classes-toolbar">
        <div className="classes-search">
          <span>🔍</span>

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Rechercher une classe..."
          />
        </div>

        <button
          type="button"
          className="classes-refresh-btn"
          onClick={loadClasses}
          disabled={loading}
        >
          ↻ Actualiser
        </button>
      </div>

      {/* TABLEAU */}
      <div className="classes-table-card">
        {loading ? (
          <div className="classes-state">
            <div className="classes-spinner"></div>
            <p>Chargement des classes...</p>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="classes-state">
            <div className="classes-empty-icon">
              🏫
            </div>

            <h3>
              {search
                ? "Aucune classe trouvée"
                : "Aucune classe enregistrée"}
            </h3>

            <p>
              {search
                ? "Essayez avec un autre terme de recherche."
                : "Commencez par créer votre première classe."}
            </p>
          </div>
        ) : (
          <div className="classes-table-wrapper">
            <table className="classes-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Classe</th>
                  <th>Niveau</th>
                  <th>Capacité</th>
                  <th>Salle</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredClasses.map((classe) => (
                  <tr key={classe.id_classe}>
                    <td>
                      <span className="classes-id">
                        #{classe.id_classe}
                      </span>
                    </td>

                    <td>
                      <div className="classes-name-cell">
                        <div className="classes-avatar">
                          {String(
                            classe.nom || "C"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {classe.nom}
                          </strong>

                          <small>
                            Classe scolaire
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      {classe.niveau || "—"}
                    </td>

                    <td>
                      <span className="classes-capacity">
                        👥{" "}
                        {classe.capacite ??
                          "—"}
                      </span>
                    </td>

                    <td>
                      {classe.salle || "—"}
                    </td>

                    <td>
                      <span
                        className={`classes-status ${
                          classe.actif !== false
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {classe.actif !== false
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td className="classes-actions-cell">
                      <button
                        type="button"
                        className="classes-menu-btn"
                        onClick={() =>
                          handleMenuToggle(
                            classe.id_classe
                          )
                        }
                        aria-label="Actions"
                      >
                        ⋮
                      </button>

                      {openMenuId ===
                        classe.id_classe && (
                        <div className="classes-action-menu">
                          <button
                            type="button"
                            onClick={() =>
                              handleView(classe)
                            }
                          >
                            👁️ Consulter
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                classe
                              )
                            }
                          >
                            ✏️ Modifier
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleStatus(
                                classe
                              )
                            }
                          >
                            {classe.actif !==
                            false
                              ? "⛔ Désactiver"
                              : "✅ Activer"}
                          </button>

                          <button
                            type="button"
                            className="danger"
                            onClick={() =>
                              handleDelete(
                                classe
                              )
                            }
                          >
                            🗑️ Supprimer
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL AJOUT / MODIFICATION */}
      {showModal && (
        <div
          className="classes-modal-overlay"
          onMouseDown={closeModal}
        >
          <div
            className="classes-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="classes-modal-header">
              <div>
                <h2>
                  {editingClasse
                    ? "Modifier la classe"
                    : "Nouvelle classe"}
                </h2>

                <p>
                  {editingClasse
                    ? "Modifiez les informations de la classe."
                    : "Ajoutez une nouvelle classe à l'établissement."}
                </p>
              </div>

              <button
                type="button"
                className="classes-close-btn"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form
              className="classes-form"
              onSubmit={handleSubmit}
            >
              <div className="classes-form-grid">
                <div className="classes-form-group classes-full">
                  <label>
                    Nom de la classe *
                  </label>

                  <input
                    type="text"
                    name="nom"
                    value={form.nom}
                    onChange={handleChange}
                    placeholder="Ex. 6ème A"
                    required
                  />
                </div>

                <div className="classes-form-group">
                  <label>Niveau</label>

                  <input
                    type="text"
                    name="niveau"
                    value={form.niveau}
                    onChange={handleChange}
                    placeholder="Ex. 6ème"
                  />
                </div>

                <div className="classes-form-group">
                  <label>Capacité</label>

                  <input
                    type="number"
                    name="capacite"
                    min="0"
                    value={form.capacite}
                    onChange={handleChange}
                    placeholder="Ex. 40"
                  />
                </div>

                <div className="classes-form-group classes-full">
                  <label>Salle</label>

                  <input
                    type="text"
                    name="salle"
                    value={form.salle}
                    onChange={handleChange}
                    placeholder="Ex. Salle 3"
                  />
                </div>
              </div>

              <label className="classes-checkbox">
                <input
                  type="checkbox"
                  name="actif"
                  checked={form.actif}
                  onChange={handleChange}
                />

                <span>
                  Classe active
                </span>
              </label>

              <div className="classes-form-footer">
                <button
                  type="button"
                  className="classes-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="classes-save-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Enregistrement..."
                    : editingClasse
                    ? "Enregistrer les modifications"
                    : "Créer la classe"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONSULTATION */}
      {showViewModal &&
        selectedClasse && (
          <div
            className="classes-modal-overlay"
            onMouseDown={() =>
              setShowViewModal(false)
            }
          >
            <div
              className="classes-modal classes-view-modal"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              <div className="classes-modal-header">
                <div>
                  <h2>
                    Détails de la classe
                  </h2>

                  <p>
                    Informations enregistrées dans
                    le système.
                  </p>
                </div>

                <button
                  type="button"
                  className="classes-close-btn"
                  onClick={() =>
                    setShowViewModal(false)
                  }
                >
                  ×
                </button>
              </div>

              <div className="classes-details">
                <div className="classes-detail-card">
                  <span>Identifiant</span>
                  <strong>
                    #{selectedClasse.id_classe}
                  </strong>
                </div>

                <div className="classes-detail-card">
                  <span>Nom</span>
                  <strong>
                    {selectedClasse.nom ||
                      "—"}
                  </strong>
                </div>

                <div className="classes-detail-card">
                  <span>Niveau</span>
                  <strong>
                    {selectedClasse.niveau ||
                      "—"}
                  </strong>
                </div>

                <div className="classes-detail-card">
                  <span>Capacité</span>
                  <strong>
                    {selectedClasse.capacite ??
                      "—"}
                  </strong>
                </div>

                <div className="classes-detail-card">
                  <span>Salle</span>
                  <strong>
                    {selectedClasse.salle ||
                      "—"}
                  </strong>
                </div>

                <div className="classes-detail-card">
                  <span>Statut</span>
                  <strong>
                    {selectedClasse.actif !==
                    false
                      ? "Active"
                      : "Inactive"}
                  </strong>
                </div>
              </div>

              <div className="classes-form-footer">
                <button
                  type="button"
                  className="classes-cancel-btn"
                  onClick={() =>
                    setShowViewModal(false)
                  }
                >
                  Fermer
                </button>

                <button
                  type="button"
                  className="classes-save-btn"
                  onClick={() => {
                    setShowViewModal(false);
                    openEditModal(
                      selectedClasse
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