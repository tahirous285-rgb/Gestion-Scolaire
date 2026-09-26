import { useEffect, useMemo, useState } from "react";

import {
  Search,
  Plus,
  MoreVertical,
  Users,
  UserCheck,
  UserX,
  Eye,
  Pencil,
  Power,
  Trash2,
  X,
  Link,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import EleveForm from "./EleveForm";

import {
  getEleves,
  getEleve,
  createEleve,
  updateEleve,
  deleteEleve,
} from "../../services/elevesApi";

import {
  getParents,
  getParentsOfEleve,
  linkParentToEleve,
} from "../../services/parentsApi";

import "./Eleves.css";

function Eleves() {
  // =====================================================
  // CONFIGURATION
  // =====================================================

  const ETABLISSEMENT_ID =
    Number(
      import.meta.env.VITE_ETABLISSEMENT_ID
    ) || 1;

  // =====================================================
  // ÉTATS ÉLÈVES
  // =====================================================

  const [eleves, setEleves] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [selectedEleve, setSelectedEleve] =
    useState(null);

  const [eleveAConsulter, setEleveAConsulter] =
    useState(null);

  const [eleveEnModification, setEleveEnModification] =
    useState(null);

  const [eleveASupprimer, setEleveASupprimer] =
    useState(null);

  const [showEleveForm, setShowEleveForm] =
    useState(false);

  // =====================================================
  // ÉTATS PARENTS
  // =====================================================

  const [parents, setParents] = useState([]);

  const [elevePourParents, setElevePourParents] =
    useState(null);

  const [parentsDeLEleve, setParentsDeLEleve] =
    useState([]);

  const [loadingParents, setLoadingParents] =
    useState(false);

  const [showParentModal, setShowParentModal] =
    useState(false);

  const [parentSelectionne, setParentSelectionne] =
    useState("");

  const [lienParente, setLienParente] =
    useState("");

  const [estResponsable, setEstResponsable] =
    useState(false);

  const [estContactUrgence, setEstContactUrgence] =
    useState(false);

  const [linking, setLinking] =
    useState(false);

  // =====================================================
  // CHARGEMENT ÉLÈVES
  // =====================================================

  const chargerEleves = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getEleves({
        skip: 0,
        limit: 1000,
      });

      setEleves(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Impossible de charger les élèves."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CHARGEMENT PARENTS
  // =====================================================

  const chargerParents = async () => {
    try {
      const data = await getParents();

      setParents(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(
        "Erreur chargement parents :",
        err
      );
    }
  };

  // =====================================================
  // INITIALISATION
  // =====================================================

  useEffect(() => {
    chargerEleves();
    chargerParents();
  }, []);

  // =====================================================
  // RECHERCHE
  // =====================================================

  const filteredEleves = useMemo(() => {
    const recherche =
      searchTerm.toLowerCase().trim();

    if (!recherche) {
      return eleves;
    }

    return eleves.filter((eleve) => {
      return (
        (eleve.matricule || "")
          .toLowerCase()
          .includes(recherche) ||
        (eleve.nom || "")
          .toLowerCase()
          .includes(recherche) ||
        (eleve.prenom || "")
          .toLowerCase()
          .includes(recherche) ||
        (eleve.telephone || "")
          .toLowerCase()
          .includes(recherche)
      );
    });
  }, [eleves, searchTerm]);

  // =====================================================
  // STATISTIQUES
  // =====================================================

  const totalEleves = eleves.length;

  const elevesActifs = eleves.filter(
    (eleve) => eleve.actif
  ).length;

  const elevesInactifs = eleves.filter(
    (eleve) => !eleve.actif
  ).length;

  // =====================================================
  // AJOUT
  // =====================================================

  const ouvrirAjout = () => {
    setEleveEnModification(null);
    setShowEleveForm(true);
    setSelectedEleve(null);
  };

  // =====================================================
  // MODIFICATION
  // =====================================================

  const modifierEleve = (eleve) => {
    setEleveEnModification(eleve);
    setShowEleveForm(true);
    setSelectedEleve(null);
  };

  // =====================================================
  // ENREGISTRER
  // =====================================================

  const enregistrerEleve = async (
    donnees
  ) => {
    try {
      setSaving(true);
      setError("");

      if (eleveEnModification) {
        const eleveModifie =
          await updateEleve(
            eleveEnModification.id_eleve,
            donnees
          );

        setEleves((anciens) =>
          anciens.map((eleve) =>
            eleve.id_eleve ===
            eleveEnModification.id_eleve
              ? eleveModifie
              : eleve
          )
        );
      } else {
        const nouvelEleve =
          await createEleve({
            id_etablissement:
              ETABLISSEMENT_ID,
            ...donnees,
          });

        setEleves((anciens) => [
          ...anciens,
          nouvelEleve,
        ]);
      }

      setShowEleveForm(false);
      setEleveEnModification(null);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Impossible d'enregistrer l'élève."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // CONSULTER
  // =====================================================

  const consulterEleve = async (
    eleve
  ) => {
    try {
      setError("");

      const data = await getEleve(
        eleve.id_eleve
      );

      setEleveAConsulter(data);
      setSelectedEleve(null);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Impossible de charger le dossier."
      );
    }
  };

  // =====================================================
  // ACTIVER / DÉSACTIVER
  // =====================================================

  const changerStatut = async (
    eleve
  ) => {
    try {
      setError("");

      const eleveModifie =
        await updateEleve(
          eleve.id_eleve,
          {
            actif: !eleve.actif,
          }
        );

      setEleves((anciens) =>
        anciens.map((item) =>
          item.id_eleve ===
          eleve.id_eleve
            ? eleveModifie
            : item
        )
      );

      setSelectedEleve(null);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Impossible de modifier le statut."
      );
    }
  };

  // =====================================================
  // SUPPRESSION
  // =====================================================

  const demanderSuppression = (
    eleve
  ) => {
    setEleveASupprimer(eleve);
    setSelectedEleve(null);
  };

  const confirmerSuppression = async () => {
    if (!eleveASupprimer) {
      return;
    }

    try {
      setError("");

      await deleteEleve(
        eleveASupprimer.id_eleve
      );

      setEleves((anciens) =>
        anciens.filter(
          (eleve) =>
            eleve.id_eleve !==
            eleveASupprimer.id_eleve
        )
      );

      setEleveASupprimer(null);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Impossible de supprimer l'élève."
      );
    }
  };

  // =====================================================
  // OUVRIR GESTION PARENTS
  // =====================================================

  const ouvrirParentsEleve = async (
    eleve
  ) => {
    try {
      setError("");
      setLoadingParents(true);

      const relations =
        await getParentsOfEleve(
          eleve.id_eleve
        );

      setElevePourParents(eleve);

      setParentsDeLEleve(
        Array.isArray(relations)
          ? relations
          : []
      );

      setParentSelectionne("");
      setLienParente("");
      setEstResponsable(false);
      setEstContactUrgence(false);

      setShowParentModal(true);
      setSelectedEleve(null);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Impossible de récupérer les parents."
      );
    } finally {
      setLoadingParents(false);
    }
  };

  // =====================================================
  // LIER PARENT
  // =====================================================

  const lierParent = async (
    event
  ) => {
    event.preventDefault();

    if (!elevePourParents) {
      return;
    }

    if (!parentSelectionne) {
      setError(
        "Veuillez sélectionner un parent."
      );

      return;
    }

    try {
      setLinking(true);
      setError("");

      const relation =
        await linkParentToEleve({
          id_eleve:
            Number(
              elevePourParents.id_eleve
            ),

          id_parent:
            Number(parentSelectionne),

          lien_parente:
            lienParente.trim() || null,

          est_responsable:
            estResponsable,

          est_contact_urgence:
            estContactUrgence,
        });

      setParentsDeLEleve(
        (anciens) => [
          ...anciens,
          relation,
        ]
      );

      setParentSelectionne("");
      setLienParente("");
      setEstResponsable(false);
      setEstContactUrgence(false);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Impossible de lier le parent."
      );
    } finally {
      setLinking(false);
    }
  };

  // =====================================================
  // OBTENIR NOM PARENT
  // =====================================================

  const trouverParent = (
    idParent
  ) => {
    return parents.find(
      (parent) =>
        parent.id_parent === idParent
    );
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formaterDate = (date) => {
    if (!date) {
      return "-";
    }

    const morceaux =
      String(date).split("-");

    if (morceaux.length !== 3) {
      return date;
    }

    return `${morceaux[2]}/${morceaux[1]}/${morceaux[0]}`;
  };

  // =====================================================
  // AFFICHAGE
  // =====================================================

  return (
    <div className="page-container">

      {/* =================================================
          EN-TÊTE
          ================================================= */}

      <div className="page-header">
        <div>
          <h1>Élèves</h1>

          <p>
            Gestion des élèves et de leurs
            informations scolaires.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={ouvrirAjout}
        >
          <Plus size={18} />
          Ajouter un élève
        </button>
      </div>

      {/* =================================================
          ERREUR
          ================================================= */}

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

      {/* =================================================
          STATISTIQUES
          ================================================= */}

      <div className="stats-grid">

        <div className="stat-card">
          <div className="stat-icon">
            <Users size={22} />
          </div>

          <div>
            <span>Total élèves</span>
            <strong>
              {totalEleves}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <UserCheck size={22} />
          </div>

          <div>
            <span>Élèves actifs</span>
            <strong>
              {elevesActifs}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <UserX size={22} />
          </div>

          <div>
            <span>Élèves inactifs</span>
            <strong>
              {elevesInactifs}
            </strong>
          </div>
        </div>

      </div>

      {/* =================================================
          TABLEAU
          ================================================= */}

      <div className="content-card">

        <div className="table-toolbar">

          <div className="search-box">

            <Search size={18} />

            <input
              type="text"
              placeholder="Rechercher par matricule, nom, prénom ou téléphone..."
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
            onClick={chargerEleves}
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
                Chargement des élèves...
              </span>
            </div>
          ) : (
            <table>

              <thead>
                <tr>
                  <th>Matricule</th>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Sexe</th>
                  <th>Téléphone</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredEleves.length >
                0 ? (
                  filteredEleves.map(
                    (eleve) => (
                      <tr
                        key={
                          eleve.id_eleve
                        }
                      >

                        <td>
                          <strong>
                            {
                              eleve.matricule
                            }
                          </strong>
                        </td>

                        <td>
                          {eleve.nom}
                        </td>

                        <td>
                          {eleve.prenom}
                        </td>

                        <td>
                          {eleve.sexe ||
                            "-"}
                        </td>

                        <td>
                          {eleve.telephone ||
                            "-"}
                        </td>

                        <td>
                          <span
                            className={
                              eleve.actif
                                ? "status-badge active"
                                : "status-badge inactive"
                            }
                          >
                            {eleve.actif
                              ? "Actif"
                              : "Inactif"}
                          </span>
                        </td>

                        <td className="actions-cell">

                          <button
                            className="action-button"
                            onClick={() =>
                              setSelectedEleve(
                                selectedEleve?.id_eleve ===
                                  eleve.id_eleve
                                  ? null
                                  : eleve
                              )
                            }
                          >
                            <MoreVertical
                              size={18}
                            />
                          </button>

                          {selectedEleve?.id_eleve ===
                            eleve.id_eleve && (
                            <div className="action-menu">

                              <button
                                onClick={() =>
                                  consulterEleve(
                                    eleve
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
                                  modifierEleve(
                                    eleve
                                  )
                                }
                              >
                                <Pencil size={16} />
                                <span>
                                  Modifier
                                </span>
                              </button>

                              <button
                                onClick={() =>
                                  ouvrirParentsEleve(
                                    eleve
                                  )
                                }
                              >
                                <Link size={16} />
                                <span>
                                  Gérer les parents
                                </span>
                              </button>

                              <button
                                onClick={() =>
                                  changerStatut(
                                    eleve
                                  )
                                }
                              >
                                <Power size={16} />
                                <span>
                                  {eleve.actif
                                    ? "Désactiver"
                                    : "Réactiver"}
                                </span>
                              </button>

                              <button
                                className="danger-action"
                                onClick={() =>
                                  demanderSuppression(
                                    eleve
                                  )
                                }
                              >
                                <Trash2 size={16} />
                                <span>
                                  Supprimer
                                </span>
                              </button>

                            </div>
                          )}

                        </td>

                      </tr>
                    )
                  )
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="empty-state"
                    >
                      {searchTerm
                        ? "Aucun élève trouvé."
                        : "Aucun élève enregistré."}
                    </td>
                  </tr>
                )}

              </tbody>

            </table>
          )}

        </div>
      </div>

      {/* =================================================
          FORMULAIRE ÉLÈVE
          ================================================= */}

      {showEleveForm && (
        <EleveForm
          eleveInitial={
            eleveEnModification
          }
          loading={saving}
          onClose={() => {
            if (!saving) {
              setShowEleveForm(false);
              setEleveEnModification(
                null
              );
            }
          }}
          onSave={enregistrerEleve}
        />
      )}

      {/* =================================================
          CONSULTATION
          ================================================= */}

      {eleveAConsulter && (
        <div
          className="modal-overlay"
          onClick={() =>
            setEleveAConsulter(null)
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
                  Dossier de l'élève
                </h2>

                <p>
                  Informations personnelles
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setEleveAConsulter(null)
                }
              >
                <X size={20} />
              </button>
            </div>

            <div className="student-profile">

              <div className="student-photo">

                {eleveAConsulter.photo ? (
                  <img
                    src={
                      eleveAConsulter.photo
                    }
                    alt=""
                  />
                ) : (
                  <span>
                    {eleveAConsulter.prenom?.charAt(
                      0
                    )}

                    {eleveAConsulter.nom?.charAt(
                      0
                    )}
                  </span>
                )}

              </div>

              <div className="student-name">

                <h3>
                  {eleveAConsulter.prenom}{" "}
                  {
                    eleveAConsulter.nom
                  }
                </h3>

                <span>
                  {
                    eleveAConsulter.matricule
                  }
                </span>

              </div>
            </div>

            <div className="student-details">

              <div className="detail-item">
                <span>Sexe</span>
                <strong>
                  {eleveAConsulter.sexe ===
                  "M"
                    ? "Masculin"
                    : eleveAConsulter.sexe ===
                      "F"
                    ? "Féminin"
                    : "-"}
                </strong>
              </div>

              <div className="detail-item">
                <span>
                  Date de naissance
                </span>
                <strong>
                  {formaterDate(
                    eleveAConsulter.date_naissance
                  )}
                </strong>
              </div>

              <div className="detail-item">
                <span>
                  Lieu de naissance
                </span>
                <strong>
                  {
                    eleveAConsulter.lieu_naissance ||
                    "-"
                  }
                </strong>
              </div>

              <div className="detail-item">
                <span>
                  Nationalité
                </span>
                <strong>
                  {
                    eleveAConsulter.nationalite ||
                    "-"
                  }
                </strong>
              </div>

              <div className="detail-item">
                <span>
                  Téléphone
                </span>
                <strong>
                  {
                    eleveAConsulter.telephone ||
                    "-"
                  }
                </strong>
              </div>

              <div className="detail-item">
                <span>
                  E-mail
                </span>
                <strong>
                  {
                    eleveAConsulter.email ||
                    "-"
                  }
                </strong>
              </div>

              <div className="detail-item full-width">
                <span>
                  Adresse
                </span>
                <strong>
                  {
                    eleveAConsulter.adresse ||
                    "-"
                  }
                </strong>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* =================================================
          MODALE PARENTS
          ================================================= */}

      {showParentModal &&
        elevePourParents && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!linking) {
              setShowParentModal(false);
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
                  Parents de l'élève
                </h2>

                <p>
                  {
                    elevePourParents.prenom
                  }{" "}
                  {
                    elevePourParents.nom
                  }{" "}
                  —{" "}
                  {
                    elevePourParents.matricule
                  }
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setShowParentModal(false)
                }
              >
                <X size={20} />
              </button>

            </div>

            <div className="parent-management">

              <h3>
                Parents déjà liés
              </h3>

              {loadingParents ? (
                <div className="loading-state">
                  Chargement...
                </div>
              ) : parentsDeLEleve.length ===
                0 ? (
                <p className="empty-state">
                  Aucun parent lié à cet élève.
                </p>
              ) : (
                <div className="linked-parents-list">

                  {parentsDeLEleve.map(
                    (relation, index) => {
                      const parent =
                        trouverParent(
                          relation.id_parent
                        );

                      return (
                        <div
                          className="linked-parent"
                          key={`${relation.id_parent}-${index}`}
                        >
                          <div>
                            <strong>
                              {parent
                                ? `${parent.prenom} ${parent.nom}`
                                : `Parent #${relation.id_parent}`}
                            </strong>

                            <span>
                              {
                                relation.lien_parente ||
                                "Lien non précisé"
                              }
                            </span>
                          </div>

                          <div className="parent-flags">

                            {relation.est_responsable && (
                              <span>
                                Responsable
                              </span>
                            )}

                            {relation.est_contact_urgence && (
                              <span>
                                Urgence
                              </span>
                            )}

                          </div>
                        </div>
                      );
                    }
                  )}

                </div>
              )}

              <hr />

              <h3>
                Ajouter une liaison
              </h3>

              <form
                className="parent-link-form"
                onSubmit={lierParent}
              >

                <div className="form-group">
                  <label>
                    Parent *
                  </label>

                  <select
                    value={
                      parentSelectionne
                    }
                    onChange={(event) =>
                      setParentSelectionne(
                        event.target.value
                      )
                    }
                    required
                  >
                    <option value="">
                      Sélectionner un parent
                    </option>

                    {parents.map(
                      (parent) => (
                        <option
                          key={
                            parent.id_parent
                          }
                          value={
                            parent.id_parent
                          }
                        >
                          {parent.prenom}{" "}
                          {parent.nom}
                        </option>
                      )
                    )}

                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Lien de parenté
                  </label>

                  <select
                    value={lienParente}
                    onChange={(event) =>
                      setLienParente(
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Sélectionner
                    </option>

                    <option value="Père">
                      Père
                    </option>

                    <option value="Mère">
                      Mère
                    </option>

                    <option value="Tuteur">
                      Tuteur
                    </option>

                    <option value="Tutrice">
                      Tutrice
                    </option>

                    <option value="Frère">
                      Frère
                    </option>

                    <option value="Sœur">
                      Sœur
                    </option>

                    <option value="Autre">
                      Autre
                    </option>
                  </select>
                </div>

                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={
                      estResponsable
                    }
                    onChange={(event) =>
                      setEstResponsable(
                        event.target.checked
                      )
                    }
                  />

                  <span>
                    Responsable légal
                  </span>
                </label>

                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={
                      estContactUrgence
                    }
                    onChange={(event) =>
                      setEstContactUrgence(
                        event.target.checked
                      )
                    }
                  />

                  <span>
                    Contact d'urgence
                  </span>
                </label>

                <div className="form-actions">

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      setShowParentModal(
                        false
                      )
                    }
                    disabled={linking}
                  >
                    Fermer
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={linking}
                  >
                    {linking
                      ? "Liaison..."
                      : "Lier le parent"}
                  </button>

                </div>

              </form>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          SUPPRESSION
          ================================================= */}

      {eleveASupprimer && (
        <div className="modal-overlay">

          <div className="modal-card delete-modal">

            <div className="delete-icon">
              <Trash2 size={28} />
            </div>

            <h2>
              Supprimer cet élève ?
            </h2>

            <p>
              Vous êtes sur le point de
              supprimer
              <strong>
                {" "}
                {
                  eleveASupprimer.prenom
                }{" "}
                {
                  eleveASupprimer.nom
                }
              </strong>
              .
            </p>

            <p className="warning-text">
              Cette action est irréversible.
            </p>

            <div className="form-actions">

              <button
                className="secondary-button"
                onClick={() =>
                  setEleveASupprimer(
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

export default Eleves;