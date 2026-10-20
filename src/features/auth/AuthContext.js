import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { guessTimeZone, localDay } from "../../lib/day";
import { api, readToken, writeToken } from "./api";

function withZone(payload = {}) {
  return { ...payload, timeZone: guessTimeZone() };
}

function mePath() {
  return `/me?timeZone=${encodeURIComponent(guessTimeZone())}`;
}

const AuthContext = createContext(null);

function applySocial(data, setUser) {
  if (data?.user) {
    setUser(data.user);
  }
  return {
    friends: data?.friends || [],
    incoming: data?.incoming || [],
    outgoing: data?.outgoing || [],
    status: data?.status || "",
  };
}

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
        return api(mePath(), { token: saved }).then((data) => {
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
    let day = localDay(guessTimeZone());
    const id = setInterval(() => {
      const next = localDay(guessTimeZone());
      if (next === day) {
        return;
      }
      day = next;
      api(mePath(), { token })
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
        const data = await api("/register", { method: "POST", body: withZone(payload) });
        await writeToken(data.token);
        setToken(data.token);
        setUser(data.user);
        setEmailCode(data.code || "");
        return data.user;
      },
      async login(payload) {
        const data = await api("/login", { method: "POST", body: withZone(payload) });
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
          body: withZone({ ...payload, token, onboardingDone: true }),
        });
        setUser(data.user);
        return data.user;
      },
      async patch(payload) {
        const data = await api("/me", { method: "PATCH", token, body: withZone({ ...payload, token }) });
        setUser(data.user);
        return data.user;
      },
      async refresh() {
        if (!token) {
          return null;
        }
        const data = await api(mePath(), { token });
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
        return {
          friends: data.friends || [],
          incoming: data.incoming || [],
          outgoing: data.outgoing || [],
          status: data.status || "",
        };
      },
      async requestFriend(id) {
        const data = await api("/friends", { method: "POST", token, body: { token, id } });
        return applySocial(data, setUser);
      },
      async acceptFriend(id) {
        const data = await api(`/friends/${id}/accept`, { method: "POST", token, body: { token } });
        return applySocial(data, setUser);
      },
      async declineFriend(id) {
        const data = await api(`/friends/${id}/decline`, { method: "POST", token, body: { token } });
        return applySocial(data, setUser);
      },
      async removeFriend(id) {
        const data = await api(`/friends/${id}`, { method: "DELETE", token, body: { token } });
        return applySocial(data, setUser);
      },
      async nudgeFriend(id) {
        await api(`/friends/${id}/nudge`, { method: "POST", token, body: { token } });
      },
      async ackNudges() {
        const data = await api("/me", { method: "PATCH", token, body: withZone({ token, nudgeSeen: true }) });
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
