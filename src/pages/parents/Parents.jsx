import { useState } from "react";

import {
  Search,
  Plus,
  MoreVertical,
  Users,
  UserCheck,
  UserX,
} from "lucide-react";

import "./Parents.css";

function Parents() {
  // =========================================
  // ÉTAT DE LA RECHERCHE
  // =========================================

  const [searchTerm, setSearchTerm] = useState("");

  // =========================================
  // ÉTAT DU MENU D'ACTIONS
  // =========================================

  const [openMenu, setOpenMenu] = useState(null);

  // =========================================
  // DONNÉES TEMPORAIRES
  // =========================================
  // Ces données seront remplacées plus tard
  // par les données provenant de FastAPI.

  const [parents, setParents] = useState([
    {
      id_parent: 1,
      nom: "SYLLA",
      prenom: "Moussa",
      telephone: "70 00 00 10",
      telephone_secondaire: "76 00 00 10",
      email: "moussa.sylla@example.com",
      adresse: "Bamako",
      profession: "Commerçant",
      eleves: [
        {
          id_eleve: 1,
          matricule: "ELV001",
          nom: "SYLLA",
          prenom: "Moussa Junior",
          lien_parente: "Père",
          est_responsable: true,
          est_contact_urgence: true,
        },
      ],
    },

    {
      id_parent: 2,
      nom: "TRAORE",
      prenom: "Aïssata",
      telephone: "70 00 00 11",
      telephone_secondaire: "",
      email: "aissata.traore@example.com",
      adresse: "Bamako",
      profession: "Enseignante",
      eleves: [
        {
          id_eleve: 2,
          matricule: "ELV002",
          nom: "TRAORE",
          prenom: "Fatoumata",
          lien_parente: "Mère",
          est_responsable: true,
          est_contact_urgence: true,
        },
      ],
    },

    {
      id_parent: 3,
      nom: "DIALLO",
      prenom: "Amadou",
      telephone: "70 00 00 12",
      telephone_secondaire: "75 00 00 12",
      email: "amadou.diallo@example.com",
      adresse: "Bamako",
      profession: "Comptable",
      eleves: [
        {
          id_eleve: 3,
          matricule: "ELV003",
          nom: "DIALLO",
          prenom: "Amadou Junior",
          lien_parente: "Père",
          est_responsable: true,
          est_contact_urgence: false,
        },
        {
          id_eleve: 4,
          matricule: "ELV004",
          nom: "DIALLO",
          prenom: "Aminata",
          lien_parente: "Père",
          est_responsable: false,
          est_contact_urgence: true,
        },
      ],
    },

    {
      id_parent: 4,
      nom: "COULIBALY",
      prenom: "Fatoumata",
      telephone: "70 00 00 13",
      telephone_secondaire: "",
      email: "fatoumata.coulibaly@example.com",
      adresse: "Sikasso",
      profession: "Secrétaire",
      eleves: [],
    },
  ]);

  // =========================================
  // RECHERCHE
  // =========================================

  const filteredParents = parents.filter((parent) => {
    const recherche = searchTerm.toLowerCase().trim();

    if (!recherche) {
      return true;
    }

    return (
      parent.nom.toLowerCase().includes(recherche) ||
      parent.prenom.toLowerCase().includes(recherche) ||
      parent.telephone.includes(recherche) ||
      parent.email.toLowerCase().includes(recherche)
    );
  });

  // =========================================
  // STATISTIQUES
  // =========================================

  const totalParents = parents.length;

  const parentsAvecEleves = parents.filter(
    (parent) => parent.eleves.length > 0
  ).length;

  const parentsSansEleves = parents.filter(
    (parent) => parent.eleves.length === 0
  ).length;

  // =========================================
  // OUVRIR / FERMER LE MENU
  // =========================================

  const toggleMenu = (id) => {
    setOpenMenu(openMenu === id ? null : id);
  };

  // =========================================
  // CONSULTER
  // =========================================

  const handleView = (parent) => {
    alert(
      `Parent : ${parent.nom} ${parent.prenom}\n` +
        `Téléphone : ${parent.telephone}\n` +
        `Email : ${parent.email}\n` +
        `Élèves associés : ${parent.eleves.length}`
    );

    setOpenMenu(null);
  };

  // =========================================
  // MODIFIER
  // =========================================

  const handleEdit = (parent) => {
    alert(
      `Modification du parent : ${parent.nom} ${parent.prenom}`
    );

    setOpenMenu(null);
  };

  // =========================================
  // SUPPRIMER
  // =========================================

  const handleDelete = (parent) => {
    const confirmation = window.confirm(
      `Voulez-vous vraiment supprimer le parent ${parent.nom} ${parent.prenom} ?`
    );

    if (!confirmation) {
      return;
    }

    setParents(
      parents.filter(
        (item) => item.id_parent !== parent.id_parent
      )
    );

    setOpenMenu(null);
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
          <h1>Parents</h1>

          <p>
            Gestion des parents et de leurs relations avec les élèves.
          </p>
        </div>

        <button className="primary-button">
          <Plus size={18} />
          Ajouter un parent
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
            <span>Total parents</span>
            <strong>{totalParents}</strong>
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon">
            <UserCheck size={22} />
          </div>

          <div>
            <span>Avec élèves</span>
            <strong>{parentsAvecEleves}</strong>
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon">
            <UserX size={22} />
          </div>

          <div>
            <span>Sans élèves</span>
            <strong>{parentsSansEleves}</strong>
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
              placeholder="Rechercher par nom, prénom, téléphone ou email..."
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
              }}
            />

          </div>

        </div>

        {/* Tableau */}

        <div className="table-container">

          <table>

            <thead>

              <tr>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Téléphone</th>
                <th>Email</th>
                <th>Profession</th>
                <th>Élèves</th>
                <th>Actions</th>
              </tr>

            </thead>

            <tbody>

              {filteredParents.length > 0 ? (

                filteredParents.map((parent) => (

                  <tr key={parent.id_parent}>

                    <td>
                      <strong>
                        {parent.nom}
                      </strong>
                    </td>

                    <td>
                      {parent.prenom}
                    </td>

                    <td>
                      {parent.telephone}
                    </td>

                    <td>
                      {parent.email || "—"}
                    </td>

                    <td>
                      {parent.profession || "—"}
                    </td>

                    <td>

                      <span className="status-badge active">
                        {parent.eleves.length}
                      </span>

                    </td>

                    <td className="actions-cell">

                      <button
                        className="action-button"
                        title="Actions"
                        onClick={() =>
                          toggleMenu(parent.id_parent)
                        }
                      >
                        <MoreVertical size={18} />
                      </button>

                      {openMenu === parent.id_parent && (

                        <div className="action-menu">

                          <button
                            onClick={() =>
                              handleView(parent)
                            }
                          >
                            👁️ Consulter
                          </button>

                          <button
                            onClick={() =>
                              handleEdit(parent)
                            }
                          >
                            ✏️ Modifier
                          </button>

                          <button
                            onClick={() =>
                              alert(
                                `Élèves associés à ${parent.nom} ${parent.prenom} :\n\n` +
                                (
                                  parent.eleves.length > 0
                                    ? parent.eleves
                                        .map(
                                          (eleve) =>
                                            `${eleve.matricule} - ${eleve.prenom} ${eleve.nom}`
                                        )
                                        .join("\n")
                                    : "Aucun élève associé."
                                )
                              )
                            }
                          >
                            👨‍👩‍👧 Voir les élèves
                          </button>

                          <button
                            className="danger-action"
                            onClick={() =>
                              handleDelete(parent)
                            }
                          >
                            🗑️ Supprimer
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
                    Aucun parent trouvé.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default Parents;