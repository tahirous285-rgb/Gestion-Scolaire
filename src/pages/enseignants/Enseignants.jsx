import { useState } from "react";
import { Plus, X } from "lucide-react";
import CrudPage from "../../components/common/CrudPage";
import { establishmentId } from "../../services/apiClient";
import { createEnseignant, deleteEnseignant, getEnseignants, updateEnseignant } from "../../services/enseignantsApi";
import { formatDate, formatMoney } from "../pageUtils";
import "./Enseignants.css";

const createFields = [
  { name: "nom", label: "Nom", required: true },
  { name: "prenom", label: "Prénom", required: true },
  { name: "sexe", label: "Sexe", type: "select", options: [{ value: "Masculin", label: "Masculin" }, { value: "Féminin", label: "Féminin" }] },
  { name: "date_naissance", label: "Date de naissance", type: "date" },
  { name: "telephone", label: "Téléphone", type: "tel" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "adresse", label: "Adresse", full: true },
  { name: "date_embauche", label: "Date d’embauche", type: "date" },
  { name: "type_contrat", label: "Type de contrat", type: "select", options: [{ value: "Permanent", label: "Permanent" }, { value: "CDD", label: "CDD" }, { value: "Vacataire", label: "Vacataire" }] },
  { name: "statut", label: "Statut professionnel", type: "select", default: "actif", options: [{ value: "actif", label: "Actif" }, { value: "inactif", label: "Inactif" }] },
  { name: "taux_horaire", label: "Taux horaire (FCFA)", type: "number", min: 0, step: "0.01", help: "À renseigner seulement si l’enseignant est rémunéré à l’heure." },
  { name: "actif", label: "Compte / fiche actif", type: "checkbox" },
];

const initialForm = {
  nom: "", prenom: "", sexe: "", date_naissance: "", telephone: "", email: "", adresse: "",
  date_embauche: "", type_contrat: "Permanent", statut: "actif", taux_horaire: "", actif: true,
};

function TeacherCreateForm({ open, onClose, onCreated, idEtablissement }) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  function change(event) {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createEnseignant({
        ...form,
        id_etablissement: idEtablissement,
        taux_horaire: form.taux_horaire === "" ? null : Number(form.taux_horaire),
      });
      setForm(initialForm);
      onCreated();
    } catch (requestError) {
      setError(requestError?.message || "La création de l’enseignant a échoué.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="crud-overlay teacher-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose()}>
      <section className="crud-modal teacher-modal" role="dialog" aria-modal="true" aria-labelledby="teacher-form-title">
        <div className="crud-modal-head">
          <div><div className="crud-eyebrow">NOUVEAU DOSSIER</div><h2 id="teacher-form-title">Ajouter un enseignant</h2><p>Renseignez les informations du nouvel enseignant.</p></div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Fermer"><X size={18} /></button>
        </div>
        <form className="crud-form teacher-form" onSubmit={submit}>
          {error && <div className="crud-alert" role="alert">{error}</div>}
          <section className="teacher-form-section">
            <h3><span>1</span>Informations personnelles</h3>
            <div className="crud-form-grid">
              <div className="crud-field"><label htmlFor="teacher-matricule">Matricule *</label><input id="teacher-matricule" value="Généré automatiquement" readOnly aria-describedby="teacher-matricule-help" /><small id="teacher-matricule-help">Un matricule unique sera attribué à l’enregistrement.</small></div>
              {createFields.slice(0, 4).map((field) => <TeacherField key={field.name} field={field} form={form} onChange={change} />)}
            </div>
          </section>
          <section className="teacher-form-section">
            <h3><span>2</span>Coordonnées</h3>
            <div className="crud-form-grid">{createFields.slice(4, 7).map((field) => <TeacherField key={field.name} field={field} form={form} onChange={change} />)}</div>
          </section>
          <section className="teacher-form-section">
            <h3><span>3</span>Informations professionnelles</h3>
            <div className="crud-form-grid">{createFields.slice(7, 10).map((field) => <TeacherField key={field.name} field={field} form={form} onChange={change} />)}</div>
          </section>
          <section className="teacher-form-section">
            <h3><span>4</span>Rémunération</h3>
            <div className="crud-form-grid">{createFields.slice(10, 11).map((field) => <TeacherField key={field.name} field={field} form={form} onChange={change} />)}</div>
          </section>
          <section className="teacher-form-section teacher-active-section">
            <div className="crud-form-grid">{createFields.slice(11).map((field) => <TeacherField key={field.name} field={field} form={form} onChange={change} />)}</div>
          </section>
          <div className="crud-form-actions">
            <button className="crud-secondary" type="button" onClick={onClose} disabled={saving}>Annuler</button>
            <button className="crud-primary" type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function TeacherField({ field, form, onChange }) {
  return (
    <div className={`crud-field${field.full ? " full" : ""}`}>
      {field.type === "checkbox" ? (
        <label className="crud-check"><input name={field.name} type="checkbox" checked={Boolean(form[field.name])} onChange={onChange} /><span>{field.label}<small>{field.name === "actif" ? "Autoriser son utilisation dans les opérations courantes." : ""}</small><strong>{form[field.name] ? "Actif" : "Inactif"}</strong></span></label>
      ) : (
        <>
          <label htmlFor={`teacher-${field.name}`}>{field.label}{field.required ? " *" : ""}</label>
          {field.type === "select" ? (
            <select id={`teacher-${field.name}`} name={field.name} value={form[field.name]} onChange={onChange} required={field.required}>
              <option value="">Sélectionner…</option>
              {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          ) : (
            <input id={`teacher-${field.name}`} name={field.name} type={field.type || "text"} value={form[field.name]} onChange={onChange} required={field.required} min={field.min} step={field.step} />
          )}
          {field.help && <small className="crud-field-help">{field.help}</small>}
        </>
      )}
    </div>
  );
}

export default function Enseignants() {
  const idEtablissement = establishmentId();
  const [formOpen, setFormOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  return (
    <>
    <CrudPage
      title="Enseignants"
      subtitle="Dossier des enseignants et intervenants."
      icon="🧑‍🏫"
      columns={[
        { key: "matricule", label: "Matricule" }, { key: "nom", label: "Nom" }, { key: "prenom", label: "Prénom" },
        { key: "sexe", label: "Sexe" }, { key: "email", label: "E-mail" }, { key: "actif", label: "Fiche", render: (row) => row.actif ? "Active" : "Inactive" },
        { key: "type_contrat", label: "Contrat" }, { key: "telephone", label: "Téléphone" }, { key: "taux_horaire", label: "Taux horaire", render: (row) => formatMoney(row.taux_horaire) },
        { key: "date_embauche", label: "Embauche", render: (row) => formatDate(row.date_embauche) }, { key: "statut", label: "Statut" },
      ]}
      createFields={createFields}
      editFields={createFields.map((field) => ({ ...field, required: false }))}
      initialForm={initialForm}
      load={getEnseignants}
      pagination={{ pageSize: 100 }}
      canCreate={false}
      update={updateEnseignant}
      remove={deleteEnseignant}
      rowKey="id_enseignant"
      toolbarActions={<button className="crud-primary teacher-toolbar-add" type="button" onClick={() => setFormOpen(true)}><Plus size={17} /> Ajouter un enseignant</button>}
      searchKeys={["matricule", "nom", "prenom", "telephone", "email", "statut", "type_contrat"]}
      emptyText="Aucun enseignant enregistré."
      refreshTrigger={refreshTrigger}
    />
    <TeacherCreateForm open={formOpen} idEtablissement={idEtablissement} onClose={() => setFormOpen(false)} onCreated={() => { setFormOpen(false); setRefreshTrigger((value) => value + 1); }} />
    </>
  );
}
