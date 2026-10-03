import { useEffect, useState } from "react";
import { Activity, Banknote, BookOpen, GraduationCap, Users, Wallet, UserCheck, Clock3 } from "lucide-react";
import { establishmentId } from "../../services/apiClient";
import { getDashboard } from "../../services/dashboardApi";
import { formatDateTime, formatMoney } from "../pageUtils";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    getDashboard(establishmentId()).then((data) => {
      if (active) setStats(data);
    }).catch((failure) => {
      if (active) setError(failure.message || "Dashboard indisponible.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);
  function refresh() {
    setLoading(true);
    setError("");
    setStats(null);
    setRevision((value) => value + 1);
  }
  const cards = [
    { label: "Élèves actifs", value: stats?.eleves, hint: "dossiers actifs de l’établissement", icon: GraduationCap, tone: "blue" },
    { label: "Enseignants actifs", value: stats?.enseignants, hint: "membres de l’équipe", icon: Users, tone: "violet" },
    { label: "Classes actives", value: stats?.classes, hint: "groupes pédagogiques", icon: BookOpen, tone: "amber" },
    { label: "Parents", value: stats?.parents, hint: "contacts enregistrés", icon: UserCheck, tone: "green" },
  ];
  return <div className="dashboard-page" aria-busy={loading}>
    <div className="dashboard-welcome">
      <div><div className="crud-eyebrow">Vue d’ensemble</div><h1>Bonjour, bienvenue 👋</h1><p>Les indicateurs réels de votre établissement, fournis par l’API.</p></div>
      <div className="dashboard-date">Aujourd’hui<br /><strong>{new Date().toLocaleDateString("fr-FR", { dateStyle: "long" })}</strong></div>
      <button className="crud-secondary" disabled={loading} onClick={refresh}>↻ Actualiser</button>
    </div>
    {loading && <div className="crud-state" role="status">Chargement du dashboard…</div>}
    {error && <div className="crud-alert" role="alert">⚠️ {error}</div>}
    <div className="dashboard-stats">{cards.map(({ label, value, hint, icon: Icon, tone }) => <div className={`stat-card ${tone}`} key={label}><div className="stat-icon"><Icon size={21} /></div><div><span>{label}</span><strong>{value ?? "—"}</strong><small>{hint}</small></div></div>)}</div>
    <div className="dashboard-grid">
      <section className="dashboard-card"><div className="dashboard-card-head"><div><span className="crud-eyebrow">Présences élèves</span><h2>Aujourd’hui</h2></div><Activity size={20} /></div>
        <div className="presence-list">{[["presents", "Présents", "present"], ["absents", "Absents", "absent"], ["retards", "Retards", "late"], ["excuses", "Excusés", "excuse"]].map(([key, label, tone]) => <div className="presence-row" key={key}><span><i className={`presence-dot ${tone}`} />{label}</span><strong>{stats?.presences_jour?.[key] ?? "—"}</strong></div>)}</div>
      </section>
      <section className="dashboard-card"><div className="dashboard-card-head"><div><span className="crud-eyebrow">Finance</span><h2>Flux enregistrés</h2></div><Banknote size={20} /></div>
        <div className="finance-summary">{[["recettes", "Recettes"], ["depenses", "Dépenses"]].map(([key, label]) => <div key={key}><span><Wallet size={16} /> {label}</span><strong>{formatMoney(stats?.finances?.[key])}</strong></div>)}</div>
        <p>Totaux retournés par l’API, sans période mensuelle.</p>
      </section>
    </div>
    <section className="dashboard-card activity-card"><div className="dashboard-card-head"><div><span className="crud-eyebrow">Journal</span><h2>Activités récentes</h2></div><Activity size={20} /></div>
      <p>Entrées réelles du journal incluses dans le dashboard ; aucun historique n’est simulé.</p>
      {Array.isArray(stats?.activites_recentes) ? stats.activites_recentes.length === 0
        ? <div className="empty-inline"><Clock3 size={18} /> Aucune activité renvoyée par l’API.</div>
        : <div className="activity-list">{stats.activites_recentes.map((activity) => <div className="activity-row" key={activity.id_journal}><span className="activity-marker" /><div><strong>{activity.action}</strong><span>{activity.module || "—"} · {formatDateTime(activity.date_action)}</span></div></div>)}</div>
        : <div className="empty-inline">{loading ? "Chargement des activités…" : "Activités indisponibles."}</div>}
    </section>
  </div>;
}
