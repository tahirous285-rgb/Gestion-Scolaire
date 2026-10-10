import { useRef, useState } from "react";
import { fileToStoredPhoto, photoUrl, PHOTO_ACCEPT } from "../../utils/imageFile";
import "./EleveForm.css";

const empty = { matricule: "", nom: "", prenom: "", sexe: "", date_naissance: "", lieu_naissance: "", nationalite: "", adresse: "", telephone: "", email: "", photo: "", actif: true };

/**
 * Formulaire réutilisable pour les intégrations qui préfèrent un formulaire
 * autonome. La photo reste une chaîne (data URL JPEG) dans le champ `photo`.
 */
export default function EleveForm({ eleveInitial = null, onClose, onSave, loading = false }) {
  const [form, setForm] = useState(() => ({ ...empty, ...(eleveInitial || {}) }));
  const [photoError, setPhotoError] = useState("");
  const [readingPhoto, setReadingPhoto] = useState(false);
  const photoInputRef = useRef(null);
  const photoReadRequestRef = useRef(0);
  const photoReadInProgressRef = useRef(false);

  function change(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  async function changePhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const requestId = ++photoReadRequestRef.current;
    photoReadInProgressRef.current = true;
    setReadingPhoto(true);
    setPhotoError("");
    try {
      const stored = await fileToStoredPhoto(file);
      if (requestId === photoReadRequestRef.current) {
        setForm((current) => ({ ...current, photo: stored }));
      }
    } catch (error) {
      if (requestId === photoReadRequestRef.current) {
        setPhotoError(error.message || "Import impossible.");
      }
    } finally {
      if (requestId === photoReadRequestRef.current) {
        photoReadInProgressRef.current = false;
        setReadingPhoto(false);
      }
    }
  }

  function clearPhoto() {
    photoReadRequestRef.current += 1;
    photoReadInProgressRef.current = false;
    setReadingPhoto(false);
    setPhotoError("");
    setForm((current) => ({ ...current, photo: "" }));
  }

  function submit(event) {
    event.preventDefault();
    if (photoReadInProgressRef.current) {
      setPhotoError("Attendez la fin du traitement de la photo avant d’enregistrer.");
      return;
    }
    onSave?.(form);
  }

  const preview = photoUrl(form.photo);

  return (
    <form className="standalone-form" onSubmit={submit}>
      <div className="standalone-form-grid">
        {["matricule", "nom", "prenom", "sexe", "date_naissance", "lieu_naissance", "nationalite", "telephone", "email"].map((name) => (
          <label key={name}>{name.replaceAll("_", " ")} {["matricule", "nom", "prenom"].includes(name) && "*"}<input name={name} type={name === "date_naissance" ? "date" : name === "email" ? "email" : "text"} required={["matricule", "nom", "prenom"].includes(name)} value={form[name] || ""} onChange={change} disabled={loading || readingPhoto} /></label>
        ))}
        <div className="standalone-full standalone-photo-field">
          <span className="standalone-photo-label">Photo de l’élève</span>
          {preview ? <img src={preview} alt="Aperçu de la photo de l’élève" width={88} height={88} className="standalone-photo-preview" /> : <div className="standalone-photo-placeholder">Aucune photo</div>}
          <input
            ref={photoInputRef}
            className="standalone-photo-input"
            id="eleve-photo"
            type="file"
            accept={PHOTO_ACCEPT}
            aria-label="Choisir une photo"
            onChange={changePhoto}
            disabled={loading || readingPhoto}
          />
          <div className="standalone-photo-actions">
            <button type="button" className="crud-secondary" onClick={() => photoInputRef.current?.click()} disabled={loading || readingPhoto}>
              {readingPhoto ? "Traitement…" : preview ? "Remplacer la photo" : "Choisir une photo"}
            </button>
            {preview && <button type="button" className="crud-secondary" onClick={clearPhoto} disabled={loading || readingPhoto}>Retirer la photo</button>}
          </div>
          {photoError ? <small className="standalone-photo-error" role="alert">{photoError}</small> : <small className="standalone-photo-help">JPG, PNG, WebP, GIF ou BMP, 8 Mo maximum. La photo optimisée est envoyée comme data URL dans le champ `photo`; aucun fichier physique n’est enregistré dans storage/eleves/.</small>}
        </div>
        <label className="standalone-full">Adresse<textarea name="adresse" value={form.adresse} onChange={change} disabled={loading || readingPhoto} /></label>
        <label className="crud-check"><input type="checkbox" name="actif" checked={form.actif} onChange={change} disabled={loading || readingPhoto} /><span>Élève actif</span></label>
      </div>
      <div className="crud-form-actions"><button className="crud-secondary" type="button" onClick={onClose} disabled={loading || readingPhoto}>Annuler</button><button className="crud-primary" type="submit" disabled={loading || readingPhoto}>{loading ? "Enregistrement…" : readingPhoto ? "Traitement de la photo…" : "Enregistrer"}</button></div>
    </form>
  );
}
