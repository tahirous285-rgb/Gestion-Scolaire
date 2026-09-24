import { useEffect, useMemo, useState } from "react";
import { login as loginRequest } from "../services/authApi";
import { clearSession, getSession, saveSession } from "../services/authStorage";
import { AuthContext } from "./authContext";

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getSession());

  useEffect(() => {
    function handleUnauthorized() {
      setSession(null);
    }

    function handleStorage(event) {
      if (event.key === "gestion_scolaire_session" || event.key === "access_token") {
        setSession(getSession());
      }
    }

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  async function signIn(credentials) {
    const response = await loginRequest({
      id_etablissement: Number(credentials.id_etablissement),
      login: credentials.login,
      mot_de_passe: credentials.mot_de_passe,
    });
    const nextSession = saveSession(response, credentials.id_etablissement);
    setSession(nextSession);
    return nextSession;
  }

  function signOut() {
    clearSession();
    setSession(null);
  }

  const value = useMemo(
    () => ({ session, isAuthenticated: Boolean(session?.access_token), signIn, signOut }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
