import {
  LayoutDashboard,
  School,
  Users,
  GraduationCap,
  ClipboardList,
  BookOpen,
  CalendarDays,
  Wallet,
  Banknote,
  CreditCard,
  IdCard,
  Megaphone,
  MessageSquare,
  Bell,
  Settings,
  UserCog,
  FileText,
  ClipboardCheck,
  Receipt,
} from "lucide-react";

import { NavLink } from "react-router-dom";

function Sidebar() {

  // Classe appliquée automatiquement au menu actif
  const getNavClass = ({ isActive }) =>
    `nav-item ${isActive ? "active" : ""}`;

  return (
    <aside className="sidebar">

      {/* =========================================
          LOGO / NOM DE L'APPLICATION
          ========================================= */}

      <div className="sidebar-header">

        <div className="logo-icon">
          <School size={24} />
        </div>

        <div>
          <h2>School Manager</h2>
          <span>Gestion scolaire</span>
        </div>

      </div>


      {/* =========================================
          NAVIGATION
          ========================================= */}

      <nav className="sidebar-nav">

        {/* =====================================
            PRINCIPAL
            ===================================== */}

        <div className="nav-section">

          <span className="section-title">
            PRINCIPAL
          </span>

          <NavLink
            to="/dashboard"
            className={getNavClass}
          >
            <LayoutDashboard size={19} />
            <span>Tableau de bord</span>
          </NavLink>

        </div>


        {/* =====================================
            SCOLARITÉ
            ===================================== */}

        <div className="nav-section">

          <span className="section-title">
            SCOLARITÉ
          </span>

          <NavLink
            to="/eleves"
            className={getNavClass}
          >
            <GraduationCap size={19} />
            <span>Élèves</span>
          </NavLink>

          <NavLink
            to="/parents"
            className={getNavClass}
          >
            <Users size={19} />
            <span>Parents</span>
          </NavLink>

          <NavLink
            to="/inscriptions"
            className={getNavClass}
          >
            <ClipboardList size={19} />
            <span>Inscriptions</span>
          </NavLink>

          <NavLink
            to="/classes"
            className={getNavClass}
          >
            <School size={19} />
            <span>Classes</span>
          </NavLink>

          <NavLink
            to="/matieres"
            className={getNavClass}
          >
            <BookOpen size={19} />
            <span>Matières</span>
          </NavLink>

          <NavLink
            to="/annees-periodes"
            className={getNavClass}
          >
            <CalendarDays size={19} />
            <span>Années & périodes</span>
          </NavLink>

        </div>


        {/* =====================================
            ENSEIGNANTS
            ===================================== */}

        <div className="nav-section">

          <span className="section-title">
            ENSEIGNANTS
          </span>

          <NavLink
            to="/enseignants"
            className={getNavClass}
          >
            <Users size={19} />
            <span>Enseignants</span>
          </NavLink>

          <NavLink
            to="/affectations"
            className={getNavClass}
          >
            <UserCog size={19} />
            <span>Affectations</span>
          </NavLink>

        </div>


        {/* =====================================
            PÉDAGOGIE
            ===================================== */}

        <div className="nav-section">

          <span className="section-title">
            PÉDAGOGIE
          </span>

          <NavLink
            to="/evaluations"
            className={getNavClass}
          >
            <BookOpen size={19} />
            <span>Évaluations</span>
          </NavLink>

          <NavLink
            to="/notes"
            className={getNavClass}
          >
            <ClipboardList size={19} />
            <span>Notes</span>
          </NavLink>

          <NavLink
            to="/presences-eleves"
            className={getNavClass}
          >
            <ClipboardCheck size={19} />
            <span>Présences élèves</span>
          </NavLink>

          <NavLink
            to="/bulletins"
            className={getNavClass}
          >
            <FileText size={19} />
            <span>Bulletins</span>
          </NavLink>

          <NavLink
            to="/emploi-du-temps"
            className={getNavClass}
          >
            <CalendarDays size={19} />
            <span>Emploi du temps</span>
          </NavLink>

        </div>


        {/* =====================================
            GESTION
            ===================================== */}

        <div className="nav-section">

          <span className="section-title">
            GESTION
          </span>

          <NavLink
            to="/cahier-maitre"
            className={getNavClass}
          >
            <ClipboardList size={19} />
            <span>Cahier des maîtres</span>
          </NavLink>

          <NavLink
            to="/cours-effectues"
            className={getNavClass}
          >
            <ClipboardCheck size={19} />
            <span>Cours effectués</span>
          </NavLink>

          <NavLink
            to="/observations-enseignants"
            className={getNavClass}
          >
            <FileText size={19} />
            <span>Observations enseignants</span>
          </NavLink>

          <NavLink
            to="/honoraires"
            className={getNavClass}
          >
            <Banknote size={19} />
            <span>Honoraires</span>
          </NavLink>

          <NavLink
            to="/paiements-honoraires"
            className={getNavClass}
          >
            <Receipt size={19} />
            <span>Paiements honoraires</span>
          </NavLink>

          <NavLink
            to="/frais"
            className={getNavClass}
          >
            <Wallet size={19} />
            <span>Frais scolaires</span>
          </NavLink>

          <NavLink
            to="/paiements"
            className={getNavClass}
          >
            <CreditCard size={19} />
            <span>Paiements scolaires</span>
          </NavLink>

          <NavLink
            to="/recus"
            className={getNavClass}
          >
            <Receipt size={19} />
            <span>Reçus</span>
          </NavLink>

          <NavLink
            to="/depenses"
            className={getNavClass}
          >
            <Wallet size={19} />
            <span>Dépenses</span>
          </NavLink>

          <NavLink
            to="/cartes"
            className={getNavClass}
          >
            <IdCard size={19} />
            <span>Cartes scolaires</span>
          </NavLink>

        </div>


        {/* =====================================
            COMMUNICATION
            ===================================== */}

        <div className="nav-section">

          <span className="section-title">
            COMMUNICATION
          </span>

          <NavLink
            to="/annonces"
            className={getNavClass}
          >
            <Megaphone size={19} />
            <span>Annonces</span>
          </NavLink>

          <NavLink
            to="/messages"
            className={getNavClass}
          >
            <MessageSquare size={19} />
            <span>Messages</span>
          </NavLink>

          <NavLink
            to="/notifications"
            className={getNavClass}
          >
            <Bell size={19} />
            <span>Notifications</span>
          </NavLink>

        </div>


        {/* =====================================
            ADMINISTRATION
            ===================================== */}

        <div className="nav-section">

          <span className="section-title">
            ADMINISTRATION
          </span>

          <NavLink
            to="/etablissements"
            className={getNavClass}
          >
            <School size={19} />
            <span>Établissement</span>
          </NavLink>

          <NavLink
            to="/utilisateurs"
            className={getNavClass}
          >
            <Users size={19} />
            <span>Utilisateurs</span>
          </NavLink>

          <NavLink
            to="/roles-permissions"
            className={getNavClass}
          >
            <UserCog size={19} />
            <span>Rôles & permissions</span>
          </NavLink>

          <NavLink
            to="/journal-activite"
            className={getNavClass}
          >
            <ClipboardList size={19} />
            <span>Journal d'activité</span>
          </NavLink>

          <NavLink
            to="/parametres"
            className={getNavClass}
          >
            <Settings size={19} />
            <span>Paramètres</span>
          </NavLink>

        </div>

      </nav>

    </aside>
  );
}

export default Sidebar;