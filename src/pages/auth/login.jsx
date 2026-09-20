import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../services/apiClient";
import "./login.css";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ id_etablissement: "", login: "", mot_de_passe: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login({ ...form, id_etablissement: Number(form.id_etablissement) });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div>
          <p className="login-eyebrow">SCHOOL MANAGER</p>
          <h1>Connexion</h1>
          <p>Accède à l’espace de ton établissement.</p>
        </div>

        {error && <div className="login-error" role="alert">{error}</div>}

        <label>
          Établissement
          <input name="id_etablissement" type="number" min="1" required value={form.id_etablissement} onChange={handleChange} />
        </label>
        <label>
          Identifiant
          <input name="login" autoComplete="username" required value={form.login} onChange={handleChange} />
        </label>
        <label>
          Mot de passe
          <input name="mot_de_passe" type="password" autoComplete="current-password" required value={form.mot_de_passe} onChange={handleChange} />
        </label>

        <button type="submit" disabled={loading}>{loading ? "Connexion…" : "Se connecter"}</button>
      </form>
    </main>
  );
}

export default Login;
