import { Routes, Route, Navigate } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";

// Authentification
import Login from "../pages/auth/login";

// Dashboard
import Dashboard from "../pages/dashboard/Dashboard";

// Administration
import Etablissements from "../pages/etablissements/Etablissements";
import Utilisateurs from "../pages/utilisateurs/Utilisateurs";
import RolesPermissions from "../pages/roles-permissions/RolesPermissions";
import JournalActivite from "../pages/journal-activite/JournalActivite";
import Parametres from "../pages/parametres/Parametres";

// Scolarité
import AnneesPeriodes from "../pages/annees-periodes/AnneesPeriodes";
import Eleves from "../pages/eleves/Eleves";
import Parents from "../pages/parents/Parents";
import Inscriptions from "../pages/inscriptions/Inscriptions";
import Classes from "../pages/classes/Classes";
import Matieres from "../pages/matieres/Matieres";

// Enseignants
import Enseignants from "../pages/enseignants/Enseignants";
import Affectations from "../pages/affectations/Affectations";

// Pédagogie
import Evaluations from "../pages/evaluations/Evaluations";
import Notes from "../pages/notes/Notes";
import PresencesEleves from "../pages/presences-eleves/PresencesEleves";
import Bulletins from "../pages/bulletins/Bulletins";
import EmploiDuTemps from "../pages/emploi-du-temps/EmploiDuTemps";

// Cahier des maîtres
import CahierMaitre from "../pages/cahier-maitre/CahierMaitre";
import CoursEffectues from "../pages/cours-effectues/CoursEffectues";
import ObservationsEnseignants from "../pages/observations-enseignants/ObservationsEnseignants";

// Honoraires
import Honoraires from "../pages/honoraires/Honoraires";
import PaiementsHonoraires from "../pages/paiements-honoraires/PaiementsHonoraires";

// Finance
import FraisScolaires from "../pages/frais/FraisScolaires";
import Paiements from "../pages/paiements/Paiements";
import Recus from "../pages/recus/Recus";
import Depenses from "../pages/depenses/Depenses";

// Documents
import CartesScolaires from "../pages/cartes/CartesScolaires";

// Communication
import Annonces from "../pages/annonces/Annonces";
import Messages from "../pages/messages/Messages";
import Notifications from "../pages/notifications/Notifications";

function AppRoutes() {
  return (
    <Routes>

      {/* =========================
          AUTHENTIFICATION
          ========================= */}
      <Route path="/login" element={<Login />} />

      {/* =========================
          APPLICATION
          ========================= */}
      <Route path="/" element={<DashboardLayout />}>

        <Route
          index
          element={<Navigate to="/dashboard" replace />}
        />

        {/* DASHBOARD */}
        <Route
          path="dashboard"
          element={<Dashboard />}
        />

        {/* =========================
            ADMINISTRATION
            ========================= */}
        <Route
          path="etablissements"
          element={<Etablissements />}
        />

        <Route
          path="utilisateurs"
          element={<Utilisateurs />}
        />

        <Route
          path="roles-permissions"
          element={<RolesPermissions />}
        />

        <Route
          path="journal-activite"
          element={<JournalActivite />}
        />

        <Route
          path="parametres"
          element={<Parametres />}
        />

        {/* =========================
            SCOLARITÉ
            ========================= */}
        <Route
          path="annees-periodes"
          element={<AnneesPeriodes />}
        />

        <Route
          path="eleves"
          element={<Eleves />}
        />

        <Route
          path="parents"
          element={<Parents />}
        />

        <Route
          path="inscriptions"
          element={<Inscriptions />}
        />

        <Route
          path="classes"
          element={<Classes />}
        />

        <Route
          path="matieres"
          element={<Matieres />}
        />

        {/* =========================
            ENSEIGNANTS
            ========================= */}
        <Route
          path="enseignants"
          element={<Enseignants />}
        />

        <Route
          path="affectations"
          element={<Affectations />}
        />

        {/* =========================
            PÉDAGOGIE
            ========================= */}
        <Route
          path="evaluations"
          element={<Evaluations />}
        />

        <Route
          path="notes"
          element={<Notes />}
        />

        <Route
          path="presences-eleves"
          element={<PresencesEleves />}
        />

        <Route
          path="bulletins"
          element={<Bulletins />}
        />

        <Route
          path="emploi-du-temps"
          element={<EmploiDuTemps />}
        />

        {/* =========================
            CAHIER DES MAÎTRES
            ========================= */}
        <Route
          path="cahier-maitre"
          element={<CahierMaitre />}
        />

        <Route
          path="cours-effectues"
          element={<CoursEffectues />}
        />

        <Route
          path="observations-enseignants"
          element={<ObservationsEnseignants />}
        />

        {/* =========================
            HONORAIRES
            ========================= */}
        <Route
          path="honoraires"
          element={<Honoraires />}
        />

        <Route
          path="paiements-honoraires"
          element={<PaiementsHonoraires />}
        />

        {/* =========================
            FINANCE
            ========================= */}
        <Route
          path="frais"
          element={<FraisScolaires />}
        />

        <Route
          path="paiements"
          element={<Paiements />}
        />

        <Route
          path="recus"
          element={<Recus />}
        />

        <Route
          path="depenses"
          element={<Depenses />}
        />

        {/* =========================
            DOCUMENTS
            ========================= */}
        <Route
          path="cartes"
          element={<CartesScolaires />}
        />

        {/* =========================
            COMMUNICATION
            ========================= */}
        <Route
          path="annonces"
          element={<Annonces />}
        />

        <Route
          path="messages"
          element={<Messages />}
        />

        <Route
          path="notifications"
          element={<Notifications />}
        />

      </Route>

      {/* =========================
          ROUTE INCONNUE
          ========================= */}
      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />

    </Routes>
  );
}

export default AppRoutes;