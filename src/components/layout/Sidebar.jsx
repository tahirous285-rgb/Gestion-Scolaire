import {
  Banknote, Bell, BookOpen, CalendarDays, CheckSquare, ClipboardCheck, ClipboardList,
  CreditCard, FileText, GraduationCap, IdCard, LayoutDashboard, Megaphone, MessageSquare,
  Receipt, School, Settings, UserCog, Users, Wallet, X,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const sections = [
  {
    label: "PRINCIPAL",
    items: [
      ["/dashboard", "Tableau de bord", LayoutDashboard],
      ["/eleves", "Élèves", GraduationCap],
      ["/parents", "Parents", Users],
      ["/inscriptions", "Inscriptions", ClipboardList],
    ],
  },
  {
    label: "SCOLARITÉ",
    items: [
      ["/annees-periodes", "Années & périodes", CalendarDays],
      ["/classes", "Classes", School],
      ["/matieres", "Matières", BookOpen],
    ],
  },
  {
    label: "ENSEIGNANTS",
    items: [
      ["/enseignants", "Enseignants", Users],
      ["/affectations", "Affectations", ClipboardCheck],
    ],
  },
  {
    label: "PÉDAGOGIE",
    items: [
      ["/evaluations", "Évaluations", FileText],
      ["/notes", "Notes", CheckSquare],
      ["/presences-eleves", "Présences élèves", ClipboardList],
      ["/bulletins", "Bulletins", FileText],
      ["/emploi-du-temps", "Emploi du temps", CalendarDays],
    ],
  },
  {
    label: "CAHIER DES MAÎTRES",
    items: [
      ["/cahier-maitre", "Présence enseignants", CheckSquare],
      ["/cours-effectues", "Cours effectués", BookOpen],
      ["/observations-enseignants", "Observations", ClipboardList],
    ],
  },
  {
    label: "FINANCES",
    items: [
      ["/honoraires", "Honoraires", Banknote],
      ["/paiements-honoraires", "Paiements honoraires", Receipt],
      ["/frais", "Frais scolaires", Wallet],
      ["/paiements", "Paiements scolaires", CreditCard],
      ["/recus", "Reçus", Receipt],
      ["/depenses", "Dépenses", Wallet],
      ["/cartes", "Cartes scolaires", IdCard],
    ],
  },
  {
    label: "COMMUNICATION",
    items: [
      ["/annonces", "Annonces", Megaphone],
      ["/messages", "Messages", MessageSquare],
      ["/notifications", "Notifications", Bell],
    ],
  },
  {
    label: "ADMINISTRATION",
    items: [
      ["/etablissements", "Établissements", School],
      ["/utilisateurs", "Utilisateurs", Users],
      ["/roles-permissions", "Rôles & permissions", UserCog],
      ["/journal-activite", "Journal d’activité", ClipboardList],
      ["/parametres", "Paramètres", Settings],
    ],
  },
];

export default function Sidebar({ open, onNavigate }) {
  const navClass = ({ isActive }) => `nav-item${isActive ? " active" : ""}`;

  return (
    <aside className={`sidebar${open ? " open" : ""}`}>
      <div className="sidebar-header">
        <div className="logo-icon"><School size={22} /></div>
        <div><h2>School Manager</h2><span>Gestion scolaire</span></div>
        <button className="sidebar-close" type="button" onClick={onNavigate} aria-label="Fermer le menu"><X size={18} /></button>
      </div>
      <nav className="sidebar-nav">
        {sections.map((section) => (
          <div className="nav-section" key={section.label}>
            <span className="section-title">{section.label}</span>
            {section.items.map(([to, label, Icon]) => (
              <NavLink key={to} to={to} className={navClass} onClick={onNavigate}>
                <Icon size={17} strokeWidth={1.9} /><span>{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
