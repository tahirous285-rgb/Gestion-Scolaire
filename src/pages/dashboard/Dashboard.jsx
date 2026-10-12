import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Banknote,
  BookOpen,
  Clock3,
  GraduationCap,
  RefreshCw,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import { establishmentId } from "../../services/apiClient";
import { getDashboard } from "../../services/dashboardApi";
import { formatDateTime, formatMoney } from "../pageUtils";

const emptyStats = {
  eleves: 0,
  enseignants: 0,
  classes: 0,
  parents: 0,
  presences_jour: { presents: 0, absents: 0, retards: 0, excuses: 0 },
  finances: { recettes: 0, depenses: 0 },
  activites_recentes: [],
};

function numericValue(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function normalizeDashboard(payload) {
  const source = payload?.data && typeof payload.data === "object" ? payload.data : payload;
  const data = source && typeof source === "object" ? source : {};
  const presences = data.presences_jour && typeof data.presences_jour === "object"
    ? data.presences_jour
    : {};
  const finances = data.finances && typeof data.finances === "object" ? data.finances : {};

  return {
    ...emptyStats,
    ...data,
    eleves: numericValue(data.eleves),
    enseignants: numericValue(data.enseignants),
    classes: numericValue(data.classes),
    parents: numericValue(data.parents),
    presences_jour: {
      presents: numericValue(presences.presents),
      absents: numericValue(presences.absents),
      retards: numericValue(presences.retards),
      excuses: numericValue(presences.excuses),
    },
    finances: {
      recettes: numericValue(finances.recettes),
      depenses: numericValue(finances.depenses),
    },
    activites_recentes: Array.isArray(data.activites_recentes) ? data.activites_recentes : [],
  };
}

function currentDateLabel() {
  return new Date().toLocaleDateString("fr-FR", { dateStyle: "long" });
}

export default function Dashboard() {
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await getDashboard(establishmentId());
      setStats(normalizeDashboard(payload));
      setLastUpdated(new Date());
    } catch (requestError) {
      setError(requestError.message || "Impossible de charger les indicateurs du tableau de bord.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const cards = [
    { label: "Élèves actifs", value: stats.eleves, hint: "inscrits dans l’établissement", icon: GraduationCap, tone: "blue" },
    { label: "Enseignants actifs", value: stats.enseignants, hint: "membres de l’équipe", icon: Users, tone: "violet" },
    { label: "Classes actives", value: stats.classes, hint: "groupes pédagogiques", icon: BookOpen, tone: "amber" },
    { label: "Parents", value: stats.parents, hint: "contacts enregistrés", icon: UserCheck, tone: "green" },
  ];

  const soldeNet = stats.finances.recettes - stats.finances.depenses;

  return (
    <div className="dashboard-page" aria-busy={loading}>
      <div className="dashboard-welcome">
        <div>
          <div className="crud-eyebrow">Vue d’ensemble</div>
          <h1>Bonjour, bienvenue 👋</h1>
          <p>Les indicateurs de votre établissement sont chargés depuis l’API.</p>
        </div>
        <div className="dashboard-header-actions">
          <div className="dashboard-date">
            Aujourd’hui
            <strong>{currentDateLabel()}</strong>
            <span className="dashboard-last-updated">
              {lastUpdated
                ? "Actualisé à " + lastUpdated.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
                : "En attente des données"}
            </span>
          </div>
          <button
            className="crud-secondary dashboard-refresh"
            type="button"
            onClick={refresh}
            disabled={loading}
            aria-label="Actualiser les indicateurs"
          >
            <RefreshCw size={16} className={loading ? "refresh-spinning" : ""} />
            {loading ? "Actualisation…" : "Actualiser"}
          </button>
        </div>
      </div>

      {error && (
        <div className="crud-alert" role="alert">
          <span>⚠️ {error}</span>
          <button className="crud-secondary" type="button" onClick={refresh} disabled={loading}>
            Réessayer
          </button>
        </div>
      )}

      <div className="dashboard-stats">
        {cards.map(({ label, value, hint, icon: Icon, tone }) => (
          <div className={"stat-card " + tone} key={label}>
            <div className="stat-icon"><Icon size={21} /></div>
            <div>
              <span>{label}</span>
              <strong>{loading && !lastUpdated ? "—" : value.toLocaleString("fr-FR")}</strong>
              <small>{hint}</small>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-card">
          <div className="dashboard-card-head">
            <div>
              <span className="crud-eyebrow">Présences élèves</span>
              <h2>Aujourd’hui</h2>
            </div>
            <Activity size={20} />
          </div>
          <div className="presence-list">
            <div className="presence-row">
              <span><i className="presence-dot present" />Présents</span>
              <strong>{loading && !lastUpdated ? "—" : stats.presences_jour.presents.toLocaleString("fr-FR")}</strong>
            </div>
            <div className="presence-row">
              <span><i className="presence-dot absent" />Absents</span>
              <strong>{loading && !lastUpdated ? "—" : stats.presences_jour.absents.toLocaleString("fr-FR")}</strong>
            </div>
            <div className="presence-row">
              <span><i className="presence-dot late" />Retards</span>
              <strong>{loading && !lastUpdated ? "—" : stats.presences_jour.retards.toLocaleString("fr-FR")}</strong>
            </div>
            <div className="presence-row">
              <span><i className="presence-dot excuse" />Excusés</span>
              <strong>{loading && !lastUpdated ? "—" : stats.presences_jour.excuses.toLocaleString("fr-FR")}</strong>
            </div>
          </div>
        </section>

        <section className="dashboard-card">
          <div className="dashboard-card-head">
            <div>
              <span className="crud-eyebrow">Finance</span>
              <h2>Flux enregistrés</h2>
            </div>
            <Banknote size={20} />
          </div>
          <div className="finance-summary">
            <div>
              <span><Wallet size={16} /> Recettes</span>
              <strong>{loading && !lastUpdated ? "—" : formatMoney(stats.finances.recettes)}</strong>
            </div>
            <div>
              <span><Wallet size={16} /> Dépenses</span>
              <strong>{loading && !lastUpdated ? "—" : formatMoney(stats.finances.depenses)}</strong>
            </div>
            <div className="finance-net">
              <span>Solde net estimé</span>
              <strong className={soldeNet < 0 ? "negative" : "positive"}>
                {loading && !lastUpdated ? "—" : formatMoney(soldeNet)}
              </strong>
            </div>
          </div>
          <p className="dashboard-footnote">Solde calculé à partir des recettes et dépenses renvoyées par le tableau de bord.</p>
        </section>
      </div>

      <section className="dashboard-card activity-card">
        <div className="dashboard-card-head">
          <div>
            <span className="crud-eyebrow">Journal</span>
            <h2>Activités récentes</h2>
          </div>
          <Activity size={20} />
        </div>
        {loading && !lastUpdated ? (
          <div className="empty-inline"><Clock3 size={18} /> Chargement des activités…</div>
        ) : stats.activites_recentes.length === 0 ? (
          <div className="empty-inline"><Clock3 size={18} /> Aucune activité renvoyée par l’API.</div>
        ) : (
          <div className="activity-list">
            {stats.activites_recentes.map((activity, index) => (
              <div className="activity-row" key={activity.id_journal ?? activity.id ?? (activity.date_action + "-" + index)}>
                <span className="activity-marker" />
                <div>
                  <strong>{activity.action || "Activité enregistrée"}</strong>
                  <span>{activity.module || "—"} · {formatDateTime(activity.date_action)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
