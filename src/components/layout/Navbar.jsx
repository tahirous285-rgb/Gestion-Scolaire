import {
  Search,
  Bell,
  LogOut,
  UserCircle,
  Menu,
} from "lucide-react";

import { useLocation, useNavigate } from "react-router-dom";
import { clearSession, currentUser } from "../../services/apiClient";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = currentUser();

  function handleLogout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  // Correspondance entre les routes et les titres
  const pageTitles = {
    "/dashboard": "Tableau de bord",

    // Scolarité
    "/eleves": "Élèves",
    "/parents": "Parents",
    "/inscriptions": "Inscriptions",
    "/classes": "Classes",
    "/matieres": "Matières",
    "/annees-periodes": "Années & périodes",

    // Enseignants
    "/enseignants": "Enseignants",
    "/affectations": "Affectations",

    // Pédagogie
    "/evaluations": "Évaluations",
    "/notes": "Notes",
    "/presences-eleves": "Présences élèves",
    "/bulletins": "Bulletins",
    "/emploi-du-temps": "Emploi du temps",

    // Cahier des maîtres
    "/cahier-maitre": "Présence enseignants",
    "/cours-effectues": "Cours effectués",
    "/observations-enseignants": "Observations enseignants",

    // Honoraires
    "/honoraires": "Honoraires",
    "/paiements-honoraires": "Paiements honoraires",

    // Finance
    "/frais": "Frais scolaires",
    "/paiements": "Paiements scolaires",
    "/recus": "Reçus",
    "/depenses": "Dépenses",

    // Documents
    "/cartes": "Cartes scolaires",

    // Communication
    "/annonces": "Annonces",
    "/messages": "Messages",
    "/notifications": "Notifications",

    // Administration
    "/etablissements": "Établissement",
    "/utilisateurs": "Utilisateurs",
    "/roles-permissions": "Rôles & permissions",
    "/journal-activite": "Journal d'activité",
    "/parametres": "Paramètres",
  };

  const pageTitle = pageTitles[location.pathname] || "School Manager";

  return (
    <header className="navbar">

      {/* =========================================
          PARTIE GAUCHE
          ========================================= */}
      <div className="navbar-left">

        {/* Bouton menu */}
        <button
          className="menu-button"
          type="button"
          aria-label="Ouvrir le menu"
        >
          <Menu size={22} />
        </button>

        {/* Titre de la page */}
        <div className="page-title">
          <h1>{pageTitle}</h1>
        </div>

        {/* Recherche */}
        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Rechercher..."
          />
        </div>

      </div>


      {/* =========================================
          PARTIE DROITE
          ========================================= */}
      <div className="navbar-right">

        {/* Notifications */}
        <button
          className="icon-button"
          type="button"
          aria-label="Notifications"
        >
          <Bell size={20} />

          <span className="notification-badge">
            3
          </span>
        </button>


        {/* Utilisateur */}
        <div className="user-profile">

          <UserCircle size={34} />

          <div className="user-info">
            <strong>{[user.prenom, user.nom].filter(Boolean).join(" ") || "Utilisateur"}</strong>
            <span>{user.id_role ? `Rôle #${user.id_role}` : "Utilisateur"}</span>
          </div>

          <button
            className="icon-button"
            type="button"
            aria-label="Se déconnecter"
            onClick={handleLogout}
          >
            <LogOut size={19} />
          </button>
        </div>

      </div>

    </header>
  );
}

export default Navbar;
