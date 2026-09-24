import { useState } from "react";
import CrudPage from "../../components/common/CrudPage";
import { establishmentId } from "../../services/apiClient";
import { createParent, deleteParent, getParents, linkParentToEleve, updateParent } from "../../services/parentsApi";
import { getEleves } from "../../services/elevesApi";
import { useReferenceOptions } from "../../hooks/useReferenceOptions";

const fields = [
  { name: "nom", label: "Nom", required: true },
  { name: "prenom", label: "Prénom", required: true },
  { name: "telephone", label: "Téléphone" },
  { name: "telephone_secondaire", label: "Téléphone secondaire" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "adresse", label: "Adresse", full: true },
  { name: "profession", label: "Profession" },
];

function LinkForm({ parents, eleves }) {
  const [form, setForm] = useState({ id_eleve: "", id_parent: "", lien_parente: "", est_responsable: false, est_contact_urgence: false });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const change = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };
  async function submit(event) {
    event.preventDefault(); setMessage(""); setError(""); setSaving(true);
    try {
      await linkParentToEleve({ ...form, id_eleve: Number(form.id_eleve), id_parent: Number(form.id_parent) });
      setMessage("Le lien parent–élève a été enregistré.");
      setForm({ id_eleve: "", id_parent: "", lien_parente: "", est_responsable: false, est_contact_urgence: false });
    } catch (requestError) { setError(requestError.message || "Création du lien impossible."); }
    finally { setSaving(false); }
  }
  return (
    <section className="inline-panel">
      <div className="inline-panel-heading"><div><div className="crud-eyebrow">Relation exposée par l’API</div><h2>Lier un parent à un élève</h2></div></div>
      {message && <div className="success-message">✓ {message}</div>}
      {error && <div className="crud-alert">⚠️ {error}</div>}
      <form className="inline-form" onSubmit={submit}>
        <label>Élève *<select name="id_eleve" value={form.id_eleve} onChange={change} required><option value="">Sélectionner…</option>{eleves.map((row) => <option key={row.id_eleve} value={row.id_eleve}>{row.matricule} — {row.nom} {row.prenom}</option>)}</select></label>
        <label>Parent *<select name="id_parent" value={form.id_parent} onChange={change} required><option value="">Sélectionner…</option>{parents.map((row) => <option key={row.id_parent} value={row.id_parent}>{row.nom} {row.prenom}</option>)}</select></label>
        <label>Lien de parenté<input name="lien_parente" value={form.lien_parente} onChange={change} /></label>
        <label className="inline-check"><input type="checkbox" name="est_responsable" checked={form.est_responsable} onChange={change} /> Responsable</label>
        <label className="inline-check"><input type="checkbox" name="est_contact_urgence" checked={form.est_contact_urgence} onChange={change} /> Contact d’urgence</label>
        <button className="crud-primary" disabled={saving}>{saving ? "Enregistrement…" : "Lier"}</button>
      </form>
    </section>
  );
}

export default function Parents() {
  const idEtablissement = establishmentId();
  const references = useReferenceOptions({ parents: getParents, eleves: getEleves }, "parents-eleves");
  return (
    <>
      <CrudPage
        title="Parents"
        subtitle="Contacts et responsables des élèves."
        icon="👨‍👩‍👧"
        columns={[{ key: "nom", label: "Nom" }, { key: "prenom", label: "Prénom" }, { key: "telephone", label: "Téléphone" }, { key: "email", label: "E-mail" }, { key: "profession", label: "Profession" }]}
        createFields={fields}
        editFields={fields.map((field) => ({ ...field, required: false }))}
        initialForm={{ id_etablissement: idEtablissement || "", nom: "", prenom: "", telephone: "", telephone_secondaire: "", email: "", adresse: "", profession: "" }}
        load={getParents}
        create={createParent}
        update={updateParent}
        remove={deleteParent}
        createPayload={(data) => ({ ...data, id_etablissement: idEtablissement })}
        rowKey="id_parent"
        createLabel="Nouveau parent"
        searchKeys={["nom", "prenom", "telephone", "email", "profession"]}
        emptyText="Aucun parent enregistré."
      />
      <LinkForm parents={references.parents || []} eleves={references.eleves || []} />
    </>
  );
}
