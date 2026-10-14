import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../auth/api";
import { Field, GhostButton, PrimaryButton, ScreenHeader, SectionLabel } from "../../ui/kit";
import { EXPERIENCE_LABELS, GOAL_LABELS, GOALS } from "../onboarding/catalog";

const TOKEN_KEY = "fitness.admin.token";
const EMPTY_STATS = {
  usersTotal: 0,
  onboarded: 0,
  newToday: 0,
  avgAge: 0,
  avgStreak: 0,
  avgDaysPerWeek: 0,
  goals: {},
};

function readAdminToken() {
  try {
    return globalThis.localStorage?.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

function writeAdminToken(token) {
  try {
    if (token) {
      globalThis.localStorage?.setItem(TOKEN_KEY, token);
    } else {
      globalThis.localStorage?.removeItem(TOKEN_KEY);
    }
  } catch {
    // без localStorage сессия только в памяти
  }
}

function formatDate(value) {
  if (!value) {
    return "—";
  }
  return String(value).slice(0, 10);
}

function weightLabel(weight) {
  if (!weight) {
    return "—";
  }
  return `${Number(weight.current).toFixed(1)} → ${Number(weight.goal).toFixed(1)} кг`;
}

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const [token, setToken] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [booting, setBooting] = useState(true);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return users;
    }
    return users.filter((user) => {
      const blob = `${user.name} ${user.email}`.toLowerCase();
      return blob.includes(needle);
    });
  }, [users, query]);

  const loadAll = async (session) => {
    const [statsData, usersData] = await Promise.all([
      api("/admin/stats", { token: session }),
      api("/admin/users", { token: session }),
    ]);
    setStats(statsData.stats || EMPTY_STATS);
    setUsers(usersData.users || []);
  };

  useEffect(() => {
    const savedToken = readAdminToken();
    if (!savedToken) {
      setBooting(false);
      return undefined;
    }
    loadAll(savedToken)
      .then(() => {
        setToken(savedToken);
      })
      .catch(() => {
        writeAdminToken("");
      })
      .finally(() => {
        setBooting(false);
      });
    return undefined;
  }, []);

  const signIn = async () => {
    setError("");
    setBusy(true);
    try {
      const data = await api("/admin/login", { method: "POST", body: { login, password } });
      writeAdminToken(data.token);
      setToken(data.token);
      setPassword("");
      await loadAll(data.token);
    } catch (err) {
      setError(err.message || "Не вошло");
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    try {
      await api("/admin/logout", { method: "POST", token, body: { token } });
    } catch {
      // выходим локально даже если сеть моргнула
    }
    writeAdminToken("");
    setToken("");
    setUsers([]);
    setStats(EMPTY_STATS);
  };

  if (booting) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <Text className="text-[16px] text-mute">Секунду</Text>
      </View>
    );
  }

  if (!token) {
    return (
      <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 36 }}>
          <View className="mt-8 rounded-[28px] bg-mint px-6 py-8">
            <Text className="text-[12px] font-medium tracking-[1.2px] text-accent">Админка</Text>
            <Text className="mt-2 text-[28px] font-semibold text-ink">Только для команды</Text>
            <Text className="mt-2 text-[14px] leading-5 text-mute">
              Отдельный пароль из keys/.env. Обычный аккаунт приложения сюда не пускает.
            </Text>
          </View>
          <View className="mt-8">
            <Field
              label="Логин"
              value={login}
              onChangeText={setLogin}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
              inputName="fitness-admin-login"
            />
            <Field
              label="Пароль"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="От 10 символов"
              autoCorrect={false}
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
              inputName="fitness-admin-password"
            />
            {error ? <Text className="mb-4 text-[14px] font-medium text-accent">{error}</Text> : null}
            <PrimaryButton glass={false} label="Войти" onPress={signIn} busy={busy} />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 40 }}>
        <ScreenHeader title="Админка" right={<GhostButton label="Выйти" onPress={signOut} />} />

        <SectionLabel>Сводка</SectionLabel>
        <View className="mb-6 flex-row flex-wrap justify-between">
          <StatCard label="Людей" value={stats.usersTotal} />
          <StatCard label="Опрос пройден" value={stats.onboarded} />
          <StatCard label="Новые сегодня" value={stats.newToday} />
          <StatCard label="Средний возраст" value={stats.avgAge} />
          <StatCard label="Средняя серия" value={stats.avgStreak} />
          <StatCard label="Дней в неделю" value={stats.avgDaysPerWeek} />
        </View>
        <View className="mb-8 rounded-[24px] bg-card px-4 py-4">
          <Text className="mb-3 text-[13px] font-medium text-mute">Цели</Text>
          {GOALS.map((goal) => (
            <View key={goal.id} className="mb-2 flex-row justify-between">
              <Text className="text-[14px] text-ink">{goal.title}</Text>
              <Text className="text-[14px] font-semibold text-accent">{stats.goals?.[goal.id] || 0}</Text>
            </View>
          ))}
        </View>

        <SectionLabel>Люди</SectionLabel>
        <Field label="Поиск" value={query} onChangeText={setQuery} placeholder="Имя или почта" />
        {filtered.map((user) => (
          <View key={user.id} className="mb-3 rounded-[24px] bg-card px-4 py-4">
            <Text className="text-[16px] font-semibold text-ink">{user.name}</Text>
            <Text className="mt-1 text-[13px] text-mute">{user.email}</Text>
            <Text className="mt-3 text-[13px] leading-5 text-mute">
              {user.age ? `${user.age} лет` : "возраст —"} · {weightLabel(user.weight)} · серия {user.streak || 0}
              {user.freezesLeft != null ? ` · щит ${user.freezesLeft}` : ""}
            </Text>
            <Text className="mt-1 text-[13px] leading-5 text-mute">
              {(user.goals || []).map((id) => GOAL_LABELS[id] || id).join(", ") || "цели не выбраны"}
              {user.daysPerWeek ? ` · ${user.daysPerWeek} дн.` : ""}
              {EXPERIENCE_LABELS[user.experience] ? ` · ${EXPERIENCE_LABELS[user.experience]}` : ""}
            </Text>
            <Text className="mt-1 text-[12px] text-mute">с {formatDate(user.createdAt)}</Text>
          </View>
        ))}
        {filtered.length === 0 ? <Text className="mb-6 text-[14px] text-mute">Никого не нашлось</Text> : null}

        <SectionLabel>Задания дня</SectionLabel>
        <View className="mb-6 rounded-[24px] bg-card px-4 py-4">
          <Text className="text-[14px] leading-5 text-mute">
            Три мини-тренировки на Арене сервер сам берёт из сессий с пометкой daily в data/content/workouts.json. Старый редактор catalog.json на живые задания больше не влияет.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value }) {
  return (
    <View className="mb-3 w-[48%] rounded-[24px] bg-mint px-4 py-4">
      <Text className="text-[12px] font-medium text-mute">{label}</Text>
      <Text className="mt-1 text-[22px] font-semibold text-ink">{value}</Text>
    </View>
  );
}
