import { useEffect, useState } from "react";
import { useReferenceOptions } from "../../hooks/useReferenceOptions";
import BackendUnavailable from "../../components/common/BackendUnavailable";
import { getAnnees } from "../../services/anneesApi";
import { getClasses } from "../../services/classesApi";
import { getMatieres } from "../../services/matieresApi";
import { getEnseignants, getClassesOfEnseignant, getMatieresOfEnseignant, linkEnseignantClasse, linkEnseignantMatiere } from "../../services/enseignantsApi";
import { optionsFrom } from "../pageUtils";

export default function Affectations() {
  const references = useReferenceOptions({ enseignants: getEnseignants, matieres: getMatieres, classes: getClasses, annees: getAnnees }, "affectations");
  const teachers = references.enseignants || [];
  const [teacherId, setTeacherId] = useState("");
  const [kind, setKind] = useState("matieres");
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ id_matiere: "", id_classe: "", id_annee: "", principal: false });

  useEffect(() => {
    if (!teacherId) return;
    let active = true;
    const request = kind === "matieres" ? getMatieresOfEnseignant(teacherId) : getClassesOfEnseignant(teacherId);
    request.then((data) => { if (active) setLinks(Array.isArray(data) ? data : []); }).catch((requestError) => { if (active) setError(requestError.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [teacherId, kind]);

  function change(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  async function submit(event) {
    event.preventDefault(); setError(""); setSuccess("");
    try {
      const payload = kind === "matieres"
        ? { id_enseignant: Number(teacherId), id_matiere: Number(form.id_matiere), principal: form.principal }
        : { id_enseignant: Number(teacherId), id_classe: Number(form.id_classe), id_annee: Number(form.id_annee), principal: form.principal };
      if (kind === "matieres") await linkEnseignantMatiere(payload); else await linkEnseignantClasse(payload);
      setSuccess("L’affectation a été enregistrée.");
      const data = kind === "matieres" ? await getMatieresOfEnseignant(teacherId) : await getClassesOfEnseignant(teacherId);
      setLinks(data || []);
      setForm((current) => ({ ...current, id_matiere: "", id_classe: "", id_annee: "", principal: false }));
    } catch (requestError) { setError(requestError.message || "Affectation impossible."); }
  }

  const teacherLabel = teachers.find((teacher) => String(teacher.id_enseignant) === String(teacherId));
  const matiereOptions = optionsFrom(references.matieres, "id_matiere", (row) => `${row.code} — ${row.nom}`);
  const classeOptions = optionsFrom(references.classes, "id_classe", (row) => row.nom);
  const anneeOptions = optionsFrom(references.annees, "id_annee", "libelle");

  return (
    <div className="crud-page">
      <div className="crud-header"><div><div className="crud-eyebrow">Enseignants</div><h1>🔗 Affectations</h1><p>Relations enseignant–matière et enseignant–classe exposées par l’API.</p></div></div>
      <div className="crud-alert info-alert"><span>Une affectation peut être créée et consultée par enseignant. Le backend n’expose pas de suppression ou de modification de ces relations.</span></div>
      {error && <div className="crud-alert">⚠️ {error}</div>}{success && <div className="success-message">✓ {success}</div>}
      <section className="inline-panel">
        <div className="inline-form assignment-selector">
          <label>Enseignant *<select value={teacherId} onChange={(event) => { setTeacherId(event.target.value); setLinks([]); setLoading(Boolean(event.target.value)); setError(""); }} required><option value="">Sélectionner…</option>{teachers.map((row) => <option key={row.id_enseignant} value={row.id_enseignant}>{row.matricule} — {row.nom} {row.prenom}</option>)}</select></label>
          <label>Relation<select value={kind} onChange={(event) => { setKind(event.target.value); setLinks([]); setLoading(Boolean(teacherId)); setError(""); setForm((current) => ({ ...current, id_matiere: "", id_classe: "", id_annee: "" })); }}><option value="matieres">Matière</option><option value="classes">Classe</option></select></label>
        </div>
      </section>
      <section className="inline-panel">
        <div className="inline-panel-heading"><div><div className="crud-eyebrow">{teacherLabel ? `${teacherLabel.nom} ${teacherLabel.prenom}` : "Aucun enseignant sélectionné"}</div><h2>Ajouter une affectation</h2></div></div>
        <form className="inline-form" onSubmit={submit}>
          {kind === "matieres" ? <label>Matière *<select name="id_matiere" value={form.id_matiere} onChange={change} required disabled={!teacherId}><option value="">Sélectionner…</option>{matiereOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label> : <><label>Classe *<select name="id_classe" value={form.id_classe} onChange={change} required disabled={!teacherId}><option value="">Sélectionner…</option>{classeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label>Année scolaire *<select name="id_annee" value={form.id_annee} onChange={change} required disabled={!teacherId}><option value="">Sélectionner…</option>{anneeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label></>}
          <label className="inline-check"><input type="checkbox" name="principal" checked={form.principal} onChange={change} disabled={!teacherId} /> Affectation principale</label>
          <button className="crud-primary" disabled={!teacherId}>Affecter</button>
        </form>
      </section>
      <section className="crud-table-card assignment-results">
        <div className="inline-panel-heading"><div><h2>{kind === "matieres" ? "Matières affectées" : "Classes affectées"}</h2><p>{loading ? "Chargement…" : `${links.length} relation(s)`}</p></div></div>
        {!teacherId ? <div className="crud-state"><h3>Sélectionnez un enseignant</h3></div> : links.length === 0 && !loading ? <div className="crud-state"><h3>Aucune affectation</h3></div> : <div className="relation-list">{links.map((link, index) => <div className="relation-row" key={`${kind}-${index}-${link.id_matiere || link.id_classe}`}><span>{kind === "matieres" ? `Matière #${link.id_matiere}` : `Classe #${link.id_classe} · Année #${link.id_annee}`}</span>{link.principal ? <span className="status-badge success">Principal</span> : <span className="status-badge neutral">Secondaire</span>}</div>)}</div>}
      </section>
      <div className="page-note"><BackendUnavailable>les affectations classe–matière (ClasseMatiere) sont déclarées dans les modèles mais aucun routeur backend ne les expose.</BackendUnavailable></div>
    </div>
  );
}
