import { useEffect, useState } from "react";
import { Activity, Banknote, BookOpen, GraduationCap, Users, Wallet, UserCheck, Clock3 } from "lucide-react";
import { establishmentId } from "../../services/apiClient";
import { getDashboard } from "../../services/dashboardApi";
import { formatDateTime, formatMoney } from "../pageUtils";

const emptyStats = { eleves: 0, enseignants: 0, classes: 0, parents: 0, presences_jour: { presents: 0, absents: 0, retards: 0, excuses: 0 }, finances: { recettes: 0, depenses: 0 }, activites_recentes: [] };

export default function Dashboard() {
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getDashboard(establishmentId()).then((data) => { if (active) { const nextData = data || {}; setStats({ ...emptyStats, ...nextData, presences_jour: { ...emptyStats.presences_jour, ...(nextData.presences_jour || {}) }, finances: { ...emptyStats.finances, ...(nextData.finances || {}) } }); } }).catch((requestError) => { if (active) setError(requestError.message || "Dashboard indisponible."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const cards = [
    { label: "Élèves actifs", value: stats.eleves, hint: "inscrits dans l’établissement", icon: GraduationCap, tone: "blue" },
    { label: "Enseignants actifs", value: stats.enseignants, hint: "membres de l’équipe", icon: Users, tone: "violet" },
    { label: "Classes actives", value: stats.classes, hint: "groupes pédagogiques", icon: BookOpen, tone: "amber" },
    { label: "Parents", value: stats.parents, hint: "contacts enregistrés", icon: UserCheck, tone: "green" },
  ];
  return <div className="dashboard-page"><div className="dashboard-welcome"><div><div className="crud-eyebrow">Vue d’ensemble</div><h1>Bonjour, bienvenue 👋</h1><p>Les indicateurs réels de votre établissement, fournis par l’API.</p></div><div className="dashboard-date">Aujourd’hui<br /><strong>{new Date().toLocaleDateString("fr-FR", { dateStyle: "long" })}</strong></div></div>{error && <div className="crud-alert">⚠️ {error}</div>}<div className="dashboard-stats">{cards.map(({ label, value, hint, icon: Icon, tone }) => <div className={`stat-card ${tone}`} key={label}><div className="stat-icon"><Icon size={21} /></div><div><span>{label}</span><strong>{loading ? "—" : value}</strong><small>{hint}</small></div></div>)}</div><div className="dashboard-grid"><section className="dashboard-card"><div className="dashboard-card-head"><div><span className="crud-eyebrow">Présences élèves</span><h2>Aujourd’hui</h2></div><Activity size={20} /></div><div className="presence-list"><div className="presence-row"><span><i className="presence-dot present" />Présents</span><strong>{stats.presences_jour.presents}</strong></div><div className="presence-row"><span><i className="presence-dot absent" />Absents</span><strong>{stats.presences_jour.absents}</strong></div><div className="presence-row"><span><i className="presence-dot late" />Retards</span><strong>{stats.presences_jour.retards}</strong></div><div className="presence-row"><span><i className="presence-dot excuse" />Excusés</span><strong>{stats.presences_jour.excuses}</strong></div></div></section><section className="dashboard-card"><div className="dashboard-card-head"><div><span className="crud-eyebrow">Finance</span><h2>Flux enregistrés</h2></div><Banknote size={20} /></div><div className="finance-summary"><div><span><Wallet size={16} /> Recettes</span><strong>{formatMoney(stats.finances.recettes)}</strong></div><div><span><Wallet size={16} /> Dépenses</span><strong>{formatMoney(stats.finances.depenses)}</strong></div></div></section></div><section className="dashboard-card activity-card"><div className="dashboard-card-head"><div><span className="crud-eyebrow">Journal</span><h2>Activités récentes</h2></div><Activity size={20} /></div>{stats.activites_recentes.length === 0 ? <div className="empty-inline"><Clock3 size={18} /> Aucune activité renvoyée par l’API.</div> : <div className="activity-list">{stats.activites_recentes.map((activity) => <div className="activity-row" key={activity.id_journal}><span className="activity-marker" /><div><strong>{activity.action}</strong><span>{activity.module || "—"} · {formatDateTime(activity.date_action)}</span></div></div>)}</div>}</section></div>;
}
