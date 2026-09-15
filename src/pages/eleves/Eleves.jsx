import { useState } from "react";
import EleveForm from "./EleveForm";

import {
  Search,
  Plus,
  MoreVertical,
  Users,
  UserCheck,
  UserX,
  Eye,
  Pencil,
  Power,
  Trash2,
  X,
} from "lucide-react";

import "./Eleves.css";

function Eleves() {
  // =========================================
  // ÉTATS
  // =========================================

  const [searchTerm, setSearchTerm] = useState("");
  const [showEleveForm, setShowEleveForm] = useState(false);
  const [eleveEnModification, setEleveEnModification] = useState(null);

  const [eleves, setEleves] = useState([
    {
      id_eleve: 1,
      matricule: "ELV001",
      nom: "SYLLA",
      prenom: "Moussa",
      sexe: "M",
      date_naissance: "2010-05-12",
      lieu_naissance: "Bamako",
      nationalite: "Malienne",
      adresse: "Bamako",
      telephone: "70 00 00 01",
      email: "moussa@example.com",
      photo: null,
      actif: true,
    },

    {
      id_eleve: 2,
      matricule: "ELV002",
      nom: "TRAORE",
      prenom: "Aïssata",
      sexe: "F",
      date_naissance: "2011-03-20",
      lieu_naissance: "Sikasso",
      nationalite: "Malienne",
      adresse: "Bamako",
      telephone: "70 00 00 02",
      email: "aissata@example.com",
      photo: null,
      actif: true,
    },

    {
      id_eleve: 3,
      matricule: "ELV003",
      nom: "DIALLO",
      prenom: "Amadou",
      sexe: "M",
      date_naissance: "2010-09-08",
      lieu_naissance: "Kayes",
      nationalite: "Malienne",
      adresse: "Bamako",
      telephone: "70 00 00 03",
      email: "amadou@example.com",
      photo: null,
      actif: true,
    },

    {
      id_eleve: 4,
      matricule: "ELV004",
      nom: "COULIBALY",
      prenom: "Fatoumata",
      sexe: "F",
      date_naissance: "2012-01-15",
      lieu_naissance: "Bamako",
      nationalite: "Malienne",
      adresse: "Bamako",
      telephone: "70 00 00 04",
      email: "fatoumata@example.com",
      photo: null,
      actif: false,
    },
  ]);

  // Élève dont le menu est ouvert
  const [selectedEleve, setSelectedEleve] = useState(null);

  // Élève actuellement consulté
  const [eleveAConsulter, setEleveAConsulter] = useState(null);

  // Élève à supprimer
  const [eleveASupprimer, setEleveASupprimer] = useState(null);

  // =========================================
  // RECHERCHE
  // =========================================

  const filteredEleves = eleves.filter((eleve) => {
    const recherche = searchTerm.toLowerCase().trim();

    if (!recherche) {
      return true;
    }

    return (
      eleve.matricule.toLowerCase().includes(recherche) ||
      eleve.nom.toLowerCase().includes(recherche) ||
      eleve.prenom.toLowerCase().includes(recherche) ||
      eleve.telephone.includes(recherche)
    );
  });

  // =========================================
  // STATISTIQUES
  // =========================================

  const totalEleves = eleves.length;

  const elevesActifs = eleves.filter(
    (eleve) => eleve.actif
  ).length;

  const elevesInactifs = eleves.filter(
    (eleve) => !eleve.actif
  ).length;

  // =========================================
  // CONSULTER
  // =========================================

  const consulterEleve = (eleve) => {
    setEleveAConsulter(eleve);
    setSelectedEleve(null);
  };

  // =========================================
  // MODIFIER
  // =========================================

  const modifierEleve = (eleve) => {
    setSelectedEleve(null);
    setEleveEnModification(eleve);
    setShowEleveForm(true);
  };

  const enregistrerEleve = (donnees) => {
    if (eleveEnModification) {
      setEleves((anciensEleves) =>
        anciensEleves.map((eleve) =>
          eleve.id_eleve === eleveEnModification.id_eleve
            ? {
                ...eleve,
                ...donnees,
              }
            : eleve
        )
      );
    } else {
      const nouvelEleve = {
        id_eleve: Date.now(),
        ...donnees,
      };

      setEleves((anciensEleves) => [...anciensEleves, nouvelEleve]);
    }

    setShowEleveForm(false);
    setEleveEnModification(null);
  };

  // =========================================
  // DÉSACTIVER / RÉACTIVER
  // =========================================

  const changerStatutEleve = (eleve) => {
    setEleves((anciensEleves) =>
      anciensEleves.map((item) =>
        item.id_eleve === eleve.id_eleve
          ? {
              ...item,
              actif: !item.actif,
            }
          : item
      )
    );

    setSelectedEleve(null);
  };

  // =========================================
  // DEMANDER SUPPRESSION
  // =========================================

  const demanderSuppression = (eleve) => {
    setEleveASupprimer(eleve);
    setSelectedEleve(null);
  };

  // =========================================
  // CONFIRMER SUPPRESSION
  // =========================================

  const confirmerSuppression = () => {
    if (!eleveASupprimer) {
      return;
    }

    setEleves((anciensEleves) =>
      anciensEleves.filter(
        (eleve) =>
          eleve.id_eleve !== eleveASupprimer.id_eleve
      )
    );

    setEleveASupprimer(null);
  };

  // =========================================
  // ANNULER SUPPRESSION
  // =========================================

  const annulerSuppression = () => {
    setEleveASupprimer(null);
  };

  // =========================================
  // FORMAT DATE
  // =========================================

  const formaterDate = (date) => {
    if (!date) {
      return "-";
    }

    const [annee, mois, jour] = date.split("-");

    return `${jour}/${mois}/${annee}`;
  };

  // =========================================
  // AFFICHAGE
  // =========================================

  return (
    <div className="page-container">

      {/* =====================================
          EN-TÊTE
          ===================================== */}

      <div className="page-header">

        <div>
          <h1>Élèves</h1>

          <p>
            Gestion des élèves et de leurs informations scolaires.
          </p>
          {showEleveForm && (
  <EleveForm
    eleveInitial={eleveEnModification}
    onClose={() => {
      setShowEleveForm(false);
      setEleveEnModification(null);
    }}
    onSave={enregistrerEleve}
  />
)}

        </div>

        <button
  className="primary-button"
  onClick={() => {
    setEleveEnModification(null);
    setShowEleveForm(true);
  }}
>
  <Plus size={18} />
  Ajouter un élève
</button>


      </div>


      {/* =====================================
          STATISTIQUES
          ===================================== */}

      <div className="stats-grid">

        <div className="stat-card">

          <div className="stat-icon">
            <Users size={22} />
          </div>

          <div>
            <span>Total élèves</span>
            <strong>{totalEleves}</strong>
          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            <UserCheck size={22} />
          </div>

          <div>
            <span>Élèves actifs</span>
            <strong>{elevesActifs}</strong>
          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            <UserX size={22} />
          </div>

          <div>
            <span>Élèves inactifs</span>
            <strong>{elevesInactifs}</strong>
          </div>

        </div>

      </div>


      {/* =====================================
          TABLEAU
          ===================================== */}

      <div className="content-card">

        {/* Barre de recherche */}

        <div className="table-toolbar">

          <div className="search-box">

            <Search size={18} />

            <input
              type="text"
              placeholder="Rechercher par matricule, nom, prénom ou téléphone..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />

          </div>

        </div>


        {/* Tableau */}

        <div className="table-container">

          <table>

            <thead>

              <tr>
                <th>Matricule</th>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Sexe</th>
                <th>Téléphone</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>

            </thead>


            <tbody>

              {filteredEleves.length > 0 ? (

                filteredEleves.map((eleve) => (

                  <tr key={eleve.id_eleve}>

                    <td>
                      <strong>
                        {eleve.matricule}
                      </strong>
                    </td>

                    <td>
                      {eleve.nom}
                    </td>

                    <td>
                      {eleve.prenom}
                    </td>

                    <td>
                      {eleve.sexe}
                    </td>

                    <td>
                      {eleve.telephone}
                    </td>

                    <td>

                      <span
                        className={
                          eleve.actif
                            ? "status-badge active"
                            : "status-badge inactive"
                        }
                      >
                        {eleve.actif
                          ? "Actif"
                          : "Inactif"}
                      </span>

                    </td>

                    {/* =========================
                        ACTIONS
                        ========================= */}

                    <td className="actions-cell">

                      <button
                        className="action-button"
                        title="Actions"
                        onClick={() =>
                          setSelectedEleve(
                            selectedEleve?.id_eleve ===
                              eleve.id_eleve
                              ? null
                              : eleve
                          )
                        }
                      >
                        <MoreVertical size={18} />
                      </button>


                      {/* MENU */}

                      {selectedEleve?.id_eleve ===
                        eleve.id_eleve && (

                        <div className="action-menu">

                          {/* Consulter */}

                          <button
                            onClick={() =>
                              consulterEleve(eleve)
                            }
                          >
                            <Eye size={16} />
                            <span>Consulter</span>
                          </button>


                          {/* Modifier */}

                          <button
                            onClick={() =>
                              modifierEleve(eleve)
                            }
                          >
                            <Pencil size={16} />
                            <span>Modifier</span>
                          </button>


                          {/* Désactiver / Réactiver */}

                          <button
                            onClick={() =>
                              changerStatutEleve(eleve)
                            }
                          >
                            <Power size={16} />

                            <span>
                              {eleve.actif
                                ? "Désactiver"
                                : "Réactiver"}
                            </span>

                          </button>


                          {/* Supprimer */}

                          <button
                            className="danger-action"
                            onClick={() =>
                              demanderSuppression(eleve)
                            }
                          >
                            <Trash2 size={16} />

                            <span>
                              Supprimer
                            </span>

                          </button>

                        </div>

                      )}

                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan="7"
                    style={{
                      textAlign: "center",
                      padding: "30px",
                      color: "#6b7280",
                    }}
                  >
                    Aucun élève trouvé.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* =====================================
          MODALE : CONSULTER
          ===================================== */}

      {eleveAConsulter && (

        <div
          className="modal-overlay"
          onClick={() =>
            setEleveAConsulter(null)
          }
        >

          <div
            className="modal-card"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <h2>Dossier de l'élève</h2>

                <p>
                  Informations personnelles
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setEleveAConsulter(null)
                }
              >
                <X size={20} />
              </button>

            </div>


            <div className="student-profile">

              {/* Photo */}

              <div className="student-photo">

                {eleveAConsulter.photo ? (

                  <img
                    src={eleveAConsulter.photo}
                    alt={`${eleveAConsulter.prenom} ${eleveAConsulter.nom}`}
                  />

                ) : (

                  <span>
                    {eleveAConsulter.prenom
                      ?.charAt(0)}
                    {eleveAConsulter.nom
                      ?.charAt(0)}
                  </span>

                )}

              </div>


              <div className="student-name">

                <h3>
                  {eleveAConsulter.prenom}{" "}
                  {eleveAConsulter.nom}
                </h3>

                <span>
                  {eleveAConsulter.matricule}
                </span>

              </div>

            </div>


            {/* Informations */}

            <div className="student-details">

              <div className="detail-item">
                <span>Sexe</span>
                <strong>
                  {eleveAConsulter.sexe === "M"
                    ? "Masculin"
                    : "Féminin"}
                </strong>
              </div>


              <div className="detail-item">
                <span>Date de naissance</span>
                <strong>
                  {formaterDate(
                    eleveAConsulter.date_naissance
                  )}
                </strong>
              </div>


              <div className="detail-item">
                <span>Lieu de naissance</span>
                <strong>
                  {eleveAConsulter.lieu_naissance ||
                    "-"}
                </strong>
              </div>


              <div className="detail-item">
                <span>Nationalité</span>
                <strong>
                  {eleveAConsulter.nationalite ||
                    "-"}
                </strong>
              </div>


              <div className="detail-item">
                <span>Téléphone</span>
                <strong>
                  {eleveAConsulter.telephone ||
                    "-"}
                </strong>
              </div>


              <div className="detail-item">
                <span>Email</span>
                <strong>
                  {eleveAConsulter.email || "-"}
                </strong>
              </div>


              <div className="detail-item">
                <span>Adresse</span>
                <strong>
                  {eleveAConsulter.adresse || "-"}
                </strong>
              </div>


              <div className="detail-item">
                <span>Statut</span>

                <strong>
                  <span
                    className={
                      eleveAConsulter.actif
                        ? "status-badge active"
                        : "status-badge inactive"
                    }
                  >
                    {eleveAConsulter.actif
                      ? "Actif"
                      : "Inactif"}
                  </span>
                </strong>

              </div>

            </div>

          </div>

        </div>

      )}


      {/* =====================================
          MODALE : CONFIRMATION SUPPRESSION
          ===================================== */}

      {eleveASupprimer && (

        <div className="modal-overlay">

          <div className="modal-card delete-modal">

            <div className="delete-icon">
              <Trash2 size={24} />
            </div>

            <h2>
              Supprimer l'élève ?
            </h2>

            <p>

              Voulez-vous vraiment supprimer{" "}

              <strong>
                {eleveASupprimer.prenom}{" "}
                {eleveASupprimer.nom}
              </strong>

              ?

              <br />

              Cette action est irréversible.

            </p>


            <div className="modal-actions">

              <button
                className="secondary-button"
                onClick={annulerSuppression}
              >
                Annuler
              </button>


              <button
                className="danger-button"
                onClick={confirmerSuppression}
              >
                <Trash2 size={17} />
                Supprimer
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Eleves;