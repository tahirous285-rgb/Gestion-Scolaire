import { useEffect, useMemo, useState } from "react";
import { getUtilisateur } from "../services/administrationApi";
import { login as loginRequest } from "../services/authApi";
import { clearSession, getSession, isSessionValid, saveSession, tokenPayload } from "../services/authStorage";
import { AuthContext } from "./authContext";

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getSession());
  const [verifiedToken, setVerifiedToken] = useState(null);
  const [verificationError, setVerificationError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!session || verifiedToken === session.access_token) return;
    let active = true;
    getUtilisateur(session.id_utilisateur).then(() => {
      if (active) setVerifiedToken(session.access_token);
    }).catch((error) => {
      if (active && error.status !== 401) setVerificationError(error.message || "Vérification de session impossible.");
    });
    return () => { active = false; };
  }, [session, verifiedToken, revision]);

  useEffect(() => {
    function handleUnauthorized() {
      setSession(null);
      setVerifiedToken(null);
      setVerificationError("");
    }

    function handleStorage(event) {
      if (event.key === null || event.key === "gestion_scolaire_session" || event.key === "access_token") {
        setVerificationError("");
        setVerifiedToken(null);
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

  useEffect(() => {
    if (!session) return;
    function checkExpiry() {
      if (!isSessionValid(session)) {
        clearSession();
        setSession(null);
      }
    }
    const delay = Math.max(0, tokenPayload(session.access_token).exp * 1000 - Date.now());
    const timer = setTimeout(checkExpiry, Math.min(delay + 10, 2147483647));
    window.addEventListener("focus", checkExpiry);
    return () => { clearTimeout(timer); window.removeEventListener("focus", checkExpiry); };
  }, [session]);

  async function signIn(credentials) {
    const response = await loginRequest({
      id_etablissement: Number(credentials.id_etablissement),
      login: credentials.login,
      mot_de_passe: credentials.mot_de_passe,
    });
    const nextSession = saveSession(response, credentials.id_etablissement);
    setVerifiedToken(nextSession.access_token);
    setVerificationError("");
    setSession(nextSession);
    return nextSession;
  }

  function signOut() {
    clearSession();
    setSession(null);
    setVerifiedToken(null);
    setVerificationError("");
  }

  const value = useMemo(
    () => ({ session, isAuthenticated: isSessionValid(session) && verifiedToken === session.access_token,
      checkingSession: isSessionValid(session) && verifiedToken !== session.access_token,
      verificationError, retryVerification: () => { setVerificationError(""); setRevision((value) => value + 1); }, signIn, signOut }),
    [session, verifiedToken, verificationError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
