import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Minus, Plus, X } from "lucide-react-native";
import { lightTap } from "../../lib/haptics";
import { Field, GhostButton, PrimaryButton, ScreenHeader } from "../../ui/kit";
import { SoftPress } from "../../ui/SoftPress";
import { glassStyle } from "../../ui/Glass";
import { getPalette } from "../../ui/theme";
import { useAuth } from "../auth/AuthContext";
import { catalogMoveTitles, isHoldMove } from "./catalog";

function Qty({ label, value, min, max, onChange }) {
  const bump = async (delta) => {
    const next = Math.max(min, Math.min(max, value + delta));
    if (next === value) {
      return;
    }
    await lightTap();
    onChange(next);
  };

  return (
    <View className="flex-1">
      <Text className="mb-2 text-[11px] text-white/45">{label}</Text>
      <View className="flex-row items-center">
        <SoftPress
          onPress={() => bump(-1)}
          className="h-11 w-11 items-center justify-center rounded-full"
          style={{ width: 44, height: 44, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          <Minus size={16} color={getPalette().ink} strokeWidth={2} />
        </SoftPress>
        <Text className="mx-2 w-8 text-center text-[16px] font-semibold text-white">{value}</Text>
        <SoftPress
          onPress={() => bump(1)}
          className="h-11 w-11 items-center justify-center rounded-full"
          style={{ width: 44, height: 44, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          <Plus size={16} color={getPalette().ink} strokeWidth={2} />
        </SoftPress>
      </View>
    </View>
  );
}

export function CustomEditor({ onClose }) {
  const insets = useSafeAreaInsets();
  const { patch } = useAuth();
  const titles = useMemo(() => catalogMoveTitles(), []);
  const [name, setName] = useState("Моя тренировка");
  const [query, setQuery] = useState("");
  const [moves, setMoves] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const full = moves.length >= 8;

  const hits = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length < 1) {
      return [];
    }
    return titles.filter((title) => title.toLowerCase().includes(needle)).slice(0, 8);
  }, [query, titles]);

  const addMove = async (title) => {
    const clean = String(title || "").trim().slice(0, 40);
    if (clean.length < 2) {
      setError("Напиши упражнение");
      return;
    }
    if (moves.length >= 8) {
      setError("До 8 упражнений");
      return;
    }
    await lightTap();
    setMoves((prev) => [
      ...prev,
      {
        key: `${Date.now()}-${prev.length}`,
        title: clean,
        reps: isHoldMove(clean) ? 30 : 10,
        sets: 3,
      },
    ]);
    setQuery("");
    setError("");
  };

  const save = async () => {
    setError("");
    if (name.trim().length < 2) {
      setError("Имя от 2 символов");
      return;
    }
    if (!moves.length) {
      setError("Добавь хотя бы одно упражнение");
      return;
    }
    setBusy(true);
    try {
      await patch({
        saveCustom: {
          title: name.trim().slice(0, 32),
          moves: moves.map((item) => ({ title: item.title, reps: item.reps, sets: item.sets })),
        },
      });
      onClose();
    } catch (err) {
      setError(err.message || "Не сохранилось");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1" style={{ paddingTop: insets.top, backgroundColor: "transparent" }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 28 }}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader glass title="Своя тренировка" subtitle="Несколько упражнений подряд, у каждого свои повторы" />
        <Field glass label="Название" value={name} onChangeText={setName} maxLength={32} />

        <Text className="mb-3 text-[15px] font-semibold text-white">
          {moves.length ? `${moves.length} из 8 · можно ещё` : "Добавь упражнения"}
        </Text>

        {moves.map((item) => (
          <View key={item.key} className="mb-3 rounded-[16px] px-4 py-3" style={glassStyle({ borderRadius: 16 })}>
            <View className="flex-row items-center justify-between">
              <Text className="mr-3 flex-1 text-[16px] font-semibold text-white">{item.title}</Text>
              <Pressable
                onPress={async () => {
                  await lightTap();
                  setMoves((prev) => prev.filter((row) => row.key !== item.key));
                }}
                className="h-11 w-11 items-center justify-center"
                style={{ minHeight: 44, minWidth: 44 }}
              >
                <X size={18} color="rgba(255,255,255,0.55)" strokeWidth={1.8} />
              </Pressable>
            </View>
            <View className="mt-2 flex-row" style={{ gap: 12 }}>
              <Qty
                label={isHoldMove(item.title) ? "Секунды" : "Повторы"}
                value={item.reps}
                min={1}
                max={40}
                onChange={(reps) => setMoves((prev) => prev.map((row) => (row.key === item.key ? { ...row, reps } : row)))}
              />
              <Qty
                label="Подходы"
                value={item.sets}
                min={1}
                max={6}
                onChange={(sets) => setMoves((prev) => prev.map((row) => (row.key === item.key ? { ...row, sets } : row)))}
              />
            </View>
          </View>
        ))}

        {full ? (
          <Text className="mb-4 text-[14px] text-white/55">Дальше не влезет — убери одно или сохрани.</Text>
        ) : (
          <>
            <Text className="mb-2 text-[12px] font-medium tracking-[0.8px] text-white/55">
              {moves.length ? "Следующее упражнение" : "Упражнение"}
            </Text>
            <View className="mb-3 flex-row items-center" style={{ gap: 8 }}>
              <TextInput
                className="flex-1 rounded-2xl px-4 text-[16px] text-white"
                placeholder="Найди или напиши своё"
                placeholderTextColor="#8A8A8A"
                value={query}
                onChangeText={(value) => {
                  setQuery(value);
                  setError("");
                }}
                returnKeyType="done"
                onSubmitEditing={() => addMove(query)}
                style={[
                  { minHeight: 48, paddingVertical: 12 },
                  glassStyle({ variant: "fill", borderRadius: 16 }),
                ]}
              />
              <SoftPress
                onPress={() => addMove(query.trim() || hits[0] || "")}
                className="h-12 w-12 items-center justify-center rounded-full"
                style={{ width: 48, height: 48, borderRadius: 999, backgroundColor: getPalette().accent }}
              >
                <Plus size={20} color="#FFFFFF" strokeWidth={2.2} />
              </SoftPress>
            </View>
            {hits.length ? (
              <View className="mb-4">
                {hits.map((title) => (
                  <Pressable
                    key={title}
                    onPress={() => addMove(title)}
                    className="mb-2 rounded-[16px] px-4 py-3"
                    style={glassStyle({ variant: "fill", borderRadius: 16 })}
                  >
                    <Text className="text-[15px] text-white">{title}</Text>
                  </Pressable>
                ))}
              </View>
            ) : query.trim().length >= 2 ? (
              <View className="mb-4">
                <GhostButton glass label={`Добавить «${query.trim().slice(0, 24)}»`} onPress={() => addMove(query)} />
              </View>
            ) : null}
          </>
        )}

        {error ? <Text className="mb-3 text-[14px] font-medium text-accent">{error}</Text> : null}
        <PrimaryButton label="Сохранить" onPress={save} busy={busy} />
        <View className="mt-3">
          <GhostButton glass label="Назад" onPress={onClose} />
        </View>
      </ScrollView>
    </View>
  );
}
