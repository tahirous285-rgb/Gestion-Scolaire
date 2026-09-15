import { useState } from "react";
import { X, Save } from "lucide-react";
import "./EleveForm.css";

function EleveForm({ eleveInitial = null, onClose, onSave }) {
  const [formData, setFormData] = useState({
    matricule: eleveInitial?.matricule || "",
    nom: eleveInitial?.nom || "",
    prenom: eleveInitial?.prenom || "",
    sexe: eleveInitial?.sexe || "",
    date_naissance: eleveInitial?.date_naissance || "",
    lieu_naissance: eleveInitial?.lieu_naissance || "",
    nationalite: eleveInitial?.nationalite || "Malienne",
    adresse: eleveInitial?.adresse || "",
    telephone: eleveInitial?.telephone || "",
    email: eleveInitial?.email || "",
    photo: eleveInitial?.photo || null,
    actif: eleveInitial?.actif ?? true,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((previous) => ({
        ...previous,
        photo: "Veuillez sélectionner une image.",
      }));
      return;
    }

    const imageUrl = URL.createObjectURL(file);

    setFormData((previous) => ({
      ...previous,
      photo: imageUrl,
    }));

    setErrors((previous) => ({
      ...previous,
      photo: "",
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.matricule.trim()) {
      newErrors.matricule = "Le matricule est obligatoire.";
    }

    if (!formData.nom.trim()) {
      newErrors.nom = "Le nom est obligatoire.";
    }

    if (!formData.prenom.trim()) {
      newErrors.prenom = "Le prénom est obligatoire.";
    }

    if (!formData.sexe) {
      newErrors.sexe = "Le sexe est obligatoire.";
    }

    if (!formData.date_naissance) {
      newErrors.date_naissance =
        "La date de naissance est obligatoire.";
    }

    if (
      formData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      newErrors.email = "Adresse email invalide.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) return;

    onSave({
      ...formData,
      nom: formData.nom.trim().toUpperCase(),
      prenom: formData.prenom.trim(),
    });
  };

  return (
    <div className="form-overlay">
      <div className="form-card">

        <div className="form-header">
          <div>
            <h2>
              {eleveInitial
                ? "Modifier l'élève"
                : "Ajouter un élève"}
            </h2>

            <p>
              Renseignez les informations de l'élève.
            </p>
          </div>

          <button
            type="button"
            className="form-close"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="form-grid">

            <div className="form-group">
              <label>Matricule *</label>

              <input
                name="matricule"
                value={formData.matricule}
                onChange={handleChange}
                placeholder="Ex. ELV005"
              />

              {errors.matricule && (
                <small>{errors.matricule}</small>
              )}
            </div>

            <div className="form-group">
              <label>Nom *</label>

              <input
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                placeholder="Nom"
              />

              {errors.nom && (
                <small>{errors.nom}</small>
              )}
            </div>

            <div className="form-group">
              <label>Prénom *</label>

              <input
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                placeholder="Prénom"
              />

              {errors.prenom && (
                <small>{errors.prenom}</small>
              )}
            </div>

            <div className="form-group">
              <label>Sexe *</label>

              <select
                name="sexe"
                value={formData.sexe}
                onChange={handleChange}
              >
                <option value="">Sélectionner</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>

              {errors.sexe && (
                <small>{errors.sexe}</small>
              )}
            </div>

            <div className="form-group">
              <label>Date de naissance *</label>

              <input
                type="date"
                name="date_naissance"
                value={formData.date_naissance}
                onChange={handleChange}
              />

              {errors.date_naissance && (
                <small>{errors.date_naissance}</small>
              )}
            </div>

            <div className="form-group">
              <label>Lieu de naissance</label>

              <input
                name="lieu_naissance"
                value={formData.lieu_naissance}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Nationalité</label>

              <input
                name="nationalite"
                value={formData.nationalite}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Téléphone</label>

              <input
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group full-width">
              <label>Email</label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />

              {errors.email && (
                <small>{errors.email}</small>
              )}
            </div>

            <div className="form-group full-width">
              <label>Adresse</label>

              <textarea
                name="adresse"
                value={formData.adresse}
                onChange={handleChange}
                rows="3"
              />
            </div>

            <div className="form-group full-width">
              <label>Photo</label>

              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
              />

              {errors.photo && (
                <small>{errors.photo}</small>
              )}

              {formData.photo && (
                <img
                  className="photo-preview"
                  src={formData.photo}
                  alt="Aperçu"
                />
              )}
            </div>

          </div>

          <div className="form-footer">

            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Annuler
            </button>

            <button
              type="submit"
              className="primary-button"
            >
              <Save size={17} />
              {eleveInitial ? "Enregistrer" : "Ajouter"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}

export default EleveForm;
