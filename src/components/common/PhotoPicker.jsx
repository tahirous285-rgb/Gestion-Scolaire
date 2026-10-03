import { useId, useRef, useState } from "react";
import { fileToStoredPhoto, photoUrl } from "../../utils/imageFile";

export default function PhotoPicker({ value, onChange, disabled = false, onBusyChange }) {
  const input = useRef(null);
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function choose(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || busy) return;
    setBusy(true);
    onBusyChange?.(true);
    setError("");
    try { await onChange(await fileToStoredPhoto(file)); }
    catch (failure) { setError(failure.message || "Import de la photo impossible."); }
    finally { setBusy(false); onBusyChange?.(false); }
  }
  async function remove() {
    setBusy(true); onBusyChange?.(true); setError("");
    try { await onChange(""); }
    catch (failure) { setError(failure.message || "Retrait impossible."); }
    finally { setBusy(false); onBusyChange?.(false); }
  }
  return <div className="crud-image-field">
    {photoUrl(value) ? <img src={photoUrl(value)} alt="Aperçu de la photo élève" className="crud-image-preview" /> : <div className="crud-image-placeholder">Aucune photo</div>}
    <div className="crud-image-actions">
      <input ref={input} id={id} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden disabled={disabled || busy} onChange={choose} />
      <button className="crud-secondary" type="button" disabled={disabled || busy} onClick={() => input.current?.click()}>{busy ? "Préparation…" : "📷 Choisir une photo"}</button>
      {value && <button className="crud-secondary" type="button" disabled={disabled || busy} onClick={remove}>Retirer la photo</button>}
      <small>JPG, PNG, WebP ou GIF · 8 Mo maximum. Conversion en JPEG.</small>
      <small>La photo est conservée dans le champ photo de l’élève après enregistrement, pas dans un fichier storage/eleves/.</small>
      {error && <small role="alert" className="crud-alert">{error}</small>}
    </div>
  </div>;
}
