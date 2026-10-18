import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, readToken, writeToken } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [booting, setBooting] = useState(true);
  const [emailCode, setEmailCode] = useState("");

  useEffect(() => {
    let alive = true;
    readToken()
      .then((saved) => {
        if (!alive) {
          return null;
        }
        if (!saved) {
          setBooting(false);
          return null;
        }
        return api("/me", { token: saved }).then((data) => {
          if (!alive) {
            return;
          }
          setToken(saved);
          setUser(data.user);
        });
      })
      .catch(() => writeToken(""))
      .finally(() => {
        if (alive) {
          setBooting(false);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!token) {
      return undefined;
    }
    let day = new Date().toISOString().slice(0, 10);
    const id = setInterval(() => {
      const next = new Date().toISOString().slice(0, 10);
      if (next === day) {
        return;
      }
      day = next;
      api("/me", { token })
        .then((data) => setUser(data.user))
        .catch(() => {});
    }, 15000);
    return () => clearInterval(id);
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      booting,
      emailCode,
      async register(payload) {
        const data = await api("/register", { method: "POST", body: payload });
        await writeToken(data.token);
        setToken(data.token);
        setUser(data.user);
        setEmailCode(data.code || "");
        return data.user;
      },
      async login(payload) {
        const data = await api("/login", { method: "POST", body: payload });
        await writeToken(data.token);
        setToken(data.token);
        setUser(data.user);
        return data.user;
      },
      async requestPasswordReset(email) {
        return api("/password/forgot", { method: "POST", body: { email } });
      },
      async resetPassword(payload) {
        const data = await api("/password/reset", { method: "POST", body: payload });
        await writeToken(data.token);
        setToken(data.token);
        setUser(data.user);
        return data.user;
      },
      async verifyEmail(code) {
        const data = await api("/email/verify", { method: "POST", token, body: { token, code } });
        setUser(data.user);
        setEmailCode("");
        return data.user;
      },
      async resendEmailCode() {
        const data = await api("/email/resend", { method: "POST", token, body: { token } });
        setEmailCode(data.code || "");
        return data;
      },
      async logout() {
        try {
          await api("/logout", { method: "POST", token, body: { token } });
        } catch {
          // Выходим даже если сеть моргнула.
        }
        await writeToken("");
        setToken("");
        setUser(null);
        setEmailCode("");
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
      async refresh() {
        if (!token) {
          return null;
        }
        const data = await api("/me", { token });
        setUser(data.user);
        return data.user;
      },
      async searchPeople(query) {
        const data = await api(`/people?q=${encodeURIComponent(query)}`, { token });
        return data.people || [];
      },
      async getPerson(id) {
        const data = await api(`/people/${id}`, { token });
        return data.person || null;
      },
      async listFriends() {
        const data = await api("/friends", { token });
        return data.friends || [];
      },
      async addFriend(id) {
        const data = await api("/friends", { method: "POST", token, body: { token, id } });
        if (data.user) {
          setUser(data.user);
        }
        return data.friends || [];
      },
      async removeFriend(id) {
        const data = await api(`/friends/${id}`, { method: "DELETE", token, body: { token } });
        if (data.user) {
          setUser(data.user);
        }
        return data.friends || [];
      },
      async nudgeFriend(id) {
        await api(`/friends/${id}/nudge`, { method: "POST", token, body: { token } });
      },
      async ackNudges() {
        const data = await api("/me", { method: "PATCH", token, body: { token, nudgeSeen: true } });
        setUser(data.user);
        return data.user;
      },
    }),
    [token, user, booting, emailCode]
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
