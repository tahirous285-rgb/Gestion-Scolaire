import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, CheckCircle2, Clock3, Plus, Search, Users } from "lucide-react";
import { useReferenceOptions } from "../../hooks/useReferenceOptions";
import { getAnnees } from "../../services/anneesApi";
import { getClasses } from "../../services/classesApi";
import { getEleves } from "../../services/elevesApi";
import { createInscription, getInscriptions, updateInscription } from "../../services/inscriptionsApi";
import { optionsFrom } from "../pageUtils";
import "./Inscriptions.css";

const initialForm = {
  id_eleve: "",
  id_annee: "",
  id_classe: "",
  numero_inscription: "",
  date_inscription: new Date().toISOString().slice(0, 10),
  statut: "active",
  redoublant: false,
  observation: "",
};
const emptyList = [];

function inscriptionStatus(status) {
  const normalized = String(status || "").toLocaleLowerCase();
  if (["active", "validee", "validée", "valide", "validé"].includes(normalized)) {
    return { label: "Validée", tone: "success" };
  }
  if (["en_attente", "en attente", "pending", "attente"].includes(normalized)) {
    return { label: "En attente", tone: "warning" };
  }
  return { label: status || "À traiter", tone: "neutral" };
}

function InscriptionForm({ fields, form, onChange, onClose, onSubmit, saving, error }) {
  return (
    <div className="crud-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="crud-modal inscription-modal" role="dialog" aria-modal="true" aria-labelledby="inscription-modal-title">
        <div className="crud-modal-head">
          <div>
            <h2 id="inscription-modal-title">Nouvelle inscription</h2>
            <p>Rattachez un élève à une année scolaire et une classe.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer">×</button>
        </div>
        <form className="crud-form" onSubmit={onSubmit}>
          {error && <div className="crud-alert" role="alert">{error}</div>}
          <div className="crud-form-grid">
            {fields.map((field) => (
              <div className={`crud-field${field.full ? " full" : ""}`} key={field.name}>
                {field.type === "checkbox" ? (
                  <label className="crud-check">
                    <input name={field.name} type="checkbox" checked={Boolean(form[field.name])} onChange={onChange} />
                    <span>{field.label}</span>
                  </label>
                ) : (
                  <>
                    <label htmlFor={`inscription-${field.name}`}>{field.label}{field.required ? " *" : ""}</label>
                    {field.type === "select" ? (
                      <select id={`inscription-${field.name}`} name={field.name} value={form[field.name]} onChange={onChange} required={field.required}>
                        <option value="">Sélectionner…</option>
                        {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    ) : field.type === "textarea" ? (
                      <textarea id={`inscription-${field.name}`} name={field.name} value={form[field.name]} onChange={onChange} rows={3} />
                    ) : (
                      <input id={`inscription-${field.name}`} name={field.name} type={field.type || "text"} value={form[field.name]} onChange={onChange} required={field.required} />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="crud-form-actions">
            <button className="crud-secondary" type="button" onClick={onClose} disabled={saving}>Annuler</button>
            <button className="crud-primary" type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Créer l’inscription"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function Inscriptions() {
  const references = useReferenceOptions({ eleves: () => getEleves({ limit: 1000 }), annees: getAnnees, classes: getClasses }, "inscriptions-references");
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedYearId, setSelectedYearId] = useState("");
  const [form, setForm] = useState(initialForm);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [transferRow, setTransferRow] = useState(null);
  const [transferClassId, setTransferClassId] = useState("");
  const [transferSaving, setTransferSaving] = useState(false);
  const [transferError, setTransferError] = useState("");
  const [transferSuccess, setTransferSuccess] = useState("");

  const years = references.annees || emptyList;
  const classes = references.classes || emptyList;
  const students = references.eleves || emptyList;
  const yearOptions = useMemo(() => optionsFrom(years, "id_annee", "libelle"), [years]);
  const classOptions = useMemo(() => optionsFrom(classes, "id_classe", "nom"), [classes]);
  const studentOptions = useMemo(() => optionsFrom(students, "id_eleve", (item) => `${item.prenom} ${item.nom} — ${item.matricule}`), [students]);
  const activeYear = years.find((year) => String(year.id_annee) === selectedYearId)
    || years.find((year) => String(year.statut).toLocaleLowerCase() === "active")
    || years[0]
    || null;

  const loadInscriptions = useCallback(() => getInscriptions()
    .then((data) => {
      setInscriptions(data);
      setLoadError("");
    })
    .catch((error) => {
      setLoadError(error?.message || "Impossible de charger les inscriptions.");
    })
    .finally(() => setLoading(false)), []);

  useEffect(() => {
    loadInscriptions();
  }, [loadInscriptions]);

  const studentById = useMemo(() => new Map(students.map((item) => [String(item.id_eleve), item])), [students]);
  const classById = useMemo(() => new Map(classes.map((item) => [String(item.id_classe), item])), [classes]);
  const yearById = useMemo(() => new Map(years.map((item) => [String(item.id_annee), item])), [years]);
  const earlierStudentIds = useMemo(() => new Set(
    inscriptions.filter((item) => {
      const earlierYear = yearById.get(String(item.id_annee));
      return earlierYear && activeYear && earlierYear.date_debut < activeYear.date_debut;
    }).map((item) => String(item.id_eleve)),
  ), [inscriptions, yearById, activeYear]);
  const rows = useMemo(() => inscriptions.filter((item) => Number(item.id_annee) === Number(activeYear?.id_annee)).map((item) => {
    const student = studentById.get(String(item.id_eleve));
    const schoolClass = classById.get(String(item.id_classe));
    return {
      ...item,
      student,
      studentName: student ? `${student.prenom} ${student.nom}` : `Élève #${item.id_eleve}`,
      matricule: student?.matricule || item.numero_inscription || "—",
      className: schoolClass ? `${schoolClass.niveau && !schoolClass.nom.toLocaleLowerCase().includes(schoolClass.niveau.toLocaleLowerCase()) ? `${schoolClass.niveau} ` : ""}${schoolClass.nom}` : `Classe #${item.id_classe}`,
      typeLabel: item.redoublant ? "Redoublante" : earlierStudentIds.has(String(item.id_eleve)) ? "Ancien" : "Nouveau",
      status: inscriptionStatus(item.statut),
    };
  }), [inscriptions, activeYear, studentById, classById, earlierStudentIds]);
  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return rows;
    return rows.filter((row) => [row.studentName, row.matricule, row.className, row.typeLabel, row.status.label]
      .some((value) => String(value).toLocaleLowerCase().includes(normalizedQuery)));
  }, [rows, query]);
  const validatedCount = rows.filter((row) => row.status.tone === "success").length;
  const pendingCount = rows.filter((row) => row.status.tone === "warning").length;
  const fields = [
    { name: "id_eleve", label: "Élève", type: "select", required: true, options: studentOptions },
    { name: "id_classe", label: "Classe", type: "select", required: true, options: classOptions },
    { name: "date_inscription", label: "Date d’inscription", type: "date", required: true },
    { name: "statut", label: "Statut", type: "select", required: true, options: [{ value: "active", label: "Validée" }, { value: "en_attente", label: "En attente" }] },
    { name: "redoublant", label: "L’élève redouble cette classe", type: "checkbox" },
    { name: "numero_inscription", label: "Numéro d’inscription" },
    { name: "observation", label: "Observation", type: "textarea", full: true },
  ];

  function openForm() {
    setForm({ ...initialForm, id_annee: activeYear ? String(activeYear.id_annee) : "" });
    setFormError("");
    setFormOpen(true);
  }

  function changeForm(event) {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  async function submitForm(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      await createInscription({
        ...form,
        id_eleve: Number(form.id_eleve),
        id_annee: Number(form.id_annee),
        id_classe: Number(form.id_classe),
        numero_inscription: form.numero_inscription || null,
        observation: form.observation || null,
      });
      setFormOpen(false);
      setLoading(true);
      await loadInscriptions();
    } catch (error) {
      setFormError(error?.message || "La création de l’inscription a échoué.");
    } finally {
      setSaving(false);
    }
  }

  function openTransfer(row) {
    setTransferRow(row);
    setTransferClassId("");
    setTransferError("");
    setTransferSuccess("");
  }

  async function submitTransfer(event) {
    event.preventDefault();
    if (!transferRow || !transferClassId || transferSaving) return;
    setTransferSaving(true);
    setTransferError("");
    try {
      await updateInscription(Number(transferRow.id_inscription), { id_classe: Number(transferClassId) });
      const targetClass = classes.find((item) => Number(item.id_classe) === Number(transferClassId));
      setTransferSuccess(`${transferRow.studentName} a été transféré(e) vers ${targetClass?.nom || "la nouvelle classe"}.`);
      setTransferRow(null);
      setLoading(true);
      await loadInscriptions();
    } catch (requestError) {
      setTransferError(requestError?.message || "Le changement de classe a échoué.");
    } finally {
      setTransferSaving(false);
    }
  }

  return (
    <main className="inscriptions-page">
      <div className="inscriptions-heading">
        <div>
          <p className="crud-eyebrow">SCOLARITÉ</p>
          <h1>Gestion des inscriptions</h1>
        </div>
        <label className="inscriptions-year-select">
          <span>Année scolaire</span>
          <select aria-label="Année scolaire" value={selectedYearId || String(activeYear?.id_annee || "")} onChange={(event) => setSelectedYearId(event.target.value)}>
            {yearOptions.map((option) => <option key={option.value} value={String(option.value)}>{option.label}</option>)}
          </select>
        </label>
      </div>

      <section className="inscriptions-stats" aria-label="Indicateurs d’inscription">
        <article className="inscriptions-stat">
          <div className="inscriptions-stat-icon total"><Users size={19} /></div>
          <div><span>Élèves inscrits</span><strong>{loading ? "…" : rows.length}</strong></div>
        </article>
        <article className="inscriptions-stat">
          <div className="inscriptions-stat-icon validated"><CheckCircle2 size={19} /></div>
          <div><span>Validées</span><strong>{loading ? "…" : validatedCount}</strong></div>
        </article>
        <article className="inscriptions-stat">
          <div className="inscriptions-stat-icon pending"><Clock3 size={19} /></div>
          <div><span>En attente</span><strong>{loading ? "…" : pendingCount}</strong></div>
        </article>
      </section>

      <section className="inscriptions-list-section" aria-label="Liste des inscriptions">
        <div className="inscriptions-toolbar">
          <label className="inscriptions-search">
            <Search size={17} aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un élève..." aria-label="Rechercher un élève" />
          </label>
          <button className="crud-primary inscriptions-create" type="button" onClick={openForm} disabled={!activeYear}>
            <Plus size={17} /> Nouvelle inscription
          </button>
        </div>

        {transferSuccess && <div className="success-message" role="status">{transferSuccess}</div>}

        {loadError && <div className="crud-alert" role="alert">{loadError}<button className="crud-secondary" type="button" onClick={loadInscriptions}>Réessayer</button></div>}
        {loading ? <div className="crud-state" role="status">Chargement des inscriptions…</div> : !activeYear ? (
          <div className="crud-state">Aucune année scolaire disponible. Créez d’abord une année scolaire.</div>
        ) : filteredRows.length === 0 ? (
          <div className="inscriptions-empty">{query ? "Aucun élève ne correspond à cette recherche." : "Aucune inscription pour cette année scolaire."}</div>
        ) : (
          <div className="inscriptions-table-wrap">
            <table className="inscriptions-table">
              <thead><tr><th>Élève</th><th>Classe</th><th>Type</th><th>Statut</th><th>Action</th></tr></thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id_inscription}>
                    <td><strong>{row.studentName}</strong><small>{row.matricule}</small></td>
                    <td>{row.className}</td>
                    <td><span className={`inscription-type${row.typeLabel === "Redoublante" ? " repeating" : ""}`}>{row.typeLabel}</span></td>
                    <td><span className={`status-badge ${row.status.tone}`}>{row.status.label}</span></td>
                    <td><button className="inscription-transfer-button" type="button" onClick={() => openTransfer(row)} title={`Changer la classe de ${row.studentName}`} aria-label={`Changer la classe de ${row.studentName}`}><ArrowLeftRight size={16} /><span>Changer de classe</span></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {formOpen && <InscriptionForm fields={fields} form={form} onChange={changeForm} onClose={() => !saving && setFormOpen(false)} onSubmit={submitForm} saving={saving} error={formError} />}
      {transferRow && <div className="crud-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !transferSaving && setTransferRow(null)}><section className="crud-modal inscription-modal" role="dialog" aria-modal="true" aria-labelledby="transfer-modal-title"><div className="crud-modal-head"><div><h2 id="transfer-modal-title">Changer la classe</h2><p>{transferRow.studentName} · Année {activeYear?.libelle || "scolaire"}</p></div><button type="button" aria-label="Fermer" onClick={() => setTransferRow(null)} disabled={transferSaving}>×</button></div><form className="crud-form" onSubmit={submitTransfer}>{transferError && <div className="crud-alert" role="alert">{transferError}</div>}<div className="crud-form-grid"><div className="crud-field full"><label htmlFor="transfer-class-select">Nouvelle classe *</label><select id="transfer-class-select" value={transferClassId} onChange={(event) => setTransferClassId(event.target.value)} required><option value="">Sélectionner une classe</option>{classes.filter((item) => Number(item.id_etablissement) === Number(transferRow.student?.id_etablissement) && Number(item.id_classe) !== Number(transferRow.id_classe)).map((item) => <option key={item.id_classe} value={item.id_classe}>{item.nom}</option>)}</select></div><div className="crud-field full"><small className="transfer-note">Le changement concerne cette année scolaire. Les notes déjà saisies restent liées aux évaluations auxquelles elles appartiennent.</small></div></div><div className="crud-form-actions"><button className="crud-secondary" type="button" onClick={() => setTransferRow(null)} disabled={transferSaving}>Annuler</button><button className="crud-primary" type="submit" disabled={transferSaving || !transferClassId}>{transferSaving ? "Transfert…" : "Confirmer le transfert"}</button></div></form></section></div>}
    </main>
  );
}
