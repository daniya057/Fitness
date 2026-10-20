import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../auth/api";
import { Field, GhostButton, MintButton, PillButton, PrimaryButton, ScreenHeader, SectionLabel } from "../../ui/kit";
import { SoftPress } from "../../ui/SoftPress";
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
          <UserCard
            key={user.id}
            user={user}
            token={token}
            onChanged={async () => {
              await loadAll(token);
            }}
          />
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

function emptyForm(user) {
  return {
    name: user.name || "",
    email: user.email || "",
    streak: String(user.streak || 0),
    freezesLeft: String(user.freezesLeft ?? 1),
    emailVerified: user.emailVerified !== false,
    disabled: Boolean(user.disabled),
    newPassword: "",
  };
}

function UserCard({ user, token, onChanged }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => emptyForm(user));
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const patchField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const run = async (kind, work) => {
    setError("");
    setBusy(kind);
    try {
      await work();
      await onChanged();
    } catch (err) {
      setError(err.message || "Не вышло");
    } finally {
      setBusy("");
    }
  };

  const save = () =>
    run("save", async () => {
      const body = {
        name: form.name,
        email: form.email,
        streak: Number(form.streak),
        freezesLeft: Number(form.freezesLeft),
        emailVerified: form.emailVerified,
        disabled: form.disabled,
      };
      if (form.newPassword.trim()) {
        body.newPassword = form.newPassword.trim();
      }
      const data = await api(`/admin/users/${user.id}`, { method: "PATCH", token, body });
      setForm(emptyForm(data.user || { ...user, ...body, newPassword: "" }));
      setConfirmDelete(false);
    });

  const kick = () => run("kick", () => api(`/admin/users/${user.id}`, { method: "PATCH", token, body: { kickSessions: true } }));
  const resetQuiz = () => run("quiz", () => api(`/admin/users/${user.id}`, { method: "PATCH", token, body: { resetQuiz: true } }));
  const remove = () =>
    run("delete", async () => {
      await api(`/admin/users/${user.id}`, { method: "DELETE", token });
    });

  return (
    <View className="mb-3 rounded-[24px] bg-card px-4 py-4">
      <Text className="text-[16px] font-semibold text-ink">{user.name}</Text>
      <Text className="mt-1 text-[13px] text-mute">{user.email}</Text>
      <Text className="mt-3 text-[13px] leading-5 text-mute">
        {user.age ? `${user.age} лет` : "возраст —"} · {weightLabel(user.weight)} · серия {user.streak || 0}
        {user.freezesLeft != null ? ` · щит ${user.freezesLeft}` : ""}
        {user.disabled ? " · отключён" : ""}
        {user.emailVerified === false ? " · почта не подтверждена" : ""}
      </Text>
      <Text className="mt-1 text-[13px] leading-5 text-mute">
        {(user.goals || []).map((id) => GOAL_LABELS[id] || id).join(", ") || "цели не выбраны"}
        {user.daysPerWeek ? ` · ${user.daysPerWeek} дн.` : ""}
        {EXPERIENCE_LABELS[user.experience] ? ` · ${EXPERIENCE_LABELS[user.experience]}` : ""}
      </Text>
      <Text className="mt-1 text-[12px] text-mute">
        с {formatDate(user.createdAt)}
        {user.sessionCount ? ` · сессий ${user.sessionCount}` : ""}
        {user.lastActivityDate ? ` · активность ${formatDate(user.lastActivityDate)}` : ""}
      </Text>
      <View className="mt-3">
        <MintButton
          label={open ? "Свернуть" : "Править"}
          onPress={() => {
            setOpen((prev) => !prev);
            setForm(emptyForm(user));
            setConfirmDelete(false);
            setError("");
          }}
        />
      </View>
      {open ? (
        <View className="mt-4">
          <Field label="Имя" value={form.name} onChangeText={(value) => patchField("name", value)} />
          <Field
            label="Почта"
            value={form.email}
            onChangeText={(value) => patchField("email", value)}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Field
            label="Серия"
            value={form.streak}
            onChangeText={(value) => patchField("streak", value)}
            keyboardType="number-pad"
          />
          <Field
            label="Щиты"
            value={form.freezesLeft}
            onChangeText={(value) => patchField("freezesLeft", value)}
            keyboardType="number-pad"
          />
          <Field
            label="Новый пароль"
            value={form.newPassword}
            onChangeText={(value) => patchField("newPassword", value)}
            placeholder="Пусто — не менять"
            secureTextEntry
            autoCorrect={false}
            autoComplete="off"
          />
          <View className="mb-3 flex-row" style={{ gap: 8 }}>
            <View className="flex-1">
              <PillButton
                wide
                tone={form.emailVerified ? "mint" : "canvas"}
                label={form.emailVerified ? "Почта ок" : "Почта нет"}
                onPress={() => patchField("emailVerified", !form.emailVerified)}
              />
            </View>
            <View className="flex-1">
              <PillButton
                wide
                tone={form.disabled ? "accent" : "canvas"}
                label={form.disabled ? "Отключён" : "Включён"}
                onPress={() => patchField("disabled", !form.disabled)}
              />
            </View>
          </View>
          {error ? <Text className="mb-3 text-[14px] font-medium text-accent">{error}</Text> : null}
          <PrimaryButton glass={false} label="Сохранить" onPress={save} busy={busy === "save"} disabled={Boolean(busy)} />
          <View className="mt-3">
            <MintButton label={busy === "kick" ? "Секунду" : "Сбросить сессии"} onPress={kick} />
          </View>
          <View className="mt-3">
            <MintButton label={busy === "quiz" ? "Секунду" : "Сбросить опрос"} onPress={resetQuiz} />
          </View>
          <View className="mt-2">
            {confirmDelete ? (
              <SoftPress
                onPress={remove}
                disabled={Boolean(busy)}
                className="items-center justify-center rounded-full"
                style={{ minHeight: 48, backgroundColor: "#9f1239" }}
              >
                <Text className="text-[15px] font-semibold text-white">{busy === "delete" ? "Секунду" : "Точно удалить"}</Text>
              </SoftPress>
            ) : (
              <SoftPress
                onPress={() => setConfirmDelete(true)}
                className="items-center justify-center"
                style={{ minHeight: 48 }}
              >
                <Text className="text-[15px] font-semibold" style={{ color: "#9f1239" }}>
                  Удалить аккаунт
                </Text>
              </SoftPress>
            )}
          </View>
        </View>
      ) : null}
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
