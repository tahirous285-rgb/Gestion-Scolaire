import { useEffect, useState } from "react";
import { X } from "lucide-react";

function EleveForm({
  eleveInitial = null,
  onClose,
  onSave,
  loading = false,
}) {
  const [formData, setFormData] = useState({
    matricule: "",
    nom: "",
    prenom: "",
    sexe: "",
    date_naissance: "",
    lieu_naissance: "",
    nationalite: "",
    adresse: "",
    telephone: "",
    email: "",
    photo: "",
    actif: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (eleveInitial) {
      setFormData({
        matricule: eleveInitial.matricule || "",
        nom: eleveInitial.nom || "",
        prenom: eleveInitial.prenom || "",
        sexe: eleveInitial.sexe || "",
        date_naissance:
          eleveInitial.date_naissance || "",
        lieu_naissance:
          eleveInitial.lieu_naissance || "",
        nationalite:
          eleveInitial.nationalite || "",
        adresse:
          eleveInitial.adresse || "",
        telephone:
          eleveInitial.telephone || "",
        email:
          eleveInitial.email || "",
        photo:
          eleveInitial.photo || "",
        actif:
          eleveInitial.actif ?? true,
      });
    } else {
      setFormData({
        matricule: "",
        nom: "",
        prenom: "",
        sexe: "",
        date_naissance: "",
        lieu_naissance: "",
        nationalite: "",
        adresse: "",
        telephone: "",
        email: "",
        photo: "",
        actif: true,
      });
    }

    setErrors({});
  }, [eleveInitial]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((ancien) => ({
      ...ancien,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((ancien) => ({
        ...ancien,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const nouvellesErreurs = {};

    if (!formData.matricule.trim()) {
      nouvellesErreurs.matricule =
        "Le matricule est obligatoire.";
    }

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
        "L'adresse e-mail est invalide.";
    }

    setErrors(nouvellesErreurs);

    return (
      Object.keys(nouvellesErreurs).length === 0
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const donnees = {
      matricule: formData.matricule.trim(),
      nom: formData.nom.trim(),
      prenom: formData.prenom.trim(),
      sexe: formData.sexe || null,
      date_naissance:
        formData.date_naissance || null,
      lieu_naissance:
        formData.lieu_naissance.trim() || null,
      nationalite:
        formData.nationalite.trim() || null,
      adresse:
        formData.adresse.trim() || null,
      telephone:
        formData.telephone.trim() || null,
      email:
        formData.email.trim() || null,
      photo:
        formData.photo.trim() || null,
      actif: formData.actif,
    };

    onSave(donnees);
  };

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
        <div className="modal-header">
          <div>
            <h2>
              {eleveInitial
                ? "Modifier l'élève"
                : "Ajouter un élève"}
            </h2>

            <p>
              Informations personnelles de
              l'élève.
            </p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <form
          className="student-form"
          onSubmit={handleSubmit}
        >
          <div className="form-grid">

            <div className="form-group">
              <label htmlFor="matricule">
                Matricule *
              </label>

              <input
                id="matricule"
                name="matricule"
                value={formData.matricule}
                onChange={handleChange}
                disabled={loading}
                placeholder="Ex. ELV001"
              />

              {errors.matricule && (
                <small className="field-error">
                  {errors.matricule}
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="nom">
                Nom *
              </label>

              <input
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                disabled={loading}
              />

              {errors.nom && (
                <small className="field-error">
                  {errors.nom}
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="prenom">
                Prénom *
              </label>

              <input
                id="prenom"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                disabled={loading}
              />

              {errors.prenom && (
                <small className="field-error">
                  {errors.prenom}
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="sexe">
                Sexe
              </label>

              <select
                id="sexe"
                name="sexe"
                value={formData.sexe}
                onChange={handleChange}
                disabled={loading}
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

            <div className="form-group">
              <label htmlFor="date_naissance">
                Date de naissance
              </label>

              <input
                id="date_naissance"
                name="date_naissance"
                type="date"
                value={
                  formData.date_naissance
                }
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="lieu_naissance">
                Lieu de naissance
              </label>

              <input
                id="lieu_naissance"
                name="lieu_naissance"
                value={
                  formData.lieu_naissance
                }
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="nationalite">
                Nationalité
              </label>

              <input
                id="nationalite"
                name="nationalite"
                value={formData.nationalite}
                onChange={handleChange}
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
              />

              {errors.email && (
                <small className="field-error">
                  {errors.email}
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="photo">
                Photo
              </label>

              <input
                id="photo"
                name="photo"
                type="text"
                value={formData.photo}
                onChange={handleChange}
                disabled={loading}
                placeholder="URL ou chemin de la photo"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="adresse">
                Adresse
              </label>

              <textarea
                id="adresse"
                name="adresse"
                rows="3"
                value={formData.adresse}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

          </div>

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
                : eleveInitial
                ? "Enregistrer les modifications"
                : "Ajouter l'élève"}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}

export default EleveForm;