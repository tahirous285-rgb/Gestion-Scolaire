import { useEffect, useState } from "react";
import {
  GraduationCap,
  Users,
  School,
  UserRound,
  Wallet,
  UserCheck,
  UserX,
  Clock3,
  UserRoundCheck,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

import { getDashboard } from "../../services/dashboardApi";

import "./Dashboard.css";

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  /**
   * Pour le moment, l'authentification n'est pas encore connectée
   * au backend.
   *
   * Priorité :
   * 1. localStorage
   * 2. variable Vite
   * 3. valeur temporaire 2
   *
   * Le "2" sera supprimé lorsque le système d'authentification
   * fournira automatiquement l'établissement connecté.
   */
  const getIdEtablissement = () => {
    const storedId = localStorage.getItem("id_etablissement");

    if (storedId) {
      return Number(storedId);
    }

    if (import.meta.env.VITE_ID_ETABLISSEMENT) {
      return Number(import.meta.env.VITE_ID_ETABLISSEMENT);
    }

    return 2;
  };

  /**
   * Charger le Dashboard
   */
  const chargerDashboard = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const idEtablissement = getIdEtablissement();

      const data = await getDashboard(idEtablissement);

      setDashboard(data);
    } catch (err) {
      console.error("Erreur Dashboard :", err);

      setError(
        err.message ||
          "Impossible de récupérer les données du Dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Chargement initial
   */
  useEffect(() => {
    chargerDashboard();
  }, []);

  /**
   * Actualisation manuelle
   */
  const handleRefresh = () => {
    chargerDashboard(true);
  };

  /**
   * Formatage des montants
   */
  const formatMontant = (montant) => {
    return new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(Number(montant || 0));
  };

  /**
   * État de chargement
   */
  if (loading) {
    return (
      <div className="dashboard-state">
        <div className="dashboard-loader">
          <RefreshCw
            size={30}
            className="dashboard-spinner"
          />
        </div>

        <h3>Chargement du Dashboard...</h3>

        <p>
          Récupération des statistiques de votre établissement.
        </p>
      </div>
    );
  }

  /**
   * Erreur
   */
  if (error) {
    return (
      <div className="dashboard-state dashboard-error">
        <div className="dashboard-state-icon">
          <AlertTriangle size={32} />
        </div>

        <h3>Impossible de charger le Dashboard</h3>

        <p>{error}</p>

        <button
          type="button"
          className="dashboard-refresh-btn"
          onClick={() => chargerDashboard()}
        >
          <RefreshCw size={17} />
          Réessayer
        </button>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  const stats = [
    {
      titre: "Élèves",
      valeur: dashboard.eleves || 0,
      description: "Élèves actifs",
      icone: GraduationCap,
    },
    {
      titre: "Enseignants",
      valeur: dashboard.enseignants || 0,
      description: "Enseignants actifs",
      icone: Users,
    },
    {
      titre: "Classes",
      valeur: dashboard.classes || 0,
      description: "Classes actives",
      icone: School,
    },
    {
      titre: "Parents",
      valeur: dashboard.parents || 0,
      description: "Parents enregistrés",
      icone: UserRound,
    },
  ];

  const presences = dashboard.presences_jour || {
    presents: 0,
    absents: 0,
    retards: 0,
    excuses: 0,
  };

  const finances = dashboard.finances || {
    recettes: 0,
    depenses: 0,
  };

  return (
    <div className="dashboard">

      {/* =====================================
          EN-TÊTE
      ====================================== */}

      <div className="dashboard-header">
        <div>
          <span className="dashboard-eyebrow">
            TABLEAU DE BORD
          </span>

          <h2>
            Bonjour, Administrateur 👋
          </h2>

          <p>
            Voici un aperçu de la situation actuelle
            de votre établissement.
          </p>
        </div>

        <button
          type="button"
          className="dashboard-refresh-btn"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={
              refreshing ? "dashboard-spinner" : ""
            }
          />

          {refreshing ? "Actualisation..." : "Actualiser"}
        </button>
      </div>

      {/* =====================================
          STATISTIQUES PRINCIPALES
      ====================================== */}

      <div className="dashboard-stats">
        {stats.map((stat) => {
          const Icon = stat.icone;

          return (
            <div
              className="stat-card"
              key={stat.titre}
            >
              <div className="stat-icon">
                <Icon size={25} />
              </div>

              <div className="stat-content">
                <span>{stat.titre}</span>

                <strong>
                  {stat.valeur}
                </strong>

                <small>
                  {stat.description}
                </small>
              </div>
            </div>
          );
        })}
      </div>

      {/* =====================================
          CONTENU PRINCIPAL
      ====================================== */}

      <div className="dashboard-grid">

        {/* ===================================
            PRÉSENCES
        ==================================== */}

        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h3>
                Présences des élèves
              </h3>

              <p>
                Situation d'aujourd'hui
              </p>
            </div>

            <div className="card-header-icon">
              <UserRoundCheck size={21} />
            </div>
          </div>

          <div className="presence-list">

            {/* Présents */}
            <div className="presence-item">
              <div className="presence-left">
                <div className="presence-icon presence-success">
                  <UserCheck size={20} />
                </div>

                <div>
                  <span>Présents</span>

                  <small>
                    Élèves présents
                  </small>
                </div>
              </div>

              <strong>
                {presences.presents || 0}
              </strong>
            </div>

            {/* Absents */}
            <div className="presence-item">
              <div className="presence-left">
                <div className="presence-icon presence-danger">
                  <UserX size={20} />
                </div>

                <div>
                  <span>Absents</span>

                  <small>
                    Élèves absents
                  </small>
                </div>
              </div>

              <strong>
                {presences.absents || 0}
              </strong>
            </div>

            {/* Retards */}
            <div className="presence-item">
              <div className="presence-left">
                <div className="presence-icon presence-warning">
                  <Clock3 size={20} />
                </div>

                <div>
                  <span>Retards</span>

                  <small>
                    Élèves en retard
                  </small>
                </div>
              </div>

              <strong>
                {presences.retards || 0}
              </strong>
            </div>

            {/* Excusés */}
            <div className="presence-item">
              <div className="presence-left">
                <div className="presence-icon presence-info">
                  <UserRoundCheck size={20} />
                </div>

                <div>
                  <span>Excusés</span>

                  <small>
                    Absences justifiées
                  </small>
                </div>
              </div>

              <strong>
                {presences.excuses || 0}
              </strong>
            </div>

          </div>
        </div>

        {/* ===================================
            FINANCES
        ==================================== */}

        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h3>
                Situation financière
              </h3>

              <p>
                Données enregistrées
              </p>
            </div>

            <div className="card-header-icon">
              <Wallet size={21} />
            </div>
          </div>

          <div className="finance-list">

            {/* Recettes */}
            <div className="finance-item">
              <div>
                <span className="finance-label">
                  Recettes
                </span>

                <small>
                  Paiements validés
                </small>
              </div>

              <strong>
                {formatMontant(finances.recettes)}
                <span> FCFA</span>
              </strong>
            </div>

            {/* Dépenses */}
            <div className="finance-item">
              <div>
                <span className="finance-label">
                  Dépenses
                </span>

                <small>
                  Dépenses enregistrées
                </small>
              </div>

              <strong>
                {formatMontant(finances.depenses)}
                <span> FCFA</span>
              </strong>
            </div>

            {/* Solde calculé côté frontend */}
            <div className="finance-total">
              <div>
                <span>
                  Solde
                </span>

                <small>
                  Recettes - dépenses
                </small>
              </div>

              <strong>
                {formatMontant(
                  Number(finances.recettes || 0) -
                  Number(finances.depenses || 0)
                )}
                <span> FCFA</span>
              </strong>
            </div>

          </div>
        </div>

      </div>

      {/* =====================================
          ACTIVITÉS
      ====================================== */}

      <div className="dashboard-card dashboard-info-card">

        <div className="card-header">
          <div>
            <h3>
              Activités récentes
            </h3>

            <p>
              Fonctionnalité en attente côté API
            </p>
          </div>

          <div className="card-header-icon">
            <RefreshCw size={21} />
          </div>
        </div>

        <div className="dashboard-info-content">
          <p>
            Le backend actuel fournit les statistiques
            du Dashboard, les présences et les données
            financières, mais aucune route ne fournit
            encore les activités récentes.
          </p>

          <span>
            Cette section sera reliée au Journal d'activité
            lorsque son endpoint API sera disponible.
          </span>
        </div>

      </div>

    </div>
  );
}

export default Dashboard;