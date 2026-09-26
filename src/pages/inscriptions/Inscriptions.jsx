import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Search,
  Plus,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  ClipboardList,
  CheckCircle,
  Users,
  AlertCircle,
} from "lucide-react";

import {
  getInscriptions,
  getInscription,
  createInscription,
  updateInscription,
  deleteInscription,
} from "../../services/inscriptionsApi";

import { getEleves } from "../../services/elevesApi";
import { getAnnees } from "../../services/anneesApi";
import { getClasses } from "../../services/classesApi";

import "./Inscriptions.css";

function Inscriptions() {
  // =====================================================
  // ÉTATS
  // =====================================================

  const [inscriptions, setInscriptions] =
    useState([]);

  const [eleves, setEleves] =
    useState([]);

  const [annees, setAnnees] =
    useState([]);

  const [classes, setClasses] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [selectedInscription, setSelectedInscription] =
    useState(null);

  const [inscriptionAConsulter, setInscriptionAConsulter] =
    useState(null);

  const [inscriptionEnModification, setInscriptionEnModification] =
    useState(null);

  const [inscriptionASupprimer, setInscriptionASupprimer] =
    useState(null);

  const [showForm, setShowForm] =
    useState(false);

  // =====================================================
  // FORMULAIRE
  // =====================================================

  const [formData, setFormData] =
    useState({
      id_eleve: "",
      id_annee: "",
      id_classe: "",
      numero_inscription: "",
      date_inscription:
        new Date()
          .toISOString()
          .split("T")[0],
      statut: "active",
      redoublant: false,
      observation: "",
    });

  // =====================================================
  // CHARGEMENT
  // =====================================================

  const chargerDonnees =
    async () => {
      try {
        setLoading(true);
        setError("");

        const [
          inscriptionsData,
          elevesData,
          anneesData,
          classesData,
        ] =
          await Promise.all([
            getInscriptions(),
            getEleves({
              skip: 0,
              limit: 1000,
            }),
            getAnnees(),
            getClasses(),
          ]);

        setInscriptions(
          Array.isArray(
            inscriptionsData
          )
            ? inscriptionsData
            : []
        );

        setEleves(
          Array.isArray(elevesData)
            ? elevesData
            : []
        );

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
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "Impossible de charger les inscriptions."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    chargerDonnees();
  }, []);

  // =====================================================
  // RECHERCHE
  // =====================================================

  const filteredInscriptions =
    useMemo(() => {
      const recherche =
        searchTerm
          .toLowerCase()
          .trim();

      if (!recherche) {
        return inscriptions;
      }

      return inscriptions.filter(
        (inscription) => {
          const eleve =
            eleves.find(
              (item) =>
                item.id_eleve ===
                inscription.id_eleve
            );

          const annee =
            annees.find(
              (item) =>
                item.id_annee ===
                inscription.id_annee
            );

          const classe =
            classes.find(
              (item) =>
                item.id_classe ===
                inscription.id_classe
            );

          const texte = [
            inscription.numero_inscription,
            inscription.statut,
            eleve?.nom,
            eleve?.prenom,
            eleve?.matricule,
            annee?.libelle,
            classe?.nom,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return texte.includes(
            recherche
          );
        }
      );
    }, [
      inscriptions,
      eleves,
      annees,
      classes,
      searchTerm,
    ]);

  // =====================================================
  // STATISTIQUES
  // =====================================================

  const totalInscriptions =
    inscriptions.length;

  const inscriptionsActives =
    inscriptions.filter(
      (item) =>
        item.statut === "active"
    ).length;

  const redoublants =
    inscriptions.filter(
      (item) =>
        item.redoublant
    ).length;

  // =====================================================
  // RESET FORMULAIRE
  // =====================================================

  const resetForm = () => {
    setFormData({
      id_eleve: "",
      id_annee: "",
      id_classe: "",
      numero_inscription: "",
      date_inscription:
        new Date()
          .toISOString()
          .split("T")[0],
      statut: "active",
      redoublant: false,
      observation: "",
    });
  };

  // =====================================================
  // AJOUT
  // =====================================================

  const ouvrirAjout = () => {
    resetForm();

    setInscriptionEnModification(
      null
    );

    setShowForm(true);

    setSelectedInscription(
      null
    );
  };

  // =====================================================
  // MODIFICATION
  // =====================================================

  const ouvrirModification = (
    inscription
  ) => {
    setInscriptionEnModification(
      inscription
    );

    setFormData({
      id_eleve:
        inscription.id_eleve ||
        "",
      id_annee:
        inscription.id_annee ||
        "",
      id_classe:
        inscription.id_classe ||
        "",
      numero_inscription:
        inscription.numero_inscription ||
        "",
      date_inscription:
        inscription.date_inscription ||
        "",
      statut:
        inscription.statut ||
        "active",
      redoublant:
        inscription.redoublant ||
        false,
      observation:
        inscription.observation ||
        "",
    });

    setShowForm(true);

    setSelectedInscription(
      null
    );
  };

  // =====================================================
  // FORMULAIRE CHANGE
  // =====================================================

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData(
      (ancien) => ({
        ...ancien,
        [name]:
          type === "checkbox"
            ? checked
            : value,
      })
    );
  };

  // =====================================================
  // ENREGISTRER
  // =====================================================

  const enregistrerInscription =
    async (event) => {
      event.preventDefault();

      if (!formData.id_eleve) {
        setError(
          "Veuillez sélectionner un élève."
        );

        return;
      }

      if (!formData.id_annee) {
        setError(
          "Veuillez sélectionner une année scolaire."
        );

        return;
      }

      if (!formData.id_classe) {
        setError(
          "Veuillez sélectionner une classe."
        );

        return;
      }

      try {
        setSaving(true);
        setError("");

        if (
          inscriptionEnModification
        ) {
          const data =
            await updateInscription(
              inscriptionEnModification.id_inscription,
              {
                id_classe:
                  Number(
                    formData.id_classe
                  ),

                numero_inscription:
                  formData.numero_inscription.trim() ||
                  null,

                statut:
                  formData.statut,

                redoublant:
                  formData.redoublant,

                observation:
                  formData.observation.trim() ||
                  null,
              }
            );

          setInscriptions(
            (anciens) =>
              anciens.map(
                (item) =>
                  item.id_inscription ===
                  inscriptionEnModification.id_inscription
                    ? data
                    : item
              )
          );
        } else {
          const data =
            await createInscription(
              {
                id_eleve:
                  Number(
                    formData.id_eleve
                  ),

                id_annee:
                  Number(
                    formData.id_annee
                  ),

                id_classe:
                  Number(
                    formData.id_classe
                  ),

                numero_inscription:
                  formData.numero_inscription.trim() ||
                  null,

                date_inscription:
                  formData.date_inscription ||
                  null,

                statut:
                  formData.statut,

                redoublant:
                  formData.redoublant,

                observation:
                  formData.observation.trim() ||
                  null,
              }
            );

          setInscriptions(
            (anciens) => [
              ...anciens,
              data,
            ]
          );
        }

        setShowForm(false);
        setInscriptionEnModification(
          null
        );

        resetForm();
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "Impossible d'enregistrer l'inscription."
        );
      } finally {
        setSaving(false);
      }
    };

  // =====================================================
  // CONSULTER
  // =====================================================

  const consulterInscription =
    async (
      inscription
    ) => {
      try {
        setError("");

        const data =
          await getInscription(
            inscription.id_inscription
          );

        setInscriptionAConsulter(
          data
        );

        setSelectedInscription(
          null
        );
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "Impossible de charger l'inscription."
        );
      }
    };

  // =====================================================
  // SUPPRESSION
  // =====================================================

  const demanderSuppression =
    (inscription) => {
      setInscriptionASupprimer(
        inscription
      );

      setSelectedInscription(
        null
      );
    };

  const confirmerSuppression =
    async () => {
      if (!inscriptionASupprimer) {
        return;
      }

      try {
        setError("");

        await deleteInscription(
          inscriptionASupprimer.id_inscription
        );

        setInscriptions(
          (anciens) =>
            anciens.filter(
              (item) =>
                item.id_inscription !==
                inscriptionASupprimer.id_inscription
            )
        );

        setInscriptionASupprimer(
          null
        );
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "Impossible de supprimer l'inscription."
        );
      }
    };

  // =====================================================
  // HELPERS
  // =====================================================

  const getEleve = (id) =>
    eleves.find(
      (item) =>
        item.id_eleve === id
    );

  const getAnnee = (id) =>
    annees.find(
      (item) =>
        item.id_annee === id
    );

  const getClasse = (id) =>
    classes.find(
      (item) =>
        item.id_classe === id
    );

  const formaterDate = (
    date
  ) => {
    if (!date) {
      return "-";
    }

    const parts =
      String(date).split("-");

    if (parts.length !== 3) {
      return date;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // =====================================================
  // AFFICHAGE
  // =====================================================

  return (
    <div className="inscriptions-page">

      <div className="page-header">

        <div>
          <h1>
            Inscriptions
          </h1>

          <p>
            Gestion des inscriptions
            scolaires des élèves.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={ouvrirAjout}
        >
          <Plus size={18} />
          Nouvelle inscription
        </button>

      </div>

      {error && (
        <div className="error-alert">

          <AlertCircle size={18} />

          <span>{error}</span>

          <button
            onClick={() => setError("")}
          >
            <X size={16} />
          </button>

        </div>
      )}

      <div className="stats-grid">

        <div className="stat-card">
          <div className="stat-icon">
            <ClipboardList
              size={22}
            />
          </div>

          <div>
            <span>
              Total inscriptions
            </span>

            <strong>
              {totalInscriptions}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle
              size={22}
            />
          </div>

          <div>
            <span>
              Inscriptions actives
            </span>

            <strong>
              {inscriptionsActives}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Users size={22} />
          </div>

          <div>
            <span>
              Redoublants
            </span>

            <strong>
              {redoublants}
            </strong>
          </div>
        </div>

      </div>

      <div className="content-card">

        <div className="table-toolbar">

          <div className="search-box">

            <Search size={18} />

            <input
              type="text"
              placeholder="Rechercher élève, matricule, année, classe..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />

          </div>

          <button
            className="refresh-button"
            onClick={
              chargerDonnees
            }
            title="Actualiser"
          >
            <RefreshCw size={18} />
          </button>

        </div>

        <div className="table-container">

          {loading ? (
            <div className="loading-state">
              <RefreshCw
                size={24}
                className="loading-icon"
              />

              <span>
                Chargement des inscriptions...
              </span>
            </div>
          ) : (
            <table>

              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Élève</th>
                  <th>Année scolaire</th>
                  <th>Classe</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>Redoublant</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredInscriptions.length >
                0 ? (
                  filteredInscriptions.map(
                    (inscription) => {
                      const eleve =
                        getEleve(
                          inscription.id_eleve
                        );

                      const annee =
                        getAnnee(
                          inscription.id_annee
                        );

                      const classe =
                        getClasse(
                          inscription.id_classe
                        );

                      return (
                        <tr
                          key={
                            inscription.id_inscription
                          }
                        >

                          <td>
                            <strong>
                              {inscription.numero_inscription ||
                                `INS-${String(
                                  inscription.id_inscription
                                ).padStart(
                                  4,
                                  "0"
                                )}`}
                            </strong>
                          </td>

                          <td>
                            <div>
                              <strong>
                                {eleve
                                  ? `${eleve.prenom} ${eleve.nom}`
                                  : `Élève #${inscription.id_eleve}`}
                              </strong>

                              {eleve?.matricule && (
                                <small>
                                  {
                                    eleve.matricule
                                  }
                                </small>
                              )}
                            </div>
                          </td>

                          <td>
                            {annee?.libelle ||
                              "-"}
                          </td>

                          <td>
                            {classe?.nom ||
                              "-"}
                          </td>

                          <td>
                            {formaterDate(
                              inscription.date_inscription
                            )}
                          </td>

                          <td>
                            <span
                              className={
                                inscription.statut ===
                                "active"
                                  ? "status-badge active"
                                  : "status-badge inactive"
                              }
                            >
                              {
                                inscription.statut
                              }
                            </span>
                          </td>

                          <td>
                            {inscription.redoublant
                              ? "Oui"
                              : "Non"}
                          </td>

                          <td className="actions-cell">

                            <button
                              className="action-button"
                              onClick={() =>
                                setSelectedInscription(
                                  selectedInscription?.id_inscription ===
                                    inscription.id_inscription
                                    ? null
                                    : inscription
                                )
                              }
                            >
                              <MoreVertical
                                size={18}
                              />
                            </button>

                            {selectedInscription?.id_inscription ===
                              inscription.id_inscription && (
                              <div className="action-menu">

                                <button
                                  onClick={() =>
                                    consulterInscription(
                                      inscription
                                    )
                                  }
                                >
                                  <Eye size={16} />
                                  <span>
                                    Consulter
                                  </span>
                                </button>

                                <button
                                  onClick={() =>
                                    ouvrirModification(
                                      inscription
                                    )
                                  }
                                >
                                  <Pencil size={16} />
                                  <span>
                                    Modifier
                                  </span>
                                </button>

                                <button
                                  className="danger-action"
                                  onClick={() =>
                                    demanderSuppression(
                                      inscription
                                    )
                                  }
                                >
                                  <Trash2
                                    size={16}
                                  />

                                  <span>
                                    Supprimer
                                  </span>
                                </button>

                              </div>
                            )}

                          </td>

                        </tr>
                      );
                    }
                  )
                ) : (
                  <tr>

                    <td
                      colSpan="8"
                      className="empty-state"
                    >
                      {searchTerm
                        ? "Aucune inscription trouvée."
                        : "Aucune inscription enregistrée."}
                    </td>

                  </tr>
                )}

              </tbody>

            </table>
          )}

        </div>

      </div>

      {/* =================================================
          FORMULAIRE
          ================================================= */}

      {showForm && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!saving) {
              setShowForm(false);
            }
          }}
        >

          <div
            className="modal-card"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <h2>
                  {inscriptionEnModification
                    ? "Modifier l'inscription"
                    : "Nouvelle inscription"}
                </h2>

                <p>
                  Renseignez les informations
                  de l'inscription.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setShowForm(false)
                }
                disabled={saving}
              >
                <X size={20} />
              </button>

            </div>

            <form
              className="inscription-form"
              onSubmit={
                enregistrerInscription
              }
            >

              <div className="form-grid">

                <div className="form-group">
                  <label>
                    Élève *
                  </label>

                  <select
                    name="id_eleve"
                    value={
                      formData.id_eleve
                    }
                    onChange={handleChange}
                    disabled={
                      !!inscriptionEnModification ||
                      saving
                    }
                    required
                  >
                    <option value="">
                      Sélectionner un élève
                    </option>

                    {eleves.map(
                      (eleve) => (
                        <option
                          key={
                            eleve.id_eleve
                          }
                          value={
                            eleve.id_eleve
                          }
                        >
                          {eleve.prenom}{" "}
                          {eleve.nom} —{" "}
                          {
                            eleve.matricule
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Année scolaire *
                  </label>

                  <select
                    name="id_annee"
                    value={
                      formData.id_annee
                    }
                    onChange={handleChange}
                    disabled={
                      !!inscriptionEnModification ||
                      saving
                    }
                    required
                  >
                    <option value="">
                      Sélectionner une année
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
                          {
                            annee.libelle
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Classe *
                  </label>

                  <select
                    name="id_classe"
                    value={
                      formData.id_classe
                    }
                    onChange={handleChange}
                    disabled={saving}
                    required
                  >
                    <option value="">
                      Sélectionner une classe
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
                          {classe.niveau
                            ? ` — ${classe.niveau}`
                            : ""}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Numéro d'inscription
                  </label>

                  <input
                    name="numero_inscription"
                    value={
                      formData.numero_inscription
                    }
                    onChange={handleChange}
                    disabled={saving}
                    placeholder="Ex. INS-2026-001"
                  />
                </div>

                <div className="form-group">
                  <label>
                    Date d'inscription
                  </label>

                  <input
                    type="date"
                    name="date_inscription"
                    value={
                      formData.date_inscription
                    }
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>

                <div className="form-group">
                  <label>
                    Statut
                  </label>

                  <select
                    name="statut"
                    value={
                      formData.statut
                    }
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="active">
                      Active
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>

                    <option value="terminee">
                      Terminée
                    </option>
                  </select>
                </div>

                <div className="form-group full-width">

                  <label className="checkbox-row">

                    <input
                      type="checkbox"
                      name="redoublant"
                      checked={
                        formData.redoublant
                      }
                      onChange={handleChange}
                      disabled={saving}
                    />

                    <span>
                      Élève redoublant
                    </span>

                  </label>

                </div>

                <div className="form-group full-width">

                  <label>
                    Observation
                  </label>

                  <textarea
                    name="observation"
                    rows="4"
                    value={
                      formData.observation
                    }
                    onChange={handleChange}
                    disabled={saving}
                    placeholder="Observation concernant l'inscription..."
                  />

                </div>

              </div>

              <div className="form-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowForm(false)
                  }
                  disabled={saving}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Enregistrement..."
                    : inscriptionEnModification
                    ? "Enregistrer les modifications"
                    : "Créer l'inscription"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =================================================
          CONSULTATION
          ================================================= */}

      {inscriptionAConsulter && (
        <div
          className="modal-overlay"
          onClick={() =>
            setInscriptionAConsulter(
              null
            )
          }
        >

          <div
            className="modal-card"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <h2>
                  Détails de l'inscription
                </h2>

                <p>
                  Informations enregistrées
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setInscriptionAConsulter(
                    null
                  )
                }
              >
                <X size={20} />
              </button>

            </div>

            <div className="details-grid">

              <div className="detail-item">
                <span>
                  Numéro
                </span>

                <strong>
                  {
                    inscriptionAConsulter.numero_inscription ||
                    `INS-${String(
                      inscriptionAConsulter.id_inscription
                    ).padStart(
                      4,
                      "0"
                    )}`
                  }
                </strong>
              </div>

              <div className="detail-item">
                <span>
                  Élève
                </span>

                <strong>
                  {getEleve(
                    inscriptionAConsulter.id_eleve
                  )
                    ? `${getEleve(
                        inscriptionAConsulter.id_eleve
                      ).prenom} ${getEleve(
                        inscriptionAConsulter.id_eleve
                      ).nom}`
                    : "-"}
                </strong>
              </div>

              <div className="detail-item">
                <span>
                  Année scolaire
                </span>

                <strong>
                  {getAnnee(
                    inscriptionAConsulter.id_annee
                  )?.libelle ||
                    "-"}
                </strong>
              </div>

              <div className="detail-item">
                <span>
                  Classe
                </span>

                <strong>
                  {getClasse(
                    inscriptionAConsulter.id_classe
                  )?.nom ||
                    "-"}
                </strong>
              </div>

              <div className="detail-item">
                <span>
                  Date
                </span>

                <strong>
                  {formaterDate(
                    inscriptionAConsulter.date_inscription
                  )}
                </strong>
              </div>

              <div className="detail-item">
                <span>
                  Statut
                </span>

                <strong>
                  {
                    inscriptionAConsulter.statut
                  }
                </strong>
              </div>

              <div className="detail-item">
                <span>
                  Redoublant
                </span>

                <strong>
                  {
                    inscriptionAConsulter.redoublant
                      ? "Oui"
                      : "Non"
                  }
                </strong>
              </div>

              <div className="detail-item full-width">
                <span>
                  Observation
                </span>

                <strong>
                  {
                    inscriptionAConsulter.observation ||
                    "-"
                  }
                </strong>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          SUPPRESSION
          ================================================= */}

      {inscriptionASupprimer && (
        <div className="modal-overlay">

          <div className="modal-card delete-modal">

            <div className="delete-icon">
              <Trash2 size={28} />
            </div>

            <h2>
              Supprimer cette inscription ?
            </h2>

            <p>
              Cette inscription sera
              supprimée définitivement.
            </p>

            <p className="warning-text">
              Cette action est irréversible.
            </p>

            <div className="form-actions">

              <button
                className="secondary-button"
                onClick={() =>
                  setInscriptionASupprimer(
                    null
                  )
                }
              >
                Annuler
              </button>

              <button
                className="danger-button"
                onClick={
                  confirmerSuppression
                }
              >
                <Trash2 size={16} />
                Supprimer
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Inscriptions;