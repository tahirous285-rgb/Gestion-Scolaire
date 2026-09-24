import BackendUnavailable from "../../components/common/BackendUnavailable";

export default function ObservationsEnseignants() {
  return (
    <div className="crud-page">
      <div className="crud-header"><div><div className="crud-eyebrow">Cahier des maîtres</div><h1>🗒️ Observations enseignants</h1><p>Suivi des observations individuelles.</p></div></div>
      <div className="unavailable-card"><div className="unavailable-icon">🗒️</div><BackendUnavailable>la fonctionnalité n’est pas implémentée côté backend : le modèle existe, mais aucun endpoint observations n’est enregistré dans l’API.</BackendUnavailable><p>Cette page reste volontairement sans formulaire et sans appel HTTP afin de ne pas inventer de route.</p></div>
    </div>
  );
}
