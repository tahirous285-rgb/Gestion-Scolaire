import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getEnseignants,
  createEnseignant,
  updateEnseignant,
  deleteEnseignant,
} from "../../services/enseignantsApi";

import "./Enseignants.css";

function getEtablissementId() {
  const id = localStorage.getItem(
    "id_etablissement"
  );

  if (id && !Number.isNaN(Number(id))) {
    return Number(id);
  }

  return 1;
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

const initialForm = {
  matricule: "",
  nom: "",
  prenom: "",
  sexe: "",
  date_naissance: "",
  telephone: "",
  email: "",
  adresse: "",
  date_embauche: getToday(),
  statut: "actif",
  taux_horaire: "",
  actif: true,
};

export default function Enseignants() {
  const [enseignants, setEnseignants] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] =
    useState(false);

  const [editingEnseignant, setEditingEnseignant] =
    useState(null);

  const [selectedEnseignant, setSelectedEnseignant] =
    useState(null);

  const [openMenuId, setOpenMenuId] =
    useState(null);

  const [form, setForm] = useState(initialForm);

  async function loadEnseignants() {
    try {
      setLoading(true);
      setError("");

      const data = await getEnseignants();

      setEnseignants(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      setError(
        err.message ||
          "Impossible de charger les enseignants."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEnseignants();
  }, []);

  const filteredEnseignants = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    if (!keyword) {
      return enseignants;
    }

    return enseignants.filter((enseignant) => {
      const fullName =
        `${enseignant.prenom || ""} ${
          enseignant.nom || ""
        }`.toLowerCase();

      return (
        fullName.includes(keyword) ||
        String(enseignant.matricule || "")
          .toLowerCase()
          .includes(keyword) ||
        String(enseignant.telephone || "")
          .toLowerCase()
          .includes(keyword) ||
        String(enseignant.email || "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [enseignants, search]);

  const total = enseignants.length;

  const actifs = enseignants.filter(
    (item) => item.actif !== false
  ).length;

  const inactifs = enseignants.filter(
    (item) => item.actif === false
  ).length;

  const tauxMoyen =
    enseignants.length > 0
      ? enseignants.reduce(
          (totalValue, item) =>
            totalValue +
            Number(item.taux_horaire || 0),
          0
        ) / enseignants.length
      : 0;

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
    setEditingEnseignant(null);
    setForm({
      ...initialForm,
      date_embauche: getToday(),
      actif: true,
      statut: "actif",
    });
    setError("");
    setShowModal(true);
    setOpenMenuId(null);
  }

  function openEditModal(enseignant) {
    setEditingEnseignant(enseignant);

    setForm({
      matricule: enseignant.matricule || "",
      nom: enseignant.nom || "",
      prenom: enseignant.prenom || "",
      sexe: enseignant.sexe || "",
      date_naissance:
        enseignant.date_naissance || "",
      telephone: enseignant.telephone || "",
      email: enseignant.email || "",
      adresse: enseignant.adresse || "",
      date_embauche:
        enseignant.date_embauche || "",
      statut: enseignant.statut || "actif",
      taux_horaire:
        enseignant.taux_horaire ??
        "",
      actif: enseignant.actif !== false,
    });

    setError("");
    setShowModal(true);
    setOpenMenuId(null);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingEnseignant(null);
    setForm({
      ...initialForm,
      date_embauche: getToday(),
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.matricule.trim()) {
      setError(
        "Le matricule est obligatoire."
      );
      return;
    }

    if (!form.nom.trim()) {
      setError("Le nom est obligatoire.");
      return;
    }

    if (!form.prenom.trim()) {
      setError(
        "Le prénom est obligatoire."
      );
      return;
    }

    let tauxHoraire = null;

    if (form.taux_horaire !== "") {
      tauxHoraire = Number(
        form.taux_horaire
      );

      if (
        Number.isNaN(tauxHoraire) ||
        tauxHoraire < 0
      ) {
        setError(
          "Le taux horaire doit être un nombre positif ou nul."
        );
        return;
      }
    }

    const payload = {
      matricule: form.matricule.trim(),
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
      sexe: form.sexe || null,
      date_naissance:
        form.date_naissance || null,
      telephone:
        form.telephone.trim() || null,
      email: form.email.trim() || null,
      adresse:
        form.adresse.trim() || null,
      date_embauche:
        form.date_embauche || null,
      statut:
        form.statut.trim() || "actif",
      taux_horaire: tauxHoraire,
      actif: Boolean(form.actif),
    };

    try {
      setSaving(true);
      setError("");

      if (editingEnseignant) {
        await updateEnseignant(
          editingEnseignant.id_enseignant,
          payload
        );
      } else {
        await createEnseignant({
          id_etablissement:
            getEtablissementId(),
          ...payload,
        });
      }

      await loadEnseignants();
      closeModal();
    } catch (err) {
      setError(
        err.message ||
          "Impossible d'enregistrer l'enseignant."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleView(enseignant) {
    setSelectedEnseignant(enseignant);
    setShowViewModal(true);
    setOpenMenuId(null);
  }

  async function handleDelete(enseignant) {
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer ${enseignant.prenom} ${enseignant.nom} ?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await deleteEnseignant(
        enseignant.id_enseignant
      );

      await loadEnseignants();
      setOpenMenuId(null);
    } catch (err) {
      setError(
        err.message ||
          "Impossible de supprimer l'enseignant."
      );
    }
  }

  async function toggleStatus(enseignant) {
    try {
      setError("");

      await updateEnseignant(
        enseignant.id_enseignant,
        {
          actif: !enseignant.actif,
        }
      );

      await loadEnseignants();
      setOpenMenuId(null);
    } catch (err) {
      setError(
        err.message ||
          "Impossible de modifier le statut."
      );
    }
  }

  return (
    <div className="enseignants-page">
      <div className="enseignants-header">
        <div>
          <h1>Enseignants</h1>
          <p>
            Gestion du personnel enseignant
          </p>
        </div>

        <button
          type="button"
          className="enseignants-primary-btn"
          onClick={openCreateModal}
        >
          ＋ Nouvel enseignant
        </button>
      </div>

      {error && (
        <div className="enseignants-alert">
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

      <div className="enseignants-stats">
        <div className="enseignants-stat">
          <span>👨‍🏫</span>
          <div>
            <small>Total enseignants</small>
            <strong>{total}</strong>
          </div>
        </div>

        <div className="enseignants-stat">
          <span>✅</span>
          <div>
            <small>Actifs</small>
            <strong>{actifs}</strong>
          </div>
        </div>

        <div className="enseignants-stat">
          <span>⛔</span>
          <div>
            <small>Inactifs</small>
            <strong>{inactifs}</strong>
          </div>
        </div>

        <div className="enseignants-stat">
          <span>💰</span>
          <div>
            <small>Taux horaire moyen</small>
            <strong>
              {Math.round(
                tauxMoyen
              ).toLocaleString("fr-FR")}{" "}
              FCFA
            </strong>
          </div>
        </div>
      </div>

      <div className="enseignants-toolbar">
        <div className="enseignants-search">
          🔍

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Rechercher par nom, matricule, téléphone..."
          />
        </div>

        <button
          type="button"
          className="enseignants-refresh"
          onClick={loadEnseignants}
        >
          ↻ Actualiser
        </button>
      </div>

      <div className="enseignants-table-card">
        {loading ? (
          <div className="enseignants-state">
            <div className="enseignants-spinner"></div>
            <p>Chargement...</p>
          </div>
        ) : filteredEnseignants.length ===
          0 ? (
          <div className="enseignants-state">
            <div className="enseignants-empty">
              👨‍🏫
            </div>

            <h3>
              {search
                ? "Aucun enseignant trouvé"
                : "Aucun enseignant enregistré"}
            </h3>

            <p>
              {search
                ? "Modifiez votre recherche."
                : "Commencez par ajouter un enseignant."}
            </p>
          </div>
        ) : (
          <div className="enseignants-table-wrapper">
            <table className="enseignants-table">
              <thead>
                <tr>
                  <th>Matricule</th>
                  <th>Enseignant</th>
                  <th>Téléphone</th>
                  <th>Taux horaire</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredEnseignants.map(
                  (enseignant) => (
                    <tr
                      key={
                        enseignant.id_enseignant
                      }
                    >
                      <td>
                        <span className="enseignants-matricule">
                          {
                            enseignant.matricule
                          }
                        </span>
                      </td>

                      <td>
                        <div className="enseignants-name">
                          <div className="enseignants-avatar">
                            {String(
                              enseignant.prenom ||
                                "E"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {
                                enseignant.prenom
                              }{" "}
                              {
                                enseignant.nom
                              }
                            </strong>

                            <small>
                              {enseignant.email ||
                                "Aucun email"}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        {enseignant.telephone ||
                          "—"}
                      </td>

                      <td>
                        {enseignant.taux_horaire !=
                        null
                          ? `${Number(
                              enseignant.taux_horaire
                            ).toLocaleString(
                              "fr-FR"
                            )} FCFA`
                          : "—"}
                      </td>

                      <td>
                        <span
                          className={`enseignants-status ${
                            enseignant.actif !==
                            false
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          {enseignant.actif !==
                          false
                            ? "Actif"
                            : "Inactif"}
                        </span>
                      </td>

                      <td className="enseignants-actions">
                        <button
                          type="button"
                          className="enseignants-menu-btn"
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId ===
                                enseignant.id_enseignant
                                ? null
                                : enseignant.id_enseignant
                            )
                          }
                        >
                          ⋮
                        </button>

                        {openMenuId ===
                          enseignant.id_enseignant && (
                          <div className="enseignants-menu">
                            <button
                              type="button"
                              onClick={() =>
                                handleView(
                                  enseignant
                                )
                              }
                            >
                              👁️ Consulter
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  enseignant
                                )
                              }
                            >
                              ✏️ Modifier
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                toggleStatus(
                                  enseignant
                                )
                              }
                            >
                              {enseignant.actif !==
                              false
                                ? "⛔ Désactiver"
                                : "✅ Activer"}
                            </button>

                            <button
                              type="button"
                              className="danger"
                              onClick={() =>
                                handleDelete(
                                  enseignant
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

      {showModal && (
        <div className="enseignants-modal-overlay">
          <div className="enseignants-modal">
            <div className="enseignants-modal-header">
              <div>
                <h2>
                  {editingEnseignant
                    ? "Modifier l'enseignant"
                    : "Nouvel enseignant"}
                </h2>
                <p>
                  Renseignez les informations de
                  l'enseignant.
                </p>
              </div>

              <button
                type="button"
                className="enseignants-close"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form
              className="enseignants-form"
              onSubmit={handleSubmit}
            >
              <div className="enseignants-form-grid">
                <div className="enseignants-field">
                  <label>Matricule *</label>
                  <input
                    name="matricule"
                    value={form.matricule}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="enseignants-field">
                  <label>Sexe</label>
                  <select
                    name="sexe"
                    value={form.sexe}
                    onChange={handleChange}
                  >
                    <option value="">
                      Sélectionner
                    </option>
                    <option value="M">
                      Masculin
                    </option>
                    <option value="F">
                      Féminin
                    </option>
                  </select>
                </div>

                <div className="enseignants-field">
                  <label>Nom *</label>
                  <input
                    name="nom"
                    value={form.nom}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="enseignants-field">
                  <label>Prénom *</label>
                  <input
                    name="prenom"
                    value={form.prenom}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="enseignants-field">
                  <label>Date de naissance</label>
                  <input
                    type="date"
                    name="date_naissance"
                    value={
                      form.date_naissance
                    }
                    onChange={handleChange}
                  />
                </div>

                <div className="enseignants-field">
                  <label>Date d'embauche</label>
                  <input
                    type="date"
                    name="date_embauche"
                    value={
                      form.date_embauche
                    }
                    onChange={handleChange}
                  />
                </div>

                <div className="enseignants-field">
                  <label>Téléphone</label>
                  <input
                    name="telephone"
                    value={form.telephone}
                    onChange={handleChange}
                  />
                </div>

                <div className="enseignants-field">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="enseignants-field">
                  <label>Taux horaire</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="taux_horaire"
                    value={
                      form.taux_horaire
                    }
                    onChange={handleChange}
                    placeholder="Ex. 5000"
                  />
                </div>

                <div className="enseignants-field">
                  <label>Statut</label>
                  <select
                    name="statut"
                    value={form.statut}
                    onChange={handleChange}
                  >
                    <option value="actif">
                      Actif
                    </option>
                    <option value="inactif">
                      Inactif
                    </option>
                    <option value="suspendu">
                      Suspendu
                    </option>
                    <option value="conge">
                      En congé
                    </option>
                  </select>
                </div>

                <div className="enseignants-field full">
                  <label>Adresse</label>
                  <input
                    name="adresse"
                    value={form.adresse}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <label className="enseignants-checkbox">
                <input
                  type="checkbox"
                  name="actif"
                  checked={form.actif}
                  onChange={handleChange}
                />
                <span>
                  Compte enseignant actif
                </span>
              </label>

              <div className="enseignants-footer">
                <button
                  type="button"
                  className="enseignants-cancel"
                  onClick={closeModal}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="enseignants-save"
                  disabled={saving}
                >
                  {saving
                    ? "Enregistrement..."
                    : editingEnseignant
                    ? "Enregistrer"
                    : "Créer l'enseignant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal &&
        selectedEnseignant && (
          <div className="enseignants-modal-overlay">
            <div className="enseignants-modal">
              <div className="enseignants-modal-header">
                <div>
                  <h2>
                    Détails de l'enseignant
                  </h2>
                </div>

                <button
                  type="button"
                  className="enseignants-close"
                  onClick={() =>
                    setShowViewModal(false)
                  }
                >
                  ×
                </button>
              </div>

              <div className="enseignants-details">
                <div>
                  <span>Matricule</span>
                  <strong>
                    {
                      selectedEnseignant.matricule
                    }
                  </strong>
                </div>

                <div>
                  <span>Nom complet</span>
                  <strong>
                    {
                      selectedEnseignant.prenom
                    }{" "}
                    {
                      selectedEnseignant.nom
                    }
                  </strong>
                </div>

                <div>
                  <span>Sexe</span>
                  <strong>
                    {selectedEnseignant.sexe ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>Téléphone</span>
                  <strong>
                    {
                      selectedEnseignant.telephone ||
                      "—"
                    }
                  </strong>
                </div>

                <div>
                  <span>Email</span>
                  <strong>
                    {
                      selectedEnseignant.email ||
                      "—"
                    }
                  </strong>
                </div>

                <div>
                  <span>Date d'embauche</span>
                  <strong>
                    {
                      selectedEnseignant.date_embauche ||
                      "—"
                    }
                  </strong>
                </div>

                <div>
                  <span>Taux horaire</span>
                  <strong>
                    {selectedEnseignant.taux_horaire !=
                    null
                      ? `${Number(
                          selectedEnseignant.taux_horaire
                        ).toLocaleString(
                          "fr-FR"
                        )} FCFA`
                      : "—"}
                  </strong>
                </div>

                <div>
                  <span>Statut</span>
                  <strong>
                    {selectedEnseignant.actif !==
                    false
                      ? "Actif"
                      : "Inactif"}
                  </strong>
                </div>

                <div className="full">
                  <span>Adresse</span>
                  <strong>
                    {
                      selectedEnseignant.adresse ||
                      "—"
                    }
                  </strong>
                </div>
              </div>

              <div className="enseignants-footer">
                <button
                  type="button"
                  className="enseignants-cancel"
                  onClick={() =>
                    setShowViewModal(false)
                  }
                >
                  Fermer
                </button>

                <button
                  type="button"
                  className="enseignants-save"
                  onClick={() => {
                    setShowViewModal(false);
                    openEditModal(
                      selectedEnseignant
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