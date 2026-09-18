import { useEffect, useMemo, useState } from "react";

import {
  Search,
  Plus,
  MoreVertical,
  Users,
  UserCheck,
  Eye,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  RefreshCw,
  Link,
} from "lucide-react";

import {
  getParents,
  getParent,
  createParent,
  updateParent,
  deleteParent,
  linkParentToEleve,
} from "../../services/parentsApi";

import { getEleves } from "../../services/elevesApi";

import "./Parents.css";

function Parents() {
  // =====================================================
  // CONFIGURATION
  // =====================================================

  const ETABLISSEMENT_ID =
    Number(import.meta.env.VITE_ETABLISSEMENT_ID) || 1;

  // =====================================================
  // ÉTATS
  // =====================================================

  const [parents, setParents] = useState([]);

  const [eleves, setEleves] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedParent, setSelectedParent] =
    useState(null);

  const [parentAConsulter, setParentAConsulter] =
    useState(null);

  const [parentEnModification, setParentEnModification] =
    useState(null);

  const [parentASupprimer, setParentASupprimer] =
    useState(null);

  const [showForm, setShowForm] = useState(false);

  const [showLinkForm, setShowLinkForm] =
    useState(false);

  const [parentALier, setParentALier] =
    useState(null);

  const [saving, setSaving] = useState(false);

  const [linking, setLinking] = useState(false);

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    telephone_secondaire: "",
    email: "",
    adresse: "",
    profession: "",
  });

  const [linkData, setLinkData] = useState({
    id_eleve: "",
    lien_parente: "",
    est_responsable: false,
    est_contact_urgence: false,
  });

  // =====================================================
  // CHARGEMENT DES PARENTS
  // =====================================================

  const chargerParents = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getParents();

      setParents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Impossible de charger les parents."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CHARGEMENT DES ÉLÈVES
  // =====================================================

  const chargerEleves = async () => {
    try {
      const data = await getEleves({
        skip: 0,
        limit: 1000,
      });

      setEleves(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(
        "Erreur chargement élèves :",
        err
      );
    }
  };

  // =====================================================
  // INITIALISATION
  // =====================================================

  useEffect(() => {
    chargerParents();
    chargerEleves();
  }, []);

  // =====================================================
  // RECHERCHE
  // =====================================================

  const filteredParents = useMemo(() => {
    const recherche =
      searchTerm.toLowerCase().trim();

    if (!recherche) {
      return parents;
    }

    return parents.filter((parent) => {
      return (
        String(parent.id_parent)
          .toLowerCase()
          .includes(recherche) ||
        (parent.nom || "")
          .toLowerCase()
          .includes(recherche) ||
        (parent.prenom || "")
          .toLowerCase()
          .includes(recherche) ||
        (parent.telephone || "")
          .toLowerCase()
          .includes(recherche) ||
        (parent.email || "")
          .toLowerCase()
          .includes(recherche) ||
        (parent.profession || "")
          .toLowerCase()
          .includes(recherche)
      );
    });
  }, [parents, searchTerm]);

  // =====================================================
  // STATISTIQUES
  // =====================================================

  const totalParents = parents.length;

  const parentsAvecTelephone = parents.filter(
    (parent) =>
      parent.telephone &&
      parent.telephone.trim() !== ""
  ).length;

  const parentsAvecEmail = parents.filter(
    (parent) =>
      parent.email &&
      parent.email.trim() !== ""
  ).length;

  // =====================================================
  // OUVRIR FORMULAIRE AJOUT
  // =====================================================

  const ouvrirAjout = () => {
    setParentEnModification(null);

    setFormData({
      nom: "",
      prenom: "",
      telephone: "",
      telephone_secondaire: "",
      email: "",
      adresse: "",
      profession: "",
    });

    setShowForm(true);
    setSelectedParent(null);
  };

  // =====================================================
  // OUVRIR FORMULAIRE MODIFICATION
  // =====================================================

  const ouvrirModification = (parent) => {
    setParentEnModification(parent);

    setFormData({
      nom: parent.nom || "",
      prenom: parent.prenom || "",
      telephone: parent.telephone || "",
      telephone_secondaire:
        parent.telephone_secondaire || "",
      email: parent.email || "",
      adresse: parent.adresse || "",
      profession: parent.profession || "",
    });

    setShowForm(true);
    setSelectedParent(null);
  };

  // =====================================================
  // CHANGEMENT FORMULAIRE
  // =====================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((ancien) => ({
      ...ancien,
      [name]: value,
    }));
  };

  // =====================================================
  // ENREGISTRER PARENT
  // =====================================================

  const enregistrerParent = async (event) => {
    event.preventDefault();

    if (!formData.nom.trim()) {
      setError("Le nom est obligatoire.");
      return;
    }

    if (!formData.prenom.trim()) {
      setError("Le prénom est obligatoire.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const donnees = {
        id_etablissement: ETABLISSEMENT_ID,
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        telephone:
          formData.telephone.trim() || null,
        telephone_secondaire:
          formData.telephone_secondaire.trim() ||
          null,
        email:
          formData.email.trim() || null,
        adresse:
          formData.adresse.trim() || null,
        profession:
          formData.profession.trim() || null,
      };

      if (parentEnModification) {
        const parentModifie =
          await updateParent(
            parentEnModification.id_parent,
            donnees
          );

        setParents((anciens) =>
          anciens.map((parent) =>
            parent.id_parent ===
            parentEnModification.id_parent
              ? parentModifie
              : parent
          )
        );
      } else {
        const nouveauParent =
          await createParent(donnees);

        setParents((anciens) => [
          ...anciens,
          nouveauParent,
        ]);
      }

      setShowForm(false);
      setParentEnModification(null);

      setFormData({
        nom: "",
        prenom: "",
        telephone: "",
        telephone_secondaire: "",
        email: "",
        adresse: "",
        profession: "",
      });
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Erreur lors de l'enregistrement."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // CONSULTER
  // =====================================================

  const consulterParent = async (parent) => {
    try {
      setError("");

      const parentComplet =
        await getParent(parent.id_parent);

      setParentAConsulter(parentComplet);
      setSelectedParent(null);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Impossible de récupérer le parent."
      );
    }
  };

  // =====================================================
  // DEMANDER SUPPRESSION
  // =====================================================

  const demanderSuppression = (parent) => {
    setParentASupprimer(parent);
    setSelectedParent(null);
  };

  // =====================================================
  // CONFIRMER SUPPRESSION
  // =====================================================

  const confirmerSuppression = async () => {
    if (!parentASupprimer) {
      return;
    }

    try {
      setError("");

      await deleteParent(
        parentASupprimer.id_parent
      );

      setParents((anciens) =>
        anciens.filter(
          (parent) =>
            parent.id_parent !==
            parentASupprimer.id_parent
        )
      );

      setParentASupprimer(null);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Impossible de supprimer ce parent."
      );
    }
  };

  // =====================================================
  // OUVRIR FORMULAIRE LIEN
  // =====================================================

  const ouvrirLiaison = (parent) => {
    setParentALier(parent);

    setLinkData({
      id_eleve: "",
      lien_parente: "",
      est_responsable: false,
      est_contact_urgence: false,
    });

    setShowLinkForm(true);
    setSelectedParent(null);
  };

  // =====================================================
  // CHANGEMENT FORMULAIRE LIEN
  // =====================================================

  const handleLinkChange = (event) => {
    const { name, value, type, checked } =
      event.target;

    setLinkData((ancien) => ({
      ...ancien,
      [name]:
        type === "checkbox" ? checked : value,
    }));
  };

  // =====================================================
  // LIER PARENT / ÉLÈVE
  // =====================================================

  const enregistrerLiaison = async (event) => {
    event.preventDefault();

    if (!parentALier) {
      return;
    }

    if (!linkData.id_eleve) {
      setError(
        "Veuillez sélectionner un élève."
      );

      return;
    }

    try {
      setLinking(true);
      setError("");

      await linkParentToEleve({
        id_eleve: Number(linkData.id_eleve),
        id_parent:
          Number(parentALier.id_parent),
        lien_parente:
          linkData.lien_parente.trim() || null,
        est_responsable:
          linkData.est_responsable,
        est_contact_urgence:
          linkData.est_contact_urgence,
      });

      setShowLinkForm(false);
      setParentALier(null);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Impossible de lier le parent à l'élève."
      );
    } finally {
      setLinking(false);
    }
  };

  // =====================================================
  // FERMER FORMULAIRES
  // =====================================================

  const fermerFormulaire = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setParentEnModification(null);
  };

  const fermerLiaison = () => {
    if (linking) {
      return;
    }

    setShowLinkForm(false);
    setParentALier(null);
  };

  // =====================================================
  // FORMAT ID
  // =====================================================

  const afficherId = (id) => {
    if (!id) {
      return "-";
    }

    return `PAR-${String(id).padStart(4, "0")}`;
  };

  // =====================================================
  // AFFICHAGE
  // =====================================================

  return (
    <div className="parents-page">

      {/* =================================================
          EN-TÊTE
          ================================================= */}

      <div className="page-header">

        <div>
          <h1>Parents</h1>

          <p>
            Gestion des parents et responsables
            des élèves.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={ouvrirAjout}
        >
          <Plus size={18} />
          Ajouter un parent
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
            <span>Total parents</span>
            <strong>{totalParents}</strong>
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon">
            <UserCheck size={22} />
          </div>

          <div>
            <span>Avec téléphone</span>
            <strong>
              {parentsAvecTelephone}
            </strong>
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon">
            <Users size={22} />
          </div>

          <div>
            <span>Avec e-mail</span>
            <strong>
              {parentsAvecEmail}
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
              placeholder="Rechercher par nom, prénom, téléphone, e-mail..."
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
            onClick={chargerParents}
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
                Chargement des parents...
              </span>
            </div>
          ) : (
            <table>

              <thead>

                <tr>
                  <th>ID</th>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Téléphone</th>
                  <th>E-mail</th>
                  <th>Profession</th>
                  <th>Actions</th>
                </tr>

              </thead>

              <tbody>

                {filteredParents.length > 0 ? (
                  filteredParents.map(
                    (parent) => (
                      <tr
                        key={
                          parent.id_parent
                        }
                      >

                        <td>
                          <strong>
                            {afficherId(
                              parent.id_parent
                            )}
                          </strong>
                        </td>

                        <td>
                          {parent.nom || "-"}
                        </td>

                        <td>
                          {parent.prenom || "-"}
                        </td>

                        <td>
                          {parent.telephone ||
                            "-"}
                        </td>

                        <td>
                          {parent.email || "-"}
                        </td>

                        <td>
                          {parent.profession ||
                            "-"}
                        </td>

                        <td className="actions-cell">

                          <button
                            className="action-button"
                            title="Actions"
                            onClick={() =>
                              setSelectedParent(
                                selectedParent?.id_parent ===
                                  parent.id_parent
                                  ? null
                                  : parent
                              )
                            }
                          >
                            <MoreVertical
                              size={18}
                            />
                          </button>

                          {selectedParent?.id_parent ===
                            parent.id_parent && (

                            <div className="action-menu">

                              <button
                                onClick={() =>
                                  consulterParent(
                                    parent
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
                                    parent
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
                                  ouvrirLiaison(
                                    parent
                                  )
                                }
                              >
                                <Link size={16} />
                                <span>
                                  Lier à un élève
                                </span>
                              </button>

                              <button
                                className="danger-action"
                                onClick={() =>
                                  demanderSuppression(
                                    parent
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
                        ? "Aucun parent trouvé."
                        : "Aucun parent enregistré."}
                    </td>

                  </tr>
                )}

              </tbody>

            </table>
          )}

        </div>

      </div>

      {/* =================================================
          MODALE AJOUT / MODIFICATION
          ================================================= */}

      {showForm && (

        <div
          className="modal-overlay"
          onClick={fermerFormulaire}
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
                  {parentEnModification
                    ? "Modifier le parent"
                    : "Ajouter un parent"}
                </h2>

                <p>
                  Renseignez les informations
                  du parent.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={fermerFormulaire}
              >
                <X size={20} />
              </button>

            </div>

            <form
              className="parent-form"
              onSubmit={enregistrerParent}
            >

              <div className="form-grid">

                <div className="form-group">

                  <label htmlFor="nom">
                    Nom *
                  </label>

                  <input
                    id="nom"
                    name="nom"
                    type="text"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="prenom">
                    Prénom *
                  </label>

                  <input
                    id="prenom"
                    name="prenom"
                    type="text"
                    value={formData.prenom}
                    onChange={handleChange}
                    required
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="telephone">
                    Téléphone
                  </label>

                  <input
                    id="telephone"
                    name="telephone"
                    type="tel"
                    value={formData.telephone}
                    onChange={handleChange}
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="telephone_secondaire">
                    Téléphone secondaire
                  </label>

                  <input
                    id="telephone_secondaire"
                    name="telephone_secondaire"
                    type="tel"
                    value={
                      formData.telephone_secondaire
                    }
                    onChange={handleChange}
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="email">
                    E-mail
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="profession">
                    Profession
                  </label>

                  <input
                    id="profession"
                    name="profession"
                    type="text"
                    value={formData.profession}
                    onChange={handleChange}
                  />

                </div>

                <div className="form-group full-width">

                  <label htmlFor="adresse">
                    Adresse
                  </label>

                  <textarea
                    id="adresse"
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleChange}
                    rows="3"
                  />

                </div>

              </div>

              <div className="form-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={fermerFormulaire}
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
                    : parentEnModification
                    ? "Enregistrer les modifications"
                    : "Ajouter le parent"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =================================================
          MODALE CONSULTATION
          ================================================= */}

      {parentAConsulter && (

        <div
          className="modal-overlay"
          onClick={() =>
            setParentAConsulter(null)
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
                  Détails du parent
                </h2>

                <p>
                  Informations enregistrées
                  dans le système.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setParentAConsulter(null)
                }
              >
                <X size={20} />
              </button>

            </div>

            <div className="parent-profile">

              <div className="parent-avatar">

                {parentAConsulter.prenom?.charAt(
                  0
                )}

                {parentAConsulter.nom?.charAt(
                  0
                )}

              </div>

              <div>
                <h3>
                  {parentAConsulter.prenom}{" "}
                  {parentAConsulter.nom}
                </h3>

                <span>
                  {afficherId(
                    parentAConsulter.id_parent
                  )}
                </span>
              </div>

            </div>

            <div className="details-grid">

              <div className="detail-item">
                <span>Téléphone</span>
                <strong>
                  {parentAConsulter.telephone ||
                    "-"}
                </strong>
              </div>

              <div className="detail-item">
                <span>
                  Téléphone secondaire
                </span>
                <strong>
                  {parentAConsulter
                    .telephone_secondaire ||
                    "-"}
                </strong>
              </div>

              <div className="detail-item">
                <span>E-mail</span>
                <strong>
                  {parentAConsulter.email ||
                    "-"}
                </strong>
              </div>

              <div className="detail-item">
                <span>Profession</span>
                <strong>
                  {parentAConsulter.profession ||
                    "-"}
                </strong>
              </div>

              <div className="detail-item full-width">
                <span>Adresse</span>
                <strong>
                  {parentAConsulter.adresse ||
                    "-"}
                </strong>
              </div>

            </div>

          </div>

        </div>

      )}

      {/* =================================================
          MODALE LIAISON ÉLÈVE
          ================================================= */}

      {showLinkForm && parentALier && (

        <div
          className="modal-overlay"
          onClick={fermerLiaison}
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
                  Lier un parent à un élève
                </h2>

                <p>
                  {parentALier.prenom}{" "}
                  {parentALier.nom}
                </p>
              </div>

              <button
                className="modal-close"
                onClick={fermerLiaison}
              >
                <X size={20} />
              </button>

            </div>

            <form
              className="parent-form"
              onSubmit={enregistrerLiaison}
            >

              <div className="form-group">

                <label htmlFor="id_eleve">
                  Élève *
                </label>

                <select
                  id="id_eleve"
                  name="id_eleve"
                  value={linkData.id_eleve}
                  onChange={handleLinkChange}
                  required
                >

                  <option value="">
                    Sélectionner un élève
                  </option>

                  {eleves.map((eleve) => (
                    <option
                      key={eleve.id_eleve}
                      value={eleve.id_eleve}
                    >
                      {eleve.prenom}{" "}
                      {eleve.nom} —{" "}
                      {eleve.matricule}
                    </option>
                  ))}

                </select>

              </div>

              <div className="form-group">

                <label htmlFor="lien_parente">
                  Lien de parenté
                </label>

                <select
                  id="lien_parente"
                  name="lien_parente"
                  value={linkData.lien_parente}
                  onChange={handleLinkChange}
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
                  name="est_responsable"
                  checked={
                    linkData.est_responsable
                  }
                  onChange={handleLinkChange}
                />

                <span>
                  Responsable légal
                </span>

              </label>

              <label className="checkbox-row">

                <input
                  type="checkbox"
                  name="est_contact_urgence"
                  checked={
                    linkData.est_contact_urgence
                  }
                  onChange={handleLinkChange}
                />

                <span>
                  Contact d'urgence
                </span>

              </label>

              <div className="form-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={fermerLiaison}
                  disabled={linking}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={linking}
                >
                  {linking
                    ? "Liaison..."
                    : "Lier au parent"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =================================================
          MODALE SUPPRESSION
          ================================================= */}

      {parentASupprimer && (

        <div className="modal-overlay">

          <div className="modal-card delete-modal">

            <div className="delete-icon">
              <Trash2 size={28} />
            </div>

            <h2>
              Supprimer ce parent ?
            </h2>

            <p>
              Vous êtes sur le point de supprimer
              <strong>
                {" "}
                {parentASupprimer.prenom}{" "}
                {parentASupprimer.nom}
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
                  setParentASupprimer(null)
                }
              >
                Annuler
              </button>

              <button
                className="danger-button"
                onClick={confirmerSuppression}
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

export default Parents;