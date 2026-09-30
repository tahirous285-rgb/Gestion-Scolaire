import { useState } from "react";
import { fileToStoredPhoto, photoUrl } from "../../utils/imageFile";

const empty = { matricule: "", nom: "", prenom: "", sexe: "", date_naissance: "", lieu_naissance: "", nationalite: "", adresse: "", telephone: "", email: "", photo: "", actif: true };

/** Formulaire réutilisable pour les intégrations qui préfèrent un formulaire
 * autonome. La page Élèves utilise CrudPage avec exactement les mêmes champs. */
export default function EleveForm({ eleveInitial = null, onClose, onSave, loading = false }) {
  const [form, setForm] = useState(() => ({ ...empty, ...(eleveInitial || {}) }));
  const [photoError, setPhotoError] = useState("");

  function change(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  async function changePhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setPhotoError("");
      const stored = await fileToStoredPhoto(file);
      setForm((current) => ({ ...current, photo: stored }));
    } catch (error) {
      setPhotoError(error.message || "Import impossible.");
    }
  }

  function submit(event) {
    event.preventDefault();
    onSave?.(form);
  }

  const preview = photoUrl(form.photo);

  return (
    <form className="standalone-form" onSubmit={submit}>
      <div className="standalone-form-grid">
        {["matricule", "nom", "prenom", "sexe", "date_naissance", "lieu_naissance", "nationalite", "telephone", "email"].map((name) => (
          <label key={name}>{name.replaceAll("_", " ")} {["matricule", "nom", "prenom"].includes(name) && "*"}<input name={name} type={name === "date_naissance" ? "date" : name === "email" ? "email" : "text"} required={["matricule", "nom", "prenom"].includes(name)} value={form[name] || ""} onChange={change} disabled={loading} /></label>
        ))}
        <label className="standalone-full">
          Photo de l’élève
          {preview ? <img src={preview} alt="Aperçu" width={88} height={88} style={{ width: 88, height: 88, objectFit: "cover", borderRadius: 10, display: "block", margin: "8px 0" }} /> : null}
          <input type="file" accept="image/*" onChange={changePhoto} disabled={loading} />
          {photoError ? <small style={{ color: "#b91c1c" }}>{photoError}</small> : <small>La photo importée est enregistrée dans le dossier de l’élève.</small>}
        </label>
        <label className="standalone-full">Adresse<textarea name="adresse" value={form.adresse} onChange={change} disabled={loading} /></label>
        <label className="crud-check"><input type="checkbox" name="actif" checked={form.actif} onChange={change} disabled={loading} /><span>Élève actif</span></label>
      </div>
      <div className="crud-form-actions"><button className="crud-secondary" type="button" onClick={onClose} disabled={loading}>Annuler</button><button className="crud-primary" type="submit" disabled={loading}>{loading ? "Enregistrement…" : "Enregistrer"}</button></div>
    </form>
  );
}
