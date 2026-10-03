import { useState } from "react";
import PhotoPicker from "../../components/common/PhotoPicker";

const empty = { matricule: "", nom: "", prenom: "", sexe: "", date_naissance: "", lieu_naissance: "", nationalite: "", adresse: "", telephone: "", email: "", photo: "", actif: true };

/** Formulaire réutilisable pour les intégrations qui préfèrent un formulaire
 * autonome. La page Élèves utilise CrudPage avec exactement les mêmes champs. */
export default function EleveForm({ eleveInitial = null, onClose, onSave, loading = false }) {
  const [form, setForm] = useState(() => ({ ...empty, ...(eleveInitial || {}) }));
  const [photoBusy, setPhotoBusy] = useState(false);

  function change(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function submit(event) {
    event.preventDefault();
    if (!loading && !photoBusy) onSave?.(form);
  }


  return (
    <form className="standalone-form" onSubmit={submit}>
      <div className="standalone-form-grid">
        {["matricule", "nom", "prenom", "sexe", "date_naissance", "lieu_naissance", "nationalite", "telephone", "email"].map((name) => (
          <label key={name}>{name.replaceAll("_", " ")} {["matricule", "nom", "prenom"].includes(name) && "*"}<input name={name} type={name === "date_naissance" ? "date" : name === "email" ? "email" : "text"} required={["matricule", "nom", "prenom"].includes(name)} value={form[name] || ""} onChange={change} disabled={loading || photoBusy} /></label>
        ))}
        <div className="standalone-full"><span>Photo de l’élève</span><PhotoPicker value={form.photo} disabled={loading || photoBusy} onBusyChange={setPhotoBusy} onChange={(photo) => setForm((current) => ({ ...current, photo }))} /></div>
        <label className="standalone-full">Adresse<textarea name="adresse" value={form.adresse} onChange={change} disabled={loading || photoBusy} /></label>
        <label className="crud-check"><input type="checkbox" name="actif" checked={form.actif} onChange={change} disabled={loading || photoBusy} /><span>Élève actif</span></label>
      </div>
      <div className="crud-form-actions"><button className="crud-secondary" type="button" onClick={onClose} disabled={loading || photoBusy}>Annuler</button><button className="crud-primary" type="submit" disabled={loading || photoBusy}>{loading ? "Enregistrement…" : "Enregistrer"}</button></div>
    </form>
  );
}
