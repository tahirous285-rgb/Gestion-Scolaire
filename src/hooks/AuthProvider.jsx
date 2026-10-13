import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { login as loginRequest } from "../services/authApi";
import { clearSession, getSession, saveSession } from "../services/authStorage";
import { getDashboard } from "../services/dashboardApi";
import { AuthContext } from "./authContext";

export default function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => {
    const session = getSession();
    return {
      session,
      status: session ? "checking" : "unauthenticated",
      error: "",
    };
  });
  const verificationId = useRef(0);
  const initialSession = useRef(authState.session);

  const verifySession = useCallback(async (session) => {
    const requestId = ++verificationId.current;
    setAuthState({ session, status: "checking", error: "" });
    try {
      await getDashboard(session.id_etablissement);
      if (requestId === verificationId.current) {
        setAuthState({ session, status: "authenticated", error: "" });
      }
    } catch (error) {
      if (requestId !== verificationId.current) return;
      if (error?.status === 401) {
        clearSession();
        setAuthState({ session: null, status: "unauthenticated", error: "" });
        return;
      }
      setAuthState({
        session,
        status: "error",
        error: error?.message || "Erreur réseau lors de la vérification de la session.",
      });
    }
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      verificationId.current += 1;
      clearSession();
      setAuthState({ session: null, status: "unauthenticated", error: "" });
    }

    function handleStorage(event) {
      if (event.key !== null && event.key !== "gestion_scolaire_session" && event.key !== "access_token") return;
      const nextSession = getSession();
      if (nextSession) verifySession(nextSession);
      else {
        verificationId.current += 1;
        setAuthState({ session: null, status: "unauthenticated", error: "" });
      }
    }

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    window.addEventListener("storage", handleStorage);
    if (initialSession.current) verifySession(initialSession.current);
    return () => {
      verificationId.current += 1;
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
      window.removeEventListener("storage", handleStorage);
    };
  }, [verifySession]);

  const signIn = useCallback(async (credentials) => {
    const response = await loginRequest({
      id_etablissement: Number(credentials.id_etablissement),
      login: credentials.login,
      mot_de_passe: credentials.mot_de_passe,
    });
    const nextSession = saveSession(response, credentials.id_etablissement);
    verificationId.current += 1;
    setAuthState({ session: nextSession, status: "authenticated", error: "" });
    return nextSession;
  }, []);

  const signOut = useCallback(() => {
    verificationId.current += 1;
    clearSession();
    setAuthState({ session: null, status: "unauthenticated", error: "" });
  }, []);

  const retryVerification = useCallback(() => {
    if (authState.session) verifySession(authState.session);
    else setAuthState({ session: null, status: "unauthenticated", error: "" });
  }, [authState.session, verifySession]);

  const value = useMemo(
    () => ({
      session: authState.session,
      authStatus: authState.status,
      authError: authState.error,
      isAuthenticated: authState.status === "authenticated",
      signIn,
      signOut,
      retryVerification,
    }),
    [authState, retryVerification, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
