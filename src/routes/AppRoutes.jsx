import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import DashboardLayout from "../layouts/DashboardLayout";

import Login from "../pages/auth/login";
import Dashboard from "../pages/dashboard/Dashboard";

import Etablissements from "../pages/etablissements/Etablissements";
import Utilisateurs from "../pages/utilisateurs/Utilisateurs";
import RolesPermissions from "../pages/roles-permissions/RolesPermissions";
import JournalActivite from "../pages/journal-activite/JournalActivite";
import Parametres from "../pages/parametres/Parametres";

import AnneesPeriodes from "../pages/annees-periodes/AnneesPeriodes";
import Eleves from "../pages/eleves/Eleves";
import Parents from "../pages/parents/Parents";
import Inscriptions from "../pages/inscriptions/Inscriptions";
import Classes from "../pages/classes/Classes";
import Matieres from "../pages/matieres/Matieres";

import Enseignants from "../pages/enseignants/Enseignants";
import Affectations from "../pages/affectations/Affectations";

import Evaluations from "../pages/evaluations/Evaluations";
import Notes from "../pages/notes/Notes";
import PresencesEleves from "../pages/presences-eleves/PresencesEleves";
import Bulletins from "../pages/bulletins/Bulletins";
import EmploiDuTemps from "../pages/emploi-du-temps/EmploiDuTemps";

import CahierMaitre from "../pages/cahier-maitre/CahierMaitre";
import CoursEffectues from "../pages/cours-effectues/CoursEffectues";
import ObservationsEnseignants from "../pages/observations-enseignants/ObservationsEnseignants";

import Honoraires from "../pages/honoraires/Honoraires";
import PaiementsHonoraires from "../pages/paiements-honoraires/PaiementsHonoraires";

import FraisScolaires from "../pages/frais/FraisScolaires";
import Paiements from "../pages/paiements/Paiements";
import Recus from "../pages/recus/Recus";
import Depenses from "../pages/depenses/Depenses";

import CartesScolaires from "../pages/cartes/CartesScolaires";
import Annonces from "../pages/annonces/Annonces";
import Messages from "../pages/messages/Messages";
import Notifications from "../pages/notifications/Notifications";

function AuthGate({ error, onRetry }) {
  return (
    <main className="auth-gate" aria-live="polite">
      <section className="auth-gate-card">
        {error ? (
          <>
            <h1>Session non vérifiée</h1>
            <p role="alert">
              L’accès privé reste bloqué car le serveur n’a pas pu vérifier la session.
              {error ? ` ${error}` : ""}
            </p>
            <div className="auth-gate-actions">
              <button className="crud-primary" type="button" onClick={onRetry}>Réessayer</button>
              <Link to="/login">Aller à la connexion</Link>
            </div>
          </>
        ) : (
          <p role="status">Vérification de la session auprès du serveur…</p>
        )}
      </section>
    </main>
  );
}

function ProtectedRoute({ children }) {
  const { authStatus, authError, retryVerification } = useAuth();
  const location = useLocation();
  if (authStatus === "checking") return <AuthGate />;
  if (authStatus === "error") return <AuthGate error={authError} onRetry={retryVerification} />;
  return authStatus === "authenticated"
    ? children
    : <Navigate to="/login" replace state={{ from: location }} />;
}

function PublicOnlyRoute({ children }) {
  const { authStatus } = useAuth();
  if (authStatus === "checking") return <AuthGate />;
  return authStatus === "authenticated" ? <Navigate to="/dashboard" replace /> : children;
}

export default function AppRoutes() {
  const { authStatus, session, authError, retryVerification } = useAuth();
  const sessionKey = `${session?.id_etablissement || ""}:${session?.id_utilisateur || ""}:${session?.access_token || ""}`;

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout key={sessionKey} />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        <Route path="etablissements" element={<Etablissements />} />
        <Route path="utilisateurs" element={<Utilisateurs />} />
        <Route path="roles-permissions" element={<RolesPermissions />} />
        <Route path="journal-activite" element={<JournalActivite />} />
        <Route path="parametres" element={<Parametres />} />

        <Route path="annees-periodes" element={<AnneesPeriodes />} />
        <Route path="eleves" element={<Eleves />} />
        <Route path="parents" element={<Parents />} />
        <Route path="inscriptions" element={<Inscriptions />} />
        <Route path="classes" element={<Classes />} />
        <Route path="matieres" element={<Matieres />} />

        <Route path="enseignants" element={<Enseignants />} />
        <Route path="affectations" element={<Affectations />} />

        <Route path="evaluations" element={<Evaluations />} />
        <Route path="notes" element={<Notes />} />
        <Route path="presences-eleves" element={<PresencesEleves />} />
        <Route path="bulletins" element={<Bulletins />} />
        <Route path="emploi-du-temps" element={<EmploiDuTemps />} />

        <Route path="cahier-maitre" element={<CahierMaitre />} />
        <Route path="cours-effectues" element={<CoursEffectues />} />
        <Route path="observations-enseignants" element={<ObservationsEnseignants />} />

        <Route path="honoraires" element={<Honoraires />} />
        <Route path="paiements-honoraires" element={<PaiementsHonoraires />} />

        <Route path="frais" element={<FraisScolaires />} />
        <Route path="paiements" element={<Paiements />} />
        <Route path="recus" element={<Recus />} />
        <Route path="depenses" element={<Depenses />} />

        <Route path="cartes" element={<CartesScolaires />} />
        <Route path="annonces" element={<Annonces />} />
        <Route path="messages" element={<Messages />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      <Route
        path="*"
        element={
          authStatus === "checking" ? <AuthGate />
            : authStatus === "error" ? <AuthGate error={authError} onRetry={retryVerification} />
              : <Navigate to={authStatus === "authenticated" ? "/dashboard" : "/login"} replace />
        }
      />
    </Routes>
  );
}
