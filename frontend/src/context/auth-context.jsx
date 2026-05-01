import { createContext, useContext, useEffect, useState } from "react";
import {
  clearAuthSession,
  getStoredAuth,
  loginRequest,
  meRequest,
  signupRequest,
  storeAuthSession
} from "@/lib/auth";

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredAuth());
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function bootstrap() {
      if (!session?.token) {
        setIsBootstrapping(false);
        return;
      }

      try {
        const response = await meRequest(session.token);

        if (!ignore) {
          const nextSession = {
            token: session.token,
            user: response.user
          };

          setSession(nextSession);
          storeAuthSession(nextSession);
        }
      } catch (_error) {
        if (!ignore) {
          setSession(null);
          clearAuthSession();
        }
      } finally {
        if (!ignore) {
          setIsBootstrapping(false);
        }
      }
    }

    bootstrap();

    return () => {
      ignore = true;
    };
  }, [session?.token]);

  async function login(values) {
    const response = await loginRequest(values);
    const nextSession = {
      token: response.token,
      user: response.user
    };

    setSession(nextSession);
    storeAuthSession(nextSession);

    return response.user;
  }

  async function signup(values) {
    const response = await signupRequest(values);
    const nextSession = {
      token: response.token,
      user: response.user
    };

    setSession(nextSession);
    storeAuthSession(nextSession);

    return response.user;
  }

  function logout() {
    setSession(null);
    clearAuthSession();
  }

  const value = {
    token: session?.token || null,
    user: session?.user || null,
    isAuthenticated: Boolean(session?.token && session?.user),
    isBootstrapping,
    login,
    signup,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

export { AuthProvider, useAuth };
