import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { SoftPress } from "../../ui/SoftPress";
import { glassStyle } from "../../ui/Glass";
import { getPalette } from "../../ui/theme";
import { utcDay } from "../calories/foods";

const MONTHS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

const WEEK = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const DONE = "#E53935";

function pad(value) {
  return String(value).padStart(2, "0");
}

function toIso(year, month, day) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function utcParts(date = new Date()) {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
  };
}

function mondayIndex(jsDay) {
  return (jsDay + 6) % 7;
}

export function activityDaySet(user) {
  const set = new Set();
  for (const item of Array.isArray(user?.activityDates) ? user.activityDates : []) {
    if (item) {
      set.add(String(item));
    }
  }
  if (user?.lastActivityDate) {
    set.add(String(user.lastActivityDate));
  }
  return set;
}

function DayCell({ day, iso, trained, isToday, future, muted }) {
  return (
    <View className="items-center justify-center" style={{ width: "14.2857%", height: 40 }}>
      {day ? (
        <View
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{
            backgroundColor: trained ? DONE : "transparent",
            borderWidth: isToday && !trained ? 1.5 : 0,
            borderColor: "rgba(255,255,255,0.55)",
            opacity: future || muted ? 0.35 : 1,
          }}
        >
          <Text className="text-[13px] font-medium text-white">{day}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function WorkoutCalendar({ user }) {
  const now = utcParts();
  const today = utcDay();
  const [cursor, setCursor] = useState({ year: now.year, month: now.month });
  const [monthOpen, setMonthOpen] = useState(false);
  const done = useMemo(() => activityDaySet(user), [user]);
  const atNow = cursor.year === now.year && cursor.month === now.month;
  const showMonth = monthOpen || !atNow;

  const monthCells = useMemo(() => {
    const first = new Date(Date.UTC(cursor.year, cursor.month, 1));
    const daysInMonth = new Date(Date.UTC(cursor.year, cursor.month + 1, 0)).getUTCDate();
    const offset = mondayIndex(first.getUTCDay());
    const list = [];
    for (let i = 0; i < offset; i += 1) {
      list.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      list.push(day);
    }
    return list;
  }, [cursor]);

  const weekCells = useMemo(() => {
    const todayDate = new Date(`${today}T00:00:00.000Z`);
    const back = mondayIndex(todayDate.getUTCDay());
    const list = [];
    for (let i = 0; i < 7; i += 1) {
      const date = new Date(todayDate);
      date.setUTCDate(todayDate.getUTCDate() - back + i);
      list.push({
        day: date.getUTCDate(),
        iso: date.toISOString().slice(0, 10),
        muted: date.getUTCMonth() !== now.month,
      });
    }
    return list;
  }, [today, now.month]);

  const shift = (delta) => {
    const next = new Date(Date.UTC(cursor.year, cursor.month + delta, 1));
    if (next.getUTCFullYear() > now.year || (next.getUTCFullYear() === now.year && next.getUTCMonth() > now.month)) {
      return;
    }
    setCursor({ year: next.getUTCFullYear(), month: next.getUTCMonth() });
  };

  const cells = showMonth
    ? monthCells.map((day, index) => {
        const iso = day ? toIso(cursor.year, cursor.month, day) : null;
        return {
          key: `${cursor.month}-${index}`,
          day,
          iso,
          trained: iso ? done.has(iso) : false,
          isToday: iso === today,
          future: iso ? iso > today : false,
          muted: false,
        };
      })
    : weekCells.map((item) => ({
        key: item.iso,
        day: item.day,
        iso: item.iso,
        trained: done.has(item.iso),
        isToday: item.iso === today,
        future: item.iso > today,
        muted: item.muted,
      }));

  return (
    <View className="mb-5 rounded-[24px] px-4 py-4" style={glassStyle({ variant: "fill", borderRadius: 24 })}>
      <View className="mb-3 flex-row items-center justify-between">
        {showMonth ? (
          <SoftPress
            onPress={() => shift(-1)}
            className="h-11 w-11 items-center justify-center"
            style={{ width: 44, height: 44 }}
          >
            <ChevronLeft size={20} color={getPalette().ink} strokeWidth={2} />
          </SoftPress>
        ) : (
          <View style={{ width: 44, height: 44 }} />
        )}
        <SoftPress sheen={false} onPress={() => setMonthOpen((value) => !value)}>
          <Text className="text-[16px] font-semibold text-white">
            {showMonth ? `${MONTHS[cursor.month]} ${cursor.year}` : "Эта неделя"}
          </Text>
          <Text className="mt-0.5 text-center text-[12px]" style={{ color: getPalette().accent }}>
            {showMonth ? "Неделя" : "Месяц"}
          </Text>
        </SoftPress>
        {showMonth ? (
          <SoftPress
            onPress={() => shift(1)}
            disabled={atNow}
            className="h-11 w-11 items-center justify-center"
            style={{ width: 44, height: 44, opacity: atNow ? 0.28 : 1 }}
          >
            <ChevronRight size={20} color={getPalette().ink} strokeWidth={2} />
          </SoftPress>
        ) : (
          <View style={{ width: 44, height: 44 }} />
        )}
      </View>
      <View className="mb-2 flex-row">
        {WEEK.map((item) => (
          <Text key={item} className="flex-1 text-center text-[11px] text-white/45">
            {item}
          </Text>
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {cells.map((item) => (
          <DayCell
            key={item.key}
            day={item.day}
            iso={item.iso}
            trained={item.trained}
            isToday={item.isToday}
            future={item.future}
            muted={item.muted}
          />
        ))}
      </View>
    </View>
  );
}
