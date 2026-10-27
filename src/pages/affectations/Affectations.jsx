import { useEffect, useState } from "react";
import { useReferenceOptions } from "../../hooks/useReferenceOptions";
import { getAnnees } from "../../services/anneesApi";
import { getClasses } from "../../services/classesApi";
import { getMatieres } from "../../services/matieresApi";
import { getEnseignants, getClassesOfEnseignant, getMatieresOfEnseignant, linkEnseignantClasse, linkEnseignantMatiere } from "../../services/enseignantsApi";
import { optionsFrom } from "../pageUtils";

const EMPTY_LIST = [];

async function getAllEnseignants() {
  const pageSize = 100;
  const allTeachers = [];
  let skip = 0;
  let page = [];

  do {
    page = await getEnseignants({ skip, limit: pageSize });
    allTeachers.push(...(Array.isArray(page) ? page : []));
    skip += pageSize;
  } while (page.length === pageSize);

  return allTeachers;
}

export default function Affectations() {
  const references = useReferenceOptions({ enseignants: getAllEnseignants, matieres: getMatieres, classes: getClasses, annees: getAnnees }, "affectations");
  const teachers = references.enseignants || EMPTY_LIST;
  const [teacherId, setTeacherId] = useState("");
  const [kind, setKind] = useState("matieres");
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allAssignments, setAllAssignments] = useState([]);
  const [allAssignmentsLoading, setAllAssignmentsLoading] = useState(true);
  const [allAssignmentsError, setAllAssignmentsError] = useState("");
  const [assignmentsRefresh, setAssignmentsRefresh] = useState(0);
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

  useEffect(() => {
    if (!Array.isArray(references.enseignants)) return undefined;
    if (!teachers.length) {
      let active = true;
      Promise.resolve().then(() => {
        if (active) {
          setAllAssignments([]);
          setAllAssignmentsLoading(false);
        }
      });
      return () => { active = false; };
    }

    let active = true;
    Promise.all(teachers.map(async (teacher) => {
      const [matieres, classes] = await Promise.all([
        getMatieresOfEnseignant(teacher.id_enseignant),
        getClassesOfEnseignant(teacher.id_enseignant),
      ]);
      return [
        ...(Array.isArray(matieres) ? matieres.map((link) => ({ ...link, type: "Matière" })) : []),
        ...(Array.isArray(classes) ? classes.map((link) => ({ ...link, type: "Classe" })) : []),
      ];
    }))
      .then((results) => {
        if (active) setAllAssignments(results.flat());
      })
      .catch((requestError) => {
        if (active) {
          setAllAssignments([]);
          setAllAssignmentsError(requestError.message || "Impossible de charger toutes les affectations.");
        }
      })
      .finally(() => {
        if (active) setAllAssignmentsLoading(false);
      });

    return () => { active = false; };
  }, [teachers, references.enseignants, assignmentsRefresh]);

  function change(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  async function submit(event) {
    event.preventDefault(); setError(""); setSuccess("");
    try {
      setAllAssignmentsLoading(true);
      setAllAssignmentsError("");
      const payload = kind === "matieres"
        ? { id_enseignant: Number(teacherId), id_matiere: Number(form.id_matiere), principal: form.principal }
        : { id_enseignant: Number(teacherId), id_classe: Number(form.id_classe), id_annee: Number(form.id_annee), principal: form.principal };
      if (kind === "matieres") await linkEnseignantMatiere(payload); else await linkEnseignantClasse(payload);
      setSuccess("L’affectation a été enregistrée.");
      setAssignmentsRefresh((current) => current + 1);
      const data = kind === "matieres" ? await getMatieresOfEnseignant(teacherId) : await getClassesOfEnseignant(teacherId);
      setLinks(data || []);
      setForm((current) => ({ ...current, id_matiere: "", id_classe: "", id_annee: "", principal: false }));
    } catch (requestError) {
      setAllAssignmentsLoading(false);
      setError(requestError.message || "Affectation impossible.");
    }
  }

  const teacherLabel = teachers.find((teacher) => String(teacher.id_enseignant) === String(teacherId));
  const teacherById = new Map(teachers.map((teacher) => [Number(teacher.id_enseignant), teacher]));
  const subjectById = new Map((references.matieres || []).map((subject) => [Number(subject.id_matiere), subject]));
  const classById = new Map((references.classes || []).map((schoolClass) => [Number(schoolClass.id_classe), schoolClass]));
  const yearById = new Map((references.annees || []).map((year) => [Number(year.id_annee), year]));
  const sortedAssignments = [...allAssignments].sort((left, right) => {
    const leftTeacher = teacherById.get(Number(left.id_enseignant));
    const rightTeacher = teacherById.get(Number(right.id_enseignant));
    const leftName = `${leftTeacher?.nom || ""} ${leftTeacher?.prenom || ""}`;
    const rightName = `${rightTeacher?.nom || ""} ${rightTeacher?.prenom || ""}`;
    return leftName.localeCompare(rightName, "fr") || left.type.localeCompare(right.type, "fr");
  });
  const matiereOptions = optionsFrom(references.matieres, "id_matiere", (row) => `${row.code} — ${row.nom}`);
  const classeOptions = optionsFrom(references.classes, "id_classe", (row) => row.nom);
  const anneeOptions = optionsFrom(references.annees, "id_annee", "libelle");

  return (
    <div className="crud-page">
      <div className="crud-header"><div><div className="crud-eyebrow">Enseignants</div><h1>🔗 Affectations</h1><p>Relations enseignant–matière et enseignant–classe exposées par l’API.</p></div></div>
      {error && <div className="crud-alert">⚠️ {error}</div>}{success && <div className="success-message">✓ {success}</div>}
      <section className="inline-panel">
        <div className="inline-form assignment-selector">
          <label>Enseignant *<select value={teacherId} onChange={(event) => { setTeacherId(event.target.value); setLinks([]); setLoading(Boolean(event.target.value)); setError(""); }} required><option value="">Sélectionner…</option>{teachers.map((row) => <option key={row.id_enseignant} value={row.id_enseignant}>{row.matricule} — {row.nom} {row.prenom}</option>)}</select></label>
          <label>Relation<select value={kind} onChange={(event) => { setKind(event.target.value); setLinks([]); setLoading(Boolean(teacherId)); setError(""); setForm((current) => ({ ...current, id_matiere: "", id_classe: "", id_annee: "" })); }}><option value="matieres">Matière</option><option value="classes">Classe</option></select></label>
        </div>
      </section>
      <section className="crud-table-card assignment-results">
        <div className="inline-panel-heading"><div><h2>Toutes les affectations</h2><p>{allAssignmentsLoading ? "Chargement…" : `${allAssignments.length} affectation(s)`}</p></div></div>
        {allAssignmentsError ? <div className="crud-alert" role="alert">{allAssignmentsError}</div> : allAssignmentsLoading ? <div className="crud-state"><h3>Chargement des affectations…</h3></div> : sortedAssignments.length === 0 ? <div className="crud-state"><h3>Aucune affectation enregistrée</h3></div> : <div className="relation-list">{sortedAssignments.map((link, index) => {
          const teacher = teacherById.get(Number(link.id_enseignant));
          const teacherName = teacher ? `${teacher.nom} ${teacher.prenom}`.trim() : `Enseignant #${link.id_enseignant}`;
          const subject = subjectById.get(Number(link.id_matiere));
          const schoolClass = classById.get(Number(link.id_classe));
          const year = yearById.get(Number(link.id_annee));
          const assignmentName = link.type === "Matière"
            ? subject?.nom || `Matière #${link.id_matiere}`
            : schoolClass?.nom || `Classe #${link.id_classe}`;
          const yearLabel = link.type === "Classe" ? ` · ${year?.libelle || `Année #${link.id_annee}`}` : "";
          return <div className="relation-row" key={`${link.type}-${link.id_enseignant}-${link.id_matiere || `${link.id_classe}-${link.id_annee}`}-${index}`}><span><strong>{teacherName}</strong> · {link.type} : {assignmentName}{yearLabel}</span><span className={`status-badge ${link.principal ? "success" : "neutral"}`}>{link.principal ? "Principale" : "Secondaire"}</span></div>;
        })}</div>}
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
        {!teacherId ? <div className="crud-state"><h3>Sélectionnez un enseignant</h3></div> : links.length === 0 && !loading ? <div className="crud-state"><h3>Aucune affectation</h3></div> : <div className="relation-list">{links.map((link, index) => {
          const subject = subjectById.get(Number(link.id_matiere));
          const schoolClass = classById.get(Number(link.id_classe));
          const year = yearById.get(Number(link.id_annee));
          const label = kind === "matieres"
            ? subject?.nom || `Matière #${link.id_matiere}`
            : `${schoolClass?.nom || `Classe #${link.id_classe}`} · ${year?.libelle || `Année #${link.id_annee}`}`;
          return <div className="relation-row" key={`${kind}-${index}-${link.id_matiere || link.id_classe}`}><span>{label}</span>{link.principal ? <span className="status-badge success">Principale</span> : <span className="status-badge neutral">Secondaire</span>}</div>;
        })}</div>}
      </section>
      <div className="page-note">Cette page gère les relations enseignant–matière et enseignant–classe. L’association directe classe–matière n’est pas proposée ici.</div>
    </div>
  );
}
