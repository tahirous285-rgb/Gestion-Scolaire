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
      dashboardData: null,
    };
  });
  const verificationId = useRef(0);
  const initialSession = useRef(authState.session);

  const verifySession = useCallback(async (session) => {
    const requestId = ++verificationId.current;
    setAuthState({
      session,
      status: "checking",
      error: "",
      dashboardData: null,
    });
    try {
      const dashboardData = await getDashboard(session.id_etablissement);
      if (requestId === verificationId.current) {
        setAuthState({
          session,
          status: "authenticated",
          error: "",
          dashboardData,
        });
      }
    } catch (error) {
      if (requestId !== verificationId.current) return;
      if (error?.status === 401) {
        clearSession();
        setAuthState({
          session: null,
          status: "unauthenticated",
          error: "",
          dashboardData: null,
        });
        return;
      }
      setAuthState({
        session,
        status: "error",
        error: error?.message || "Erreur réseau lors de la vérification de la session.",
        dashboardData: null,
      });
    }
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      verificationId.current += 1;
      clearSession();
      setAuthState({
        session: null,
        status: "unauthenticated",
        error: "",
        dashboardData: null,
      });
    }

    function handleStorage(event) {
      if (event.key !== null && event.key !== "gestion_scolaire_session" && event.key !== "access_token") return;
      const nextSession = getSession();
      if (nextSession) verifySession(nextSession);
      else {
        verificationId.current += 1;
        setAuthState({
          session: null,
          status: "unauthenticated",
          error: "",
          dashboardData: null,
        });
      }
    }

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    window.addEventListener("storage", handleStorage);
    const initialVerificationTimer = initialSession.current
      ? window.setTimeout(() => verifySession(initialSession.current), 0)
      : null;
    return () => {
      verificationId.current += 1;
      if (initialVerificationTimer !== null) {
        window.clearTimeout(initialVerificationTimer);
      }
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
      window.removeEventListener("storage", handleStorage);
    };
  }, [verifySession]);

  const signIn = useCallback(async (credentials) => {
    const response = await loginRequest({
      email: credentials.email.trim().toLowerCase(),
      mot_de_passe: credentials.mot_de_passe,
    });
    const nextSession = saveSession(response);
    const requestId = ++verificationId.current;
    setAuthState({
      session: nextSession,
      status: "checking",
      error: "",
      dashboardData: null,
    });

    try {
      const dashboardData = await getDashboard(nextSession.id_etablissement);
      if (requestId !== verificationId.current) return nextSession;
      setAuthState({
        session: nextSession,
        status: "authenticated",
        error: "",
        dashboardData,
      });
    } catch (error) {
      if (requestId !== verificationId.current) return nextSession;
      if (error?.status === 401) {
        clearSession();
        setAuthState({
          session: null,
          status: "unauthenticated",
          error: "",
          dashboardData: null,
        });
        throw error;
      }
      setAuthState({
        session: nextSession,
        status: "error",
        error: error?.message || "Erreur réseau lors de la vérification de la session.",
        dashboardData: null,
      });
      throw error;
    }

    return nextSession;
  }, []);

  const signOut = useCallback(() => {
    verificationId.current += 1;
    clearSession();
    setAuthState({
      session: null,
      status: "unauthenticated",
      error: "",
      dashboardData: null,
    });
  }, []);

  const retryVerification = useCallback(() => {
    if (authState.session) verifySession(authState.session);
    else {
      setAuthState({
        session: null,
        status: "unauthenticated",
        error: "",
        dashboardData: null,
      });
    }
  }, [authState.session, verifySession]);

  const value = useMemo(
    () => ({
      session: authState.session,
      authStatus: authState.status,
      authError: authState.error,
      dashboardData: authState.dashboardData,
      isAuthenticated: authState.status === "authenticated",
      signIn,
      signOut,
      retryVerification,
    }),
    [authState, retryVerification, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
