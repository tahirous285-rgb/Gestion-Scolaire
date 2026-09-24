import { useState } from "react";
import { X } from "lucide-react";

function ParentForm({
  parentInitial = null,
  onClose,
  onSave,
  loading = false,
}) {
  // =====================================================
  // ÉTAT DU FORMULAIRE
  // =====================================================

  const [formData, setFormData] = useState(() => ({
    nom: parentInitial?.nom || "",
    prenom: parentInitial?.prenom || "",
    telephone: parentInitial?.telephone || "",
    telephone_secondaire: parentInitial?.telephone_secondaire || "",
    email: parentInitial?.email || "",
    adresse: parentInitial?.adresse || "",
    profession: parentInitial?.profession || "",
  }));

  const [errors, setErrors] = useState({});

  // =====================================================
  // CHANGEMENT D'UN CHAMP
  // =====================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((ancien) => ({
      ...ancien,
      [name]: value,
    }));

    // Supprimer l'erreur du champ dès que l'utilisateur
    // recommence à saisir
    if (errors[name]) {
      setErrors((ancien) => ({
        ...ancien,
        [name]: "",
      }));
    }
  };

  // =====================================================
  // VALIDATION
  // =====================================================

  const validateForm = () => {
    const nouvellesErreurs = {};

    if (!formData.nom.trim()) {
      nouvellesErreurs.nom =
        "Le nom est obligatoire.";
    }

    if (!formData.prenom.trim()) {
      nouvellesErreurs.prenom =
        "Le prénom est obligatoire.";
    }

    if (
      formData.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email.trim()
      )
    ) {
      nouvellesErreurs.email =
        "Veuillez saisir une adresse e-mail valide.";
    }

    setErrors(nouvellesErreurs);

    return (
      Object.keys(nouvellesErreurs).length === 0
    );
  };

  // =====================================================
  // SOUMISSION
  // =====================================================

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const donnees = {
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

    onSave(donnees);
  };

  // =====================================================
  // AFFICHAGE
  // =====================================================

  return (
    <div
      className="modal-overlay"
      onClick={() => {
        if (!loading) {
          onClose();
        }
      }}
    >
      <div
        className="modal-card"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* ============================================
            EN-TÊTE
            ============================================ */}

        <div className="modal-header">
          <div>
            <h2>
              {parentInitial
                ? "Modifier le parent"
                : "Ajouter un parent"}
            </h2>

            <p>
              {parentInitial
                ? "Modifiez les informations du parent."
                : "Renseignez les informations du parent."}
            </p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={loading}
            title="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* ============================================
            FORMULAIRE
            ============================================ */}

        <form
          className="parent-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="form-grid">
            {/* NOM */}

            <div className="form-group">
              <label htmlFor="parent-nom">
                Nom *
              </label>

              <input
                id="parent-nom"
                name="nom"
                type="text"
                placeholder="Ex. TRAORÉ"
                value={formData.nom}
                onChange={handleChange}
                disabled={loading}
                className={
                  errors.nom ? "input-error" : ""
                }
              />

              {errors.nom && (
                <small className="field-error">
                  {errors.nom}
                </small>
              )}
            </div>

            {/* PRÉNOM */}

            <div className="form-group">
              <label htmlFor="parent-prenom">
                Prénom *
              </label>

              <input
                id="parent-prenom"
                name="prenom"
                type="text"
                placeholder="Ex. Amadou"
                value={formData.prenom}
                onChange={handleChange}
                disabled={loading}
                className={
                  errors.prenom
                    ? "input-error"
                    : ""
                }
              />

              {errors.prenom && (
                <small className="field-error">
                  {errors.prenom}
                </small>
              )}
            </div>

            {/* TÉLÉPHONE */}

            <div className="form-group">
              <label htmlFor="parent-telephone">
                Téléphone
              </label>

              <input
                id="parent-telephone"
                name="telephone"
                type="tel"
                placeholder="Ex. 70 00 00 00"
                value={formData.telephone}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {/* TÉLÉPHONE SECONDAIRE */}

            <div className="form-group">
              <label htmlFor="parent-telephone-secondaire">
                Téléphone secondaire
              </label>

              <input
                id="parent-telephone-secondaire"
                name="telephone_secondaire"
                type="tel"
                placeholder="Ex. 76 00 00 00"
                value={
                  formData.telephone_secondaire
                }
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {/* EMAIL */}

            <div className="form-group">
              <label htmlFor="parent-email">
                E-mail
              </label>

              <input
                id="parent-email"
                name="email"
                type="email"
                placeholder="Ex. parent@email.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                className={
                  errors.email
                    ? "input-error"
                    : ""
                }
              />

              {errors.email && (
                <small className="field-error">
                  {errors.email}
                </small>
              )}
            </div>

            {/* PROFESSION */}

            <div className="form-group">
              <label htmlFor="parent-profession">
                Profession
              </label>

              <input
                id="parent-profession"
                name="profession"
                type="text"
                placeholder="Ex. Enseignant"
                value={formData.profession}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {/* ADRESSE */}

            <div className="form-group full-width">
              <label htmlFor="parent-adresse">
                Adresse
              </label>

              <textarea
                id="parent-adresse"
                name="adresse"
                rows="4"
                placeholder="Adresse complète du parent..."
                value={formData.adresse}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          {/* ==========================================
              ACTIONS
              ========================================== */}

          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading
                ? "Enregistrement..."
                : parentInitial
                ? "Enregistrer les modifications"
                : "Ajouter le parent"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ParentForm;