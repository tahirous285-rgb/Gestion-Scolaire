import { Bell, LogOut, Menu, UserCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const pageTitles = {
  "/dashboard": "Tableau de bord",
  "/eleves": "Élèves",
  "/parents": "Parents",
  "/inscriptions": "Inscriptions",
  "/classes": "Classes",
  "/matieres": "Matières",
  "/annees-periodes": "Années & périodes",
  "/enseignants": "Enseignants",
  "/affectations": "Affectations",
  "/evaluations": "Évaluations",
  "/notes": "Notes",
  "/presences-eleves": "Présences élèves",
  "/bulletins": "Bulletins",
  "/emploi-du-temps": "Emploi du temps",
  "/cahier-maitre": "Présence enseignants",
  "/cours-effectues": "Cours effectués",
  "/observations-enseignants": "Observations enseignants",
  "/honoraires": "Honoraires",
  "/paiements-honoraires": "Paiements honoraires",
  "/frais": "Frais scolaires",
  "/paiements": "Paiements scolaires",
  "/recus": "Reçus",
  "/depenses": "Dépenses",
  "/cartes": "Cartes scolaires",
  "/annonces": "Annonces",
  "/messages": "Messages",
  "/notifications": "Notifications",
  "/etablissements": "Établissements",
  "/utilisateurs": "Utilisateurs",
  "/roles-permissions": "Rôles & permissions",
  "/journal-activite": "Journal d’activité",
  "/parametres": "Paramètres",
};

export default function Navbar({ onMenu }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const title = pageTitles[location.pathname] || "School Manager";
  const displayName = [session?.prenom, session?.nom].filter(Boolean).join(" ") || "Utilisateur";

  function logout() {
    signOut();
    navigate("/login", { replace: true });
  }

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="menu-button" type="button" onClick={onMenu} aria-label="Ouvrir le menu"><Menu size={21} /></button>
        <div className="page-title"><span>ESPACE DE TRAVAIL</span><h1>{title}</h1></div>
      </div>
      <div className="navbar-right">
        <button className="icon-button" type="button" onClick={() => navigate("/notifications")} aria-label="Notifications"><Bell size={19} /></button>
        <div className="user-profile">
          <UserCircle size={34} />
          <div className="user-info"><strong>{displayName}</strong><span>Connecté</span></div>
        </div>
        <button className="logout-button" type="button" onClick={logout} title="Se déconnecter" aria-label="Se déconnecter"><LogOut size={18} /></button>
      </div>
    </header>
  );
}
