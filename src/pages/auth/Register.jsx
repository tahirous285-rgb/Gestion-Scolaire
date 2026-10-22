import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, GraduationCap, LockKeyhole, LogIn, Mail, School, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { register } from "../../services/authApi";

const initialForm = {
  nom_etablissement: "",
  nom: "",
  prenom: "",
  email: "",
  mot_de_passe: "",
};

function Register() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function change(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      await signIn({
        email: form.email,
        mot_de_passe: form.mot_de_passe,
      });
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.message || "L’inscription n’a pas pu aboutir.");
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
          <p className="login-kicker">NOUVEL ÉTABLISSEMENT</p>
          <h1>Votre école,<br /><em>prête à démarrer.</em></h1>
          <p>Créez l’espace de votre établissement et son premier compte administrateur.</p>
        </div>
        <div className="login-showcase-footer">Application de gestion scolaire</div>
      </section>

      <section className="login-panel register-panel">
        <div className="login-card register-card">
          <Link className="auth-back-link" to="/login"><ArrowLeft size={16} /> Retour à la connexion</Link>
          <div className="login-card-heading">
            <span className="login-mobile-mark"><School size={18} /></span>
            <p className="login-kicker">CRÉATION DE COMPTE</p>
            <h2>Inscription</h2>
            <p>Renseignez votre établissement et le compte administrateur.</p>
          </div>

          {error && <div className="login-alert" role="alert">{error}</div>}

          <form onSubmit={submit} className="register-form">
            <div className="register-field register-field-wide">
              <label htmlFor="nom_etablissement">Nom de l’établissement</label>
              <div className="login-input-wrap"><School size={18} aria-hidden="true" /><input id="nom_etablissement" name="nom_etablissement" required minLength="2" maxLength="200" value={form.nom_etablissement} onChange={change} autoComplete="organization" /></div>
            </div>
            <div className="register-field">
              <label htmlFor="prenom">Prénom du responsable</label>
              <div className="login-input-wrap"><UserRound size={18} aria-hidden="true" /><input id="prenom" name="prenom" required maxLength="100" value={form.prenom} onChange={change} autoComplete="given-name" /></div>
            </div>
            <div className="register-field">
              <label htmlFor="nom">Nom du responsable</label>
              <div className="login-input-wrap"><UserRound size={18} aria-hidden="true" /><input id="nom" name="nom" required maxLength="100" value={form.nom} onChange={change} autoComplete="family-name" /></div>
            </div>
            <div className="register-field register-field-wide">
              <label htmlFor="email">Adresse e-mail (identifiant de connexion)</label>
              <div className="login-input-wrap"><Mail size={18} aria-hidden="true" /><input id="email" name="email" type="email" required value={form.email} onChange={change} autoComplete="email" /></div>
            </div>
            <div className="register-field">
              <label htmlFor="mot_de_passe">Mot de passe</label>
              <div className="login-input-wrap">
                <LockKeyhole size={18} aria-hidden="true" />
                <input id="mot_de_passe" name="mot_de_passe" type={showPassword ? "text" : "password"} required minLength="8" maxLength="72" value={form.mot_de_passe} onChange={change} autoComplete="new-password" />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  aria-pressed={showPassword}
                  title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button className="login-submit register-submit" type="submit" disabled={loading}>
              {loading ? "Création du compte…" : <><span>Créer mon compte</span><LogIn size={18} /></>}
            </button>
          </form>
          <p className="login-footnote">Mot de passe : 8 caractères minimum.</p>
        </div>
      </section>
    </main>
  );
}

export default Register;