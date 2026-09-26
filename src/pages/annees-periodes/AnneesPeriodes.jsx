import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarDays, Plus, RefreshCw } from "lucide-react";

import { establishmentId } from "../../services/apiClient";
import { createAnnee, getAnnees } from "../../services/anneesApi";
import { createPeriode, getPeriodes } from "../../services/periodesApi";

import "./AnneesPeriodes.css";

const emptyAnnee = {
  libelle: "",
  date_debut: "",
  date_fin: "",
  statut: "active",
};

const emptyPeriode = {
  code: "",
  libelle: "",
  ordre: "",
  date_debut: "",
  date_fin: "",
};

function AnneesPeriodes() {
  const [annees, setAnnees] = useState([]);
  const [periodes, setPeriodes] = useState([]);
  const [selectedAnnee, setSelectedAnnee] = useState("");
  const [anneeForm, setAnneeForm] = useState(emptyAnnee);
  const [periodeForm, setPeriodeForm] = useState(emptyPeriode);
  const [loading, setLoading] = useState(true);
  const [savingAnnee, setSavingAnnee] = useState(false);
  const [savingPeriode, setSavingPeriode] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [anneesData, periodesData] = await Promise.all([
        getAnnees(),
        getPeriodes(),
      ]);
      const nextAnnees = Array.isArray(anneesData) ? anneesData : [];
      setAnnees(nextAnnees);
      setPeriodes(Array.isArray(periodesData) ? periodesData : []);
      setSelectedAnnee((current) => current || String(nextAnnees[0]?.id_annee || ""));
    } catch (err) {
      setError(err.message || "Impossible de charger les années et périodes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const periodesSelectionnees = useMemo(
    () => periodes.filter((periode) => String(periode.id_annee) === String(selectedAnnee)),
    [periodes, selectedAnnee],
  );

  function updateAnneeForm(event) {
    const { name, value } = event.target;
    setAnneeForm((current) => ({ ...current, [name]: value }));
  }

  function updatePeriodeForm(event) {
    const { name, value } = event.target;
    setPeriodeForm((current) => ({ ...current, [name]: value }));
  }

  async function submitAnnee(event) {
    event.preventDefault();
    try {
      setSavingAnnee(true);
      setError("");
      setSuccess("");
      const created = await createAnnee({
        id_etablissement: establishmentId(),
        ...anneeForm,
      });
      setAnnees((current) => [...current, created]);
      setSelectedAnnee(String(created.id_annee));
      setAnneeForm(emptyAnnee);
      setSuccess("Année scolaire créée avec succès.");
    } catch (err) {
      setError(err.message || "Impossible de créer l’année scolaire.");
    } finally {
      setSavingAnnee(false);
    }
  }

  async function submitPeriode(event) {
    event.preventDefault();
    if (!selectedAnnee) {
      setError("Sélectionnez une année scolaire avant de créer une période.");
      return;
    }

    try {
      setSavingPeriode(true);
      setError("");
      setSuccess("");
      const created = await createPeriode({
        id_annee: Number(selectedAnnee),
        ...periodeForm,
        ordre: Number(periodeForm.ordre),
      });
      setPeriodes((current) => [...current, created]);
      setPeriodeForm(emptyPeriode);
      setSuccess("Période créée avec succès.");
    } catch (err) {
      setError(err.message || "Impossible de créer la période.");
    } finally {
      setSavingPeriode(false);
    }
  }

  return (
    <div className="school-periods-page">
      <header className="school-periods-header">
        <div>
          <span className="school-periods-eyebrow">SCOLARITÉ</span>
          <h1>Années scolaires et périodes</h1>
          <p>Consultez les périodes existantes et créez les nouveaux éléments autorisés.</p>
        </div>
        <button type="button" className="school-periods-refresh" onClick={loadData} disabled={loading}>
          <RefreshCw size={17} /> Actualiser
        </button>
      </header>

      {error && <div className="school-periods-alert error"><AlertCircle size={18} /><span>{error}</span></div>}
      {success && <div className="school-periods-alert success"><span>{success}</span></div>}

      {loading ? (
        <div className="school-periods-state">Chargement des années et périodes...</div>
      ) : (
        <div className="school-periods-grid">
          <section className="school-periods-card">
            <div className="school-periods-card-header">
              <div><CalendarDays size={20} /><h2>Années scolaires</h2></div>
              <span>{annees.length}</span>
            </div>
            {annees.length === 0 ? (
              <p className="school-periods-empty">Aucune année scolaire disponible.</p>
            ) : (
              <div className="school-periods-list">
                {annees.map((annee) => (
                  <button
                    type="button"
                    className={`school-periods-list-item ${String(annee.id_annee) === String(selectedAnnee) ? "selected" : ""}`}
                    key={annee.id_annee}
                    onClick={() => setSelectedAnnee(String(annee.id_annee))}
                  >
                    <strong>{annee.libelle}</strong>
                    <span>{annee.date_debut} au {annee.date_fin}</span>
                    <small>{annee.statut}</small>
                  </button>
                ))}
              </div>
            )}
            <form className="school-periods-form" onSubmit={submitAnnee}>
              <h3><Plus size={17} /> Nouvelle année</h3>
              <input name="libelle" placeholder="Libellé" required value={anneeForm.libelle} onChange={updateAnneeForm} />
              <div className="school-periods-form-row"><input name="date_debut" type="date" required value={anneeForm.date_debut} onChange={updateAnneeForm} /><input name="date_fin" type="date" required value={anneeForm.date_fin} onChange={updateAnneeForm} /></div>
              <input name="statut" placeholder="Statut" required value={anneeForm.statut} onChange={updateAnneeForm} />
              <button type="submit" disabled={savingAnnee}>{savingAnnee ? "Création..." : "Créer l’année"}</button>
            </form>
          </section>

          <section className="school-periods-card">
            <div className="school-periods-card-header">
              <div><CalendarDays size={20} /><h2>Périodes</h2></div>
              <select aria-label="Année sélectionnée" value={selectedAnnee} onChange={(event) => setSelectedAnnee(event.target.value)}>
                <option value="">Sélectionner une année</option>
                {annees.map((annee) => <option key={annee.id_annee} value={annee.id_annee}>{annee.libelle}</option>)}
              </select>
            </div>
            {periodesSelectionnees.length === 0 ? (
              <p className="school-periods-empty">Aucune période pour cette année.</p>
            ) : (
              <div className="school-periods-table-wrap"><table className="school-periods-table"><thead><tr><th>Code</th><th>Libellé</th><th>Ordre</th><th>Dates</th></tr></thead><tbody>{periodesSelectionnees.map((periode) => <tr key={periode.id_periode}><td>{periode.code}</td><td>{periode.libelle}</td><td>{periode.ordre}</td><td>{periode.date_debut} au {periode.date_fin}</td></tr>)}</tbody></table></div>
            )}
            <form className="school-periods-form" onSubmit={submitPeriode}>
              <h3><Plus size={17} /> Nouvelle période</h3>
              <div className="school-periods-form-row"><input name="code" placeholder="Code" required value={periodeForm.code} onChange={updatePeriodeForm} /><input name="libelle" placeholder="Libellé" required value={periodeForm.libelle} onChange={updatePeriodeForm} /></div>
              <input name="ordre" type="number" min="1" placeholder="Ordre" required value={periodeForm.ordre} onChange={updatePeriodeForm} />
              <div className="school-periods-form-row"><input name="date_debut" type="date" required value={periodeForm.date_debut} onChange={updatePeriodeForm} /><input name="date_fin" type="date" required value={periodeForm.date_fin} onChange={updatePeriodeForm} /></div>
              <button type="submit" disabled={savingPeriode || !selectedAnnee}>{savingPeriode ? "Création..." : "Créer la période"}</button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default AnneesPeriodes;
