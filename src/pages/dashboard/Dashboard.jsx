import {
  GraduationCap,
  Users,
  School,
  Wallet,
  UserCheck,
  UserX,
  Clock,
} from "lucide-react";

function Dashboard() {
  // Données temporaires de démonstration.
  // Elles seront remplacées plus tard par les données de FastAPI.
  const statistiques = [
    {
      titre: "Élèves",
      valeur: "245",
      description: "Élèves inscrits",
      icone: GraduationCap,
    },
    {
      titre: "Enseignants",
      valeur: "18",
      description: "Enseignants actifs",
      icone: Users,
    },
    {
      titre: "Classes",
      valeur: "12",
      description: "Classes actives",
      icone: School,
    },
    {
      titre: "Paiements",
      valeur: "2 450 000 FCFA",
      description: "Paiements enregistrés",
      icone: Wallet,
    },
  ];

  return (
    <div className="dashboard">

      {/* =========================================
          EN-TÊTE
          ========================================= */}

      <div className="dashboard-header">
        <div>
          <h2>Bonjour, Administrateur 👋</h2>
          <p>
            Voici un aperçu de votre établissement.
          </p>
        </div>
      </div>


      {/* =========================================
          STATISTIQUES
          ========================================= */}

      <div className="dashboard-stats">

        {statistiques.map((statistique) => {
          const Icon = statistique.icone;

          return (
            <div
              className="stat-card"
              key={statistique.titre}
            >
              <div className="stat-icon">
                <Icon size={24} />
              </div>

              <div className="stat-content">
                <span>{statistique.titre}</span>

                <strong>{statistique.valeur}</strong>

                <small>
                  {statistique.description}
                </small>
              </div>
            </div>
          );
        })}

      </div>


      {/* =========================================
          PRÉSENCES DES ÉLÈVES
          ========================================= */}

      <div className="dashboard-grid">

        <div className="dashboard-card">

          <div className="card-header">
            <div>
              <h3>Présences des élèves</h3>
              <p>Aujourd'hui</p>
            </div>
          </div>

          <div className="presence-list">

            <div className="presence-item">
              <div className="presence-left">
                <div className="presence-icon">
                  <UserCheck size={20} />
                </div>

                <span>Présents</span>
              </div>

              <strong>220</strong>
            </div>


            <div className="presence-item">
              <div className="presence-left">
                <div className="presence-icon">
                  <UserX size={20} />
                </div>

                <span>Absents</span>
              </div>

              <strong>18</strong>
            </div>


            <div className="presence-item">
              <div className="presence-left">
                <div className="presence-icon">
                  <Clock size={20} />
                </div>

                <span>Retards</span>
              </div>

              <strong>7</strong>
            </div>

          </div>

        </div>


        {/* =========================================
            ACTIVITÉS RÉCENTES
            ========================================= */}

        <div className="dashboard-card">

          <div className="card-header">
            <div>
              <h3>Activités récentes</h3>
              <p>Dernières opérations</p>
            </div>
          </div>

          <div className="activity-list">

            <div className="activity-item">
              <span className="activity-dot"></span>

              <div>
                <strong>Nouvelle inscription</strong>
                <p>Un nouvel élève a été inscrit.</p>
              </div>
            </div>


            <div className="activity-item">
              <span className="activity-dot"></span>

              <div>
                <strong>Paiement enregistré</strong>
                <p>Un paiement scolaire a été enregistré.</p>
              </div>
            </div>


            <div className="activity-item">
              <span className="activity-dot"></span>

              <div>
                <strong>Nouvelle note</strong>
                <p>Une note a été saisie.</p>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;