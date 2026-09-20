import { Pressable, Text, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { lightTap } from "../../lib/haptics";
import { ageFromBirthDate } from "./catalog";

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

function pad(value) {
  return String(value).padStart(2, "0");
}

function toIso(year, month, day) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function mondayIndex(jsDay) {
  return (jsDay + 6) % 7;
}

export function BirthdayCalendar({ value, onChange }) {
  const selected = value ? new Date(`${value}T00:00:00`) : null;
  const cursor = selected && !Number.isNaN(selected.getTime()) ? selected : new Date(2000, 0, 1);
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = mondayIndex(first.getDay());
  const cells = [];
  for (let i = 0; i < offset; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }

  const apply = (nextYear, nextMonth) => {
    const last = new Date(nextYear, nextMonth + 1, 0).getDate();
    const day = Math.min(selected ? selected.getDate() : 1, last);
    onChange(toIso(nextYear, nextMonth, day));
  };

  const shiftMonth = async (delta) => {
    await lightTap();
    const next = new Date(year, month + delta, 1);
    apply(next.getFullYear(), next.getMonth());
  };

  const shiftYear = async (delta) => {
    await lightTap();
    apply(year + delta, month);
  };

  const age = ageFromBirthDate(value);

  return (
    <View className="rounded-[24px] bg-mint px-4 py-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Pressable onPress={() => shiftMonth(-1)} className="h-9 w-9 items-center justify-center">
          <ChevronLeft size={20} color="#1A1A1A" />
        </Pressable>
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => shiftYear(-1)}>
            <Text className="text-[13px] text-mute">год −</Text>
          </Pressable>
          <Text className="text-[16px] font-semibold text-ink">
            {MONTHS[month]} {year}
          </Text>
          <Pressable onPress={() => shiftYear(1)}>
            <Text className="text-[13px] text-mute">год +</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => shiftMonth(1)} className="h-9 w-9 items-center justify-center">
          <ChevronRight size={20} color="#1A1A1A" />
        </Pressable>
      </View>
      <View className="mb-2 flex-row">
        {WEEK.map((item) => (
          <Text key={item} className="flex-1 text-center text-[11px] text-mute">
            {item}
          </Text>
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {cells.map((day, index) => {
          const iso = day ? toIso(year, month, day) : null;
          const active = iso && iso === value;
          return (
            <Pressable
              key={`${month}-${index}`}
              className="mb-1 items-center justify-center"
              style={{ width: "14.2857%", height: 36 }}
              disabled={!day}
              onPress={() => {
                if (day) {
                  lightTap();
                  onChange(iso);
                }
              }}
            >
              {day ? (
                <View className={`h-8 w-8 items-center justify-center rounded-full ${active ? "bg-accent" : ""}`}>
                  <Text className={`text-[13px] ${active ? "text-white" : "text-ink"}`}>{day}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      <Text className="mt-3 text-center text-[14px] text-ink">
        {age ? `Тебе ${age}` : "Выбери день рождения"}
      </Text>
    </View>
  );
}
