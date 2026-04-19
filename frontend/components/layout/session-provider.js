"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { apiRequest } from "@/lib/api";
import {
  clearStoredSession,
  persistSession,
  readStoredSession
} from "@/lib/auth";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      const stored = readStoredSession();

      if (!stored?.token) {
        if (active) {
          setLoading(false);
        }
        return;
      }

      try {
        const profile = await apiRequest("/auth/me", {
          token: stored.token
        });

        if (active) {
          setSession({
            token: stored.token,
            user: profile.user
          });
        }
      } catch {
        clearStoredSession();

        if (active) {
          setSession(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    hydrate();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      loading,
      setAuthSession(authResponse) {
        persistSession(authResponse);
        setSession({
          token: authResponse.token,
          user: authResponse.user
        });
      },
      logout() {
        clearStoredSession();
        setSession(null);
      },
      async refreshSession() {
        if (!session?.token) {
          return null;
        }

        const profile = await apiRequest("/auth/me", {
          token: session.token
        });

        const nextSession = {
          token: session.token,
          user: profile.user
        };

        persistSession(nextSession);
        setSession(nextSession);
        return nextSession;
      }
    }),
    [loading, session]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used within a SessionProvider.");
  }

  return context;
}
