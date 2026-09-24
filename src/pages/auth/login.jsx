import { useState } from "react";
import { GraduationCap, LockKeyhole, LogIn, School, UserRound } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ id_etablissement: "", login: "", mot_de_passe: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function change(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(form);
      const from = location.state?.from?.pathname;
      navigate(from && from !== "/login" ? from : "/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Identifiants invalides.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-showcase">
        <div className="login-brand">
          <div className="login-brand-icon"><School size={24} /></div>
          <div><strong>School Manager</strong><span>Gestion scolaire</span></div>
        </div>
        <div className="login-showcase-copy">
          <div className="login-round-icon"><GraduationCap size={42} /></div>
          <p className="login-kicker">ESPACE DE GESTION</p>
          <h1>Votre établissement,<br /><em>en un seul endroit.</em></h1>
          <p>Suivez les élèves, les enseignants, la pédagogie et les finances depuis une interface claire.</p>
        </div>
        <div className="login-showcase-footer">Application desktop de gestion scolaire</div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-card-heading">
            <span className="login-mobile-mark"><School size={18} /></span>
            <p className="login-kicker">BIENVENUE</p>
            <h2>Connexion</h2>
            <p>Connectez-vous pour accéder à votre établissement.</p>
          </div>

          {error && <div className="login-alert" role="alert">⚠️ {error}</div>}

          <form onSubmit={submit} className="login-form">
            <label htmlFor="id_etablissement">Identifiant de l’établissement</label>
            <div className="login-input-wrap">
              <School size={18} aria-hidden="true" />
              <input id="id_etablissement" name="id_etablissement" type="number" min="1" required value={form.id_etablissement} onChange={change} placeholder="Ex. 2" />
            </div>

            <label htmlFor="login">Identifiant</label>
            <div className="login-input-wrap">
              <UserRound size={18} aria-hidden="true" />
              <input id="login" name="login" required value={form.login} onChange={change} placeholder="Votre identifiant" autoComplete="username" />
            </div>

            <label htmlFor="mot_de_passe">Mot de passe</label>
            <div className="login-input-wrap">
              <LockKeyhole size={18} aria-hidden="true" />
              <input id="mot_de_passe" name="mot_de_passe" type="password" required value={form.mot_de_passe} onChange={change} placeholder="Votre mot de passe" autoComplete="current-password" />
            </div>

            <button className="login-submit" type="submit" disabled={loading}>
              {loading ? "Connexion…" : <><span>Se connecter</span><LogIn size={18} /></>}
            </button>
          </form>
          <p className="login-footnote">Les identifiants sont vérifiés par l’API de votre établissement.</p>
        </div>
      </section>
    </main>
  );
}

export default Login;
