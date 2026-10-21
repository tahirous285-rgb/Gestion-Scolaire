import { useCallback, useEffect, useRef, useState } from "react";
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
import { useAuth } from "../../hooks/useAuth";
import { DATA_CHANGED_EVENT, establishmentId } from "../../services/apiClient";
import { getDashboard } from "../../services/dashboardApi";
import { formatDateTime } from "../pageUtils";

const countFields = ["eleves", "enseignants", "classes", "parents"];
const presenceFields = ["presents", "absents", "retards", "excuses"];
const financeFields = ["recettes", "depenses"];

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isCount(value) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isAmount(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeDashboard(data) {
  const result = {
    counts: {},
    attendance: null,
    finances: null,
    activities: null,
    unavailable: [],
  };

  if (!isRecord(data)) {
    return {
      ...result,
      unavailable: ["La réponse du tableau de bord n’a pas le format attendu."],
    };
  }

  countFields.forEach((field) => {
    if (isCount(data[field])) {
      result.counts[field] = data[field];
    } else {
      result.counts[field] = null;
      const labels = {
        eleves: "Élèves actifs",
        enseignants: "Enseignants actifs",
        classes: "Classes actives",
        parents: "Parents",
      };
      result.unavailable.push(
        `Indicateur « ${labels[field]} » absent ou invalide.`,
      );
    }
  });

  if (
    isRecord(data.presences_jour) &&
    presenceFields.every((field) => isCount(data.presences_jour[field]))
  ) {
    result.attendance = data.presences_jour;
  } else {
    result.unavailable.push("Données de présence absentes ou invalides.");
  }

  if (
    isRecord(data.finances) &&
    financeFields.every((field) => isAmount(data.finances[field]))
  ) {
    result.finances = data.finances;
  } else {
    result.unavailable.push("Données financières absentes ou invalides.");
  }

  if (
    Array.isArray(data.activites_recentes) &&
    data.activites_recentes.every(
      (activity) =>
        isRecord(activity) &&
        Number.isInteger(activity.id_journal) &&
        typeof activity.action === "string" &&
        typeof activity.date_action === "string",
    )
  ) {
    result.activities = data.activites_recentes;
  } else {
    result.unavailable.push("Activités récentes absentes ou invalides.");
  }

  return result;
}

function formatCount(value) {
  return value === null ? "—" : value.toLocaleString("fr-FR");
}

function formatMoney(value) {
  return value === null
    ? "—"
    : `${value.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} FCFA`;
}

function formatRefreshTime(value) {
  if (!value) return "";
  return value.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dashboardError(error) {
  if (error?.status === 401) {
    return "Session expirée ou invalide. Veuillez vous reconnecter.";
  }
  if (error?.status === 403) {
    return "Accès refusé : votre compte n’est pas autorisé à consulter ces statistiques.";
  }
  return error?.message || "Impossible de charger les statistiques.";
}

export default function Dashboard() {
  const { dashboardData: verifiedDashboard } = useAuth();
  const [initialData] = useState(() => verifiedDashboard);
  const [snapshot, setSnapshot] = useState(() =>
    initialData === null ? null : normalizeDashboard(initialData),
  );
  const [loading, setLoading] = useState(initialData === null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(() =>
    initialData === null ? null : new Date(),
  );
  const requestIdRef = useRef(0);
  const debounceTimerRef = useRef(null);
  const hasSnapshotRef = useRef(initialData !== null);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setRefreshing(true);
    setLoading((current) => current || !hasSnapshotRef.current);
    setError("");

    try {
      const data = await getDashboard(establishmentId());
      const nextSnapshot = normalizeDashboard(data);
      if (requestId !== requestIdRef.current) return;
      hasSnapshotRef.current = true;
      setSnapshot(nextSnapshot);
      setLastUpdated(new Date());
      setError("");
    } catch (requestError) {
      if (requestId === requestIdRef.current) {
        setError(dashboardError(requestError));
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const initialLoadTimer =
      initialData === null
        ? window.setTimeout(refresh, 0)
        : null;

    function scheduleRefresh() {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = window.setTimeout(() => {
        debounceTimerRef.current = null;
        refresh();
      }, 150);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") scheduleRefresh();
    }

    window.addEventListener(DATA_CHANGED_EVENT, scheduleRefresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      requestIdRef.current += 1;
      if (initialLoadTimer !== null) {
        window.clearTimeout(initialLoadTimer);
      }
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
      window.removeEventListener(DATA_CHANGED_EVENT, scheduleRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [initialData, refresh]);

  const counts = snapshot?.counts || {};
  const attendance = snapshot?.attendance;
  const finances = snapshot?.finances;
  const activities = snapshot?.activities;
  const cards = [
    {
      label: "Élèves actifs",
      value: counts.eleves ?? null,
      hint: "dossiers actifs dans l’établissement",
      icon: GraduationCap,
      tone: "blue",
    },
    {
      label: "Enseignants actifs",
      value: counts.enseignants ?? null,
      hint: "membres actifs de l’équipe",
      icon: Users,
      tone: "violet",
    },
    {
      label: "Classes actives",
      value: counts.classes ?? null,
      hint: "groupes pédagogiques actifs",
      icon: BookOpen,
      tone: "amber",
    },
    {
      label: "Parents",
      value: counts.parents ?? null,
      hint: "contacts enregistrés",
      icon: UserCheck,
      tone: "green",
    },
  ];
  const financialBalance =
    finances === null ? null : finances.recettes - finances.depenses;

  return (
    <div className="dashboard-page">
      <div className="dashboard-welcome">
        <div>
          <div className="crud-eyebrow">Vue d’ensemble</div>
          <h1>Bonjour, bienvenue 👋</h1>
          <p>Indicateurs fournis par l’API pour l’établissement de votre session.</p>
        </div>
        <div className="dashboard-header-actions">
          <div className="dashboard-date">
            Aujourd’hui
            <strong>
              {new Date().toLocaleDateString("fr-FR", { dateStyle: "long" })}
            </strong>
            {lastUpdated && (
              <span className="dashboard-last-updated" role="status">
                Synchronisé à {formatRefreshTime(lastUpdated)}
              </span>
            )}
          </div>
          <button
            className="crud-secondary dashboard-refresh"
            type="button"
            onClick={refresh}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={refreshing ? "refresh-spinning" : ""}
              aria-hidden="true"
            />
            {refreshing ? "Actualisation…" : "Actualiser"}
          </button>
        </div>
      </div>

      {error && (
        <div className="crud-alert" role="alert">
          <span>⚠️ {error}</span>
          <button
            className="crud-secondary"
            type="button"
            onClick={refresh}
            disabled={refreshing}
          >
            Réessayer
          </button>
        </div>
      )}
      {snapshot?.unavailable.length > 0 && (
        <div className="crud-alert" role="alert">
          Certaines statistiques ne sont pas fournies correctement par l’API :{" "}
          {snapshot.unavailable.join(" ")}
        </div>
      )}

      <div className="dashboard-stats">
        {cards.map(({ label, value, hint, icon: Icon, tone }) => (
          <div className={`stat-card ${tone}`} key={label}>
            <div className="stat-icon">
              <Icon size={21} />
            </div>
            <div>
              <span>{label}</span>
              <strong>{loading ? "…" : formatCount(value)}</strong>
              <small>{value === null && !loading ? "Donnée indisponible" : hint}</small>
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
          {attendance ? (
            <div className="presence-list">
              {[
                ["Présents", attendance.presents, "present"],
                ["Absents", attendance.absents, "absent"],
                ["Retards", attendance.retards, "late"],
                ["Excusés", attendance.excuses, "excuse"],
              ].map(([label, count, tone]) => (
                <div className="presence-row" key={label}>
                  <span>
                    <i className={`presence-dot ${tone}`} />
                    {label}
                  </span>
                  <strong>{formatCount(count)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="dashboard-unavailable">
              Les données de présence ne sont pas disponibles.
            </p>
          )}
          <p className="dashboard-footnote">
            La date « aujourd’hui » est calculée selon la date du serveur API.
          </p>
        </section>

        <section className="dashboard-card">
          <div className="dashboard-card-head">
            <div>
              <span className="crud-eyebrow">Finance</span>
              <h2>Totaux cumulés</h2>
            </div>
            <Banknote size={20} />
          </div>
          {finances ? (
            <div className="finance-summary">
              <div>
                <span>
                  <Wallet size={16} /> Recettes validées
                </span>
                <strong>{formatMoney(finances.recettes)}</strong>
              </div>
              <div>
                <span>
                  <Wallet size={16} /> Dépenses enregistrées
                </span>
                <strong>{formatMoney(finances.depenses)}</strong>
              </div>
              <div className="finance-net">
                <span>
                  <Wallet size={16} /> Différence cumulée
                </span>
                <strong className={financialBalance >= 0 ? "positive" : "negative"}>
                  {formatMoney(financialBalance)}
                </strong>
              </div>
            </div>
          ) : (
            <p className="dashboard-unavailable">
              Les totaux financiers ne sont pas disponibles.
            </p>
          )}
          <p className="dashboard-footnote">
            Calculés à partir des paiements validés et des dépenses présentes dans l’API; aucune période n’est appliquée.
          </p>
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
        {activities === null ? (
          <p className="dashboard-unavailable">
            Les activités récentes ne sont pas disponibles.
          </p>
        ) : activities.length === 0 ? (
          <div className="empty-inline">
            <Clock3 size={18} /> Aucune activité enregistrée par le journal.
          </div>
        ) : (
          <div className="activity-list">
            {activities.map((activity) => (
              <div className="activity-row" key={activity.id_journal}>
                <span className="activity-marker" />
                <div>
                  <strong>{activity.action}</strong>
                  <span>
                    {activity.module || "—"} · {formatDateTime(activity.date_action)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="dashboard-footnote">
          L’API du tableau de bord ne fournit pas le nom de l’utilisateur associé à chaque activité.
        </p>
      </section>
    </div>
  );
}
