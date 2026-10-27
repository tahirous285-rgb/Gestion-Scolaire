
import { useCallback, useEffect, useMemo, useState } from "react";
import { useReferenceOptions } from "../../hooks/useReferenceOptions";
import { getAnnees } from "../../services/anneesApi";
import { getClasses } from "../../services/classesApi";
import { getMatieres } from "../../services/matieresApi";
import { getEnseignants } from "../../services/enseignantsApi";
import {
  createEmploi,
  deleteEmploi,
  getEmplois,
  updateEmploi,
} from "../../services/emploiTempsApi";
import "./EmploiDuTemps.css";

const JOURS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

const FORMULAIRE_INITIAL = {
  id_annee: "",
  id_classe: "",
  id_enseignant: "",
  id_matiere: "",
  jour_semaine: "Lundi",
  heure_debut: "08:00",
  heure_fin: "10:00",
  salle: "",
  observation: "",
};

function extraireListe(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  return [];
}

function identifiant(valeur) {
  return valeur === null || valeur === undefined ? "" : String(valeur);
}

function heureCourte(value) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

function heureEnMinutes(value) {
  const [heures, minutes] = heureCourte(value).split(":").map(Number);
  return heures * 60 + minutes;
}

function nomEnseignant(enseignant) {
  if (!enseignant) return "Enseignant non renseigné";

  return [
    enseignant.nom,
    enseignant.prenom,
  ]
    .filter(Boolean)
    .join(" ") || enseignant.matricule || "Enseignant";
}

function nomMatiere(matiere) {
  if (!matiere) return "Matière non renseignée";

  return matiere.nom || matiere.code || "Matière";
}

export default function EmploiDuTemps() {
  const references = useReferenceOptions(
    {
      annees: getAnnees,
      classes: getClasses,
      enseignants: getEnseignants,
      matieres: getMatieres,
    },
    "emploi-temps"
  );

  const annees = useMemo(
    () => extraireListe(references.annees),
    [references.annees]
  );
  const classes = useMemo(
    () => extraireListe(references.classes),
    [references.classes]
  );
  const enseignants = useMemo(
    () => extraireListe(references.enseignants),
    [references.enseignants]
  );
  const matieres = useMemo(
    () => extraireListe(references.matieres),
    [references.matieres]
  );

  const [anneeSelectionnee, setAnneeSelectionnee] = useState("");
  const [classeSelectionnee, setClasseSelectionnee] = useState("");
  const [creneaux, setCreneaux] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const [modalOuverte, setModalOuverte] = useState(false);
  const [creneauModifie, setCreneauModifie] = useState(null);
  const [formulaire, setFormulaire] = useState(FORMULAIRE_INITIAL);
  const [enregistrement, setEnregistrement] = useState(false);

  // Sélectionne automatiquement une année si la liste en contient une.
  useEffect(() => {
    if (!anneeSelectionnee && annees.length > 0) {
      const anneeActive =
        annees.find((annee) => annee.actif === true || annee.active === true) ||
        annees[0];

      setAnneeSelectionnee(
        identifiant(anneeActive.id_annee)
      );
    }
  }, [annees, anneeSelectionnee]);

  const chargerCreneaux = useCallback(async () => {
    setChargement(true);
    setErreur("");

    try {
      const reponse = await getEmplois({
        id_annee: anneeSelectionnee || undefined,
        id_classe: classeSelectionnee || undefined,
      });

      setCreneaux(extraireListe(reponse));
    } catch (error) {
      setCreneaux([]);
      setErreur(
        error?.message ||
          "Impossible de charger les emplois du temps. Vérifie la connexion à l'API."
      );
    } finally {
      setChargement(false);
    }
  }, [anneeSelectionnee, classeSelectionnee]);

  useEffect(() => {
    chargerCreneaux();
  }, [chargerCreneaux]);

  const classesTriees = useMemo(
    () =>
      [...classes].sort((a, b) =>
        String(a.nom || "").localeCompare(String(b.nom || ""), "fr")
      ),
    [classes]
  );

  const creneauxFiltres = useMemo(() => {
    return creneaux
      .filter((creneau) => {
        const bonneAnnee =
          !anneeSelectionnee ||
          identifiant(creneau.id_annee) === anneeSelectionnee;

        const bonneClasse =
          !classeSelectionnee ||
          identifiant(creneau.id_classe) === classeSelectionnee;

        return bonneAnnee && bonneClasse;
      })
      .sort(
        (a, b) =>
          heureEnMinutes(a.heure_debut) -
          heureEnMinutes(b.heure_debut)
      );
  }, [creneaux, anneeSelectionnee, classeSelectionnee]);

  const classeActive = classes.find(
    (classe) => identifiant(classe.id_classe) === classeSelectionnee
  );

  const anneeActive = annees.find(
    (annee) => identifiant(annee.id_annee) === anneeSelectionnee
  );

  function obtenirNomClasse(id) {
    const classe = classes.find(
      (element) => identifiant(element.id_classe) === identifiant(id)
    );
    return classe?.nom || `Classe ${id ?? ""}`.trim();
  }

  function obtenirNomEnseignant(id) {
    const enseignant = enseignants.find(
      (element) =>
        identifiant(element.id_enseignant) === identifiant(id)
    );
    return nomEnseignant(enseignant);
  }

  function obtenirNomMatiere(id) {
    const matiere = matieres.find(
      (element) => identifiant(element.id_matiere) === identifiant(id)
    );
    return nomMatiere(matiere);
  }

  function ouvrirCreation() {
    setCreneauModifie(null);
    setFormulaire({
      ...FORMULAIRE_INITIAL,
      id_annee: anneeSelectionnee,
      id_classe: classeSelectionnee,
    });
    setErreur("");
    setMessage("");
    setModalOuverte(true);
  }

  function ouvrirModification(creneau) {
    setCreneauModifie(creneau);
    setFormulaire({
      id_annee: identifiant(creneau.id_annee),
      id_classe: identifiant(creneau.id_classe),
      id_enseignant: identifiant(creneau.id_enseignant),
      id_matiere: identifiant(creneau.id_matiere),
      jour_semaine: creneau.jour_semaine || "Lundi",
      heure_debut: heureCourte(creneau.heure_debut) || "08:00",
      heure_fin: heureCourte(creneau.heure_fin) || "10:00",
      salle: creneau.salle || "",
      observation: creneau.observation || "",
    });
    setErreur("");
    setMessage("");
    setModalOuverte(true);
  }

  function modifierChamp(event) {
    const { name, value } = event.target;
    setFormulaire((precedent) => ({
      ...precedent,
      [name]: value,
    }));
  }

  async function enregistrerCreneau(event) {
    event.preventDefault();
    setErreur("");
    setMessage("");

    if (
      !formulaire.id_annee ||
      !formulaire.id_classe ||
      !formulaire.id_enseignant ||
      !formulaire.id_matiere ||
      !formulaire.jour_semaine ||
      !formulaire.heure_debut ||
      !formulaire.heure_fin
    ) {
      setErreur("Remplis tous les champs obligatoires.");
      return;
    }

    if (
      heureEnMinutes(formulaire.heure_fin) <=
      heureEnMinutes(formulaire.heure_debut)
    ) {
      setErreur(
        "L'heure de fin doit être postérieure à l'heure de début."
      );
      return;
    }

    const donnees = {
      ...formulaire,
      id_annee: Number(formulaire.id_annee),
      id_classe: Number(formulaire.id_classe),
      id_enseignant: Number(formulaire.id_enseignant),
      id_matiere: Number(formulaire.id_matiere),
      salle: formulaire.salle.trim() || null,
      observation: formulaire.observation.trim() || null,
    };

    setEnregistrement(true);

    try {
      if (creneauModifie) {
        await updateEmploi(creneauModifie.id_emploi, donnees);
        setMessage("Créneau modifié avec succès.");
      } else {
        await createEmploi(donnees);
        setMessage("Créneau ajouté avec succès.");
      }

      setModalOuverte(false);
      setCreneauModifie(null);
      await chargerCreneaux();
    } catch (error) {
      setErreur(
        error?.message ||
          "L'enregistrement a échoué. Vérifie les données et réessaie."
      );
    } finally {
      setEnregistrement(false);
    }
  }

  async function supprimerCreneau(creneau) {
    const confirme = window.confirm(
      `Supprimer le cours « ${obtenirNomMatiere(
        creneau.id_matiere
      )} » du ${creneau.jour_semaine} ?`
    );

    if (!confirme) return;

    setErreur("");
    setMessage("");

    try {
      await deleteEmploi(creneau.id_emploi);
      setMessage("Créneau supprimé avec succès.");
      await chargerCreneaux();
    } catch (error) {
      setErreur(
        error?.message || "Impossible de supprimer ce créneau."
      );
    }
  }

  function fermerModal() {
    if (enregistrement) return;
    setModalOuverte(false);
    setCreneauModifie(null);
  }

  function afficherJour(jour) {
    return creneauxFiltres.filter(
      (creneau) =>
        String(creneau.jour_semaine || "").toLowerCase() ===
        jour.toLowerCase()
    );
  }

  return (
    <main className="edt-page">
      <header className="edt-header">
        <div className="edt-header-copy">
          <div className="edt-eyebrow">ORGANISATION SCOLAIRE</div>
          <h1>Emploi du temps</h1>
          <p>
            Organise les cours par année scolaire et par classe.
          </p>
        </div>

        <button
          className="edt-primary-btn"
          type="button"
          onClick={ouvrirCreation}
        >
          <span aria-hidden="true">＋</span> Ajouter un cours
        </button>
      </header>

      {erreur && (
        <div className="edt-alert edt-alert-error" role="alert">
          <span>{erreur}</span>
          <button
            type="button"
            aria-label="Fermer le message"
            onClick={() => setErreur("")}
          >
            ×
          </button>
        </div>
      )}

      {message && (
        <div className="edt-alert edt-alert-success" role="status">
          <span>{message}</span>
          <button
            type="button"
            aria-label="Fermer le message"
            onClick={() => setMessage("")}
          >
            ×
          </button>
        </div>
      )}

      <section className="edt-filter-panel">
        <div className="edt-filter-heading">
          <div className="edt-filter-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4M8 3v4M3 10h18" />
            </svg>
          </div>
          <div>
            <h2>Vue de la classe</h2>
            <p>Choisis l'année et la classe à consulter.</p>
          </div>
        </div>

        <div className="edt-filters">
          <label className="edt-field">
            <span>Année scolaire</span>
            <select
              value={anneeSelectionnee}
              onChange={(event) =>
                setAnneeSelectionnee(event.target.value)
              }
            >
              <option value="">Toutes les années</option>
              {annees.map((annee) => (
                <option
                  key={annee.id_annee}
                  value={identifiant(annee.id_annee)}
                >
                  {annee.libelle || annee.nom || annee.id_annee}
                </option>
              ))}
            </select>
          </label>

          <label className="edt-field">
            <span>Classe</span>
            <select
              value={classeSelectionnee}
              onChange={(event) =>
                setClasseSelectionnee(event.target.value)
              }
            >
              <option value="">Toutes les classes</option>
              {classesTriees.map((classe) => (
                <option
                  key={classe.id_classe}
                  value={identifiant(classe.id_classe)}
                >
                  {classe.nom}
                  {classe.niveau ? ` — ${classe.niveau}` : ""}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="edt-reset-btn"
            onClick={() => {
              setAnneeSelectionnee("");
              setClasseSelectionnee("");
            }}
          >
            Réinitialiser
          </button>
        </div>
      </section>

      <section className="edt-summary-grid">
        <article className="edt-summary-card">
          <div className="edt-summary-icon edt-icon-blue">▦</div>
          <div>
            <span>Nombre de cours</span>
            <strong>{creneauxFiltres.length}</strong>
          </div>
        </article>

        <article className="edt-summary-card">
          <div className="edt-summary-icon edt-icon-purple">▤</div>
          <div>
            <span>Classe affichée</span>
            <strong className="edt-summary-text">
              {classeActive?.nom || "Toutes les classes"}
            </strong>
          </div>
        </article>

        <article className="edt-summary-card">
          <div className="edt-summary-icon edt-icon-orange">◷</div>
          <div>
            <span>Année scolaire</span>
            <strong className="edt-summary-text">
              {anneeActive?.libelle || anneeActive?.nom || "Toutes"}
            </strong>
          </div>
        </article>
      </section>

      <section className="edt-timetable-section">
        <div className="edt-section-header">
          <div>
            <h2>Planning hebdomadaire</h2>
            <p>
              {classeActive
                ? `Cours de la classe ${classeActive.nom}`
                : "Sélectionne une classe pour consulter son planning individuel."}
            </p>
          </div>
          <button
            type="button"
            className="edt-refresh-btn"
            onClick={chargerCreneaux}
            disabled={chargement}
          >
            ↻ Actualiser
          </button>
        </div>

        {chargement ? (
          <div className="edt-state">
            <span className="edt-spinner" />
            <p>Chargement de l'emploi du temps…</p>
          </div>
        ) : creneauxFiltres.length === 0 ? (
          <div className="edt-state edt-empty-state">
            <div className="edt-empty-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4M8 3v4M3 10h18M8 14h3M8 17h6" />
              </svg>
            </div>
            <h3>Aucun cours à afficher</h3>
            <p>
              Aucun créneau ne correspond aux filtres sélectionnés.
              Tu peux ajouter le premier cours.
            </p>
            <button
              type="button"
              className="edt-primary-btn"
              onClick={ouvrirCreation}
            >
              ＋ Ajouter un cours
            </button>
          </div>
        ) : (
          <div className="edt-week-grid">
            {JOURS.map((jour) => {
              const coursDuJour = afficherJour(jour);

              return (
                <div className="edt-day-column" key={jour}>
                  <div className="edt-day-header">
                    <span>{jour.slice(0, 3)}</span>
                    <span className="edt-day-count">
                      {coursDuJour.length}
                    </span>
                  </div>

                  <div className="edt-day-content">
                    {coursDuJour.length === 0 ? (
                      <div className="edt-no-course">Aucun cours</div>
                    ) : (
                      coursDuJour.map((creneau) => (
                        <article
                          className="edt-course-card"
                          key={creneau.id_emploi}
                        >
                          <div className="edt-course-time">
                            <span>
                              {heureCourte(creneau.heure_debut)}
                            </span>
                            <span className="edt-time-separator">–</span>
                            <span>
                              {heureCourte(creneau.heure_fin)}
                            </span>
                          </div>

                          <h3>
                            {obtenirNomMatiere(creneau.id_matiere)}
                          </h3>

                          <p className="edt-course-teacher">
                            <span aria-hidden="true">♙</span>
                            {obtenirNomEnseignant(
                              creneau.id_enseignant
                            )}
                          </p>

                          {creneau.salle && (
                            <p className="edt-course-room">
                              <span aria-hidden="true">⌖</span>
                              Salle {creneau.salle}
                            </p>
                          )}

                          {!classeSelectionnee && (
                            <p className="edt-course-class">
                              {obtenirNomClasse(creneau.id_classe)}
                            </p>
                          )}

                          <div className="edt-course-actions">
                            <button
                              type="button"
                              onClick={() => ouvrirModification(creneau)}
                            >
                              Modifier
                            </button>
                            <button
                              type="button"
                              className="edt-delete-btn"
                              onClick={() => supprimerCreneau(creneau)}
                            >
                              Supprimer
                            </button>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {modalOuverte && (
        <div
          className="edt-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) fermerModal();
          }}
        >
          <section
            className="edt-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edt-modal-title"
          >
            <header className="edt-modal-header">
              <div>
                <span className="edt-modal-eyebrow">
                  GESTION DES COURS
                </span>
                <h2 id="edt-modal-title">
                  {creneauModifie ? "Modifier le cours" : "Nouveau cours"}
                </h2>
                <p>
                  Renseigne la classe, la matière et les horaires.
                </p>
              </div>
              <button
                type="button"
                className="edt-modal-close"
                aria-label="Fermer"
                onClick={fermerModal}
                disabled={enregistrement}
              >
                ×
              </button>
            </header>

            <form className="edt-form" onSubmit={enregistrerCreneau}>
              {erreur && (
                <div className="edt-alert edt-alert-error" role="alert">
                  {erreur}
                </div>
              )}

              <div className="edt-form-grid">
                <label className="edt-field">
                  <span>Année scolaire *</span>
                  <select
                    name="id_annee"
                    value={formulaire.id_annee}
                    onChange={modifierChamp}
                    required
                  >
                    <option value="">Sélectionner une année</option>
                    {annees.map((annee) => (
                      <option
                        key={annee.id_annee}
                        value={identifiant(annee.id_annee)}
                      >
                        {annee.libelle || annee.nom || annee.id_annee}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="edt-field">
                  <span>Classe *</span>
                  <select
                    name="id_classe"
                    value={formulaire.id_classe}
                    onChange={modifierChamp}
                    required
                  >
                    <option value="">Sélectionner une classe</option>
                    {classesTriees.map((classe) => (
                      <option
                        key={classe.id_classe}
                        value={identifiant(classe.id_classe)}
                      >
                        {classe.nom}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="edt-field">
                  <span>Matière *</span>
                  <select
                    name="id_matiere"
                    value={formulaire.id_matiere}
                    onChange={modifierChamp}
                    required
                  >
                    <option value="">Sélectionner une matière</option>
                    {matieres.map((matiere) => (
                      <option
                        key={matiere.id_matiere}
                        value={identifiant(matiere.id_matiere)}
                      >
                        {matiere.code ? `${matiere.code} — ` : ""}
                        {matiere.nom}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="edt-field">
                  <span>Enseignant *</span>
                  <select
                    name="id_enseignant"
                    value={formulaire.id_enseignant}
                    onChange={modifierChamp}
                    required
                  >
                    <option value="">Sélectionner un enseignant</option>
                    {enseignants.map((enseignant) => (
                      <option
                        key={enseignant.id_enseignant}
                        value={identifiant(enseignant.id_enseignant)}
                      >
                        {nomEnseignant(enseignant)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="edt-field">
                  <span>Jour *</span>
                  <select
                    name="jour_semaine"
                    value={formulaire.jour_semaine}
                    onChange={modifierChamp}
                    required
                  >
                    {JOURS.map((jour) => (
                      <option key={jour} value={jour}>
                        {jour}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="edt-field">
                  <span>Salle</span>
                  <input
                    name="salle"
                    value={formulaire.salle}
                    onChange={modifierChamp}
                    placeholder="Ex. : Salle 3"
                    maxLength={100}
                  />
                </label>

                <label className="edt-field">
                  <span>Heure de début *</span>
                  <input
                    type="time"
                    name="heure_debut"
                    value={formulaire.heure_debut}
                    onChange={modifierChamp}
                    required
                  />
                </label>

                <label className="edt-field">
                  <span>Heure de fin *</span>
                  <input
                    type="time"
                    name="heure_fin"
                    value={formulaire.heure_fin}
                    onChange={modifierChamp}
                    required
                  />
                </label>

                <label className="edt-field edt-field-full">
                  <span>Observation</span>
                  <textarea
                    name="observation"
                    value={formulaire.observation}
                    onChange={modifierChamp}
                    placeholder="Information complémentaire (facultatif)"
                    rows={3}
                  />
                </label>
              </div>

              <footer className="edt-form-footer">
                <button
                  type="button"
                  className="edt-cancel-btn"
                  onClick={fermerModal}
                  disabled={enregistrement}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="edt-primary-btn"
                  disabled={enregistrement}
                >
                  {enregistrement
                    ? "Enregistrement…"
                    : creneauModifie
                    ? "Enregistrer les modifications"
                    : "Créer le cours"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
