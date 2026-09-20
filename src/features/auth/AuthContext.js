import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, readToken, writeToken } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let alive = true;
    const saved = readToken();
    if (!saved) {
      setBooting(false);
      return undefined;
    }
    api("/me", { token: saved })
      .then((data) => {
        if (!alive) {
          return;
        }
        setToken(saved);
        setUser(data.user);
      })
      .catch(() => {
        writeToken("");
      })
      .finally(() => {
        if (alive) {
          setBooting(false);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      booting,
      async register(payload) {
        const data = await api("/register", { method: "POST", body: payload });
        writeToken(data.token);
        setToken(data.token);
        setUser(data.user);
        return data.user;
      },
      async login(payload) {
        const data = await api("/login", { method: "POST", body: payload });
        writeToken(data.token);
        setToken(data.token);
        setUser(data.user);
        return data.user;
      },
      async logout() {
        try {
          await api("/logout", { method: "POST", token, body: { token } });
        } catch {
          // Выходим даже если сеть моргнула.
        }
        writeToken("");
        setToken("");
        setUser(null);
      },
      async completeOnboarding(payload) {
        const data = await api("/me", {
          method: "PATCH",
          token,
          body: { ...payload, token, onboardingDone: true },
        });
        setUser(data.user);
        return data.user;
      },
      async patch(payload) {
        const data = await api("/me", { method: "PATCH", token, body: { ...payload, token } });
        setUser(data.user);
        return data.user;
      },
    }),
    [token, user, booting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth только внутри AuthProvider");
  }
  return ctx;
}
