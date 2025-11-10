import React, { useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { dayKey } from "@/lib/nutrition-store";

type Props = {
  monthBase: Date;                 // any date in the shown month
  selectedDayId: string;           // YYYY-MM-DD
  onSelectDate: (d: Date) => void; // called when user taps a day
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export default function DayCalendar({
  monthBase,
  selectedDayId,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: Props) {
  const { weeks, monthLabel } = useMemo(() => {
    const start = startOfMonth(monthBase);
    const end = endOfMonth(monthBase);

    const firstDow = start.getDay(); // 0=Sun
    const gridStart = addDays(start, -firstDow);
    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) cells.push(addDays(gridStart, i)); // 6 weeks grid

    const byWeeks: Date[][] = [];
    for (let i = 0; i < cells.length; i += 7) byWeeks.push(cells.slice(i, i + 7));

    const label = monthBase.toLocaleString(undefined, {
      month: "long",
      year: "numeric",
    });
    return { weeks: byWeeks, monthLabel: label };
  }, [monthBase]);

  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <View style={{ marginTop: 16 }}>
      {/* header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <Pressable onPress={onPrevMonth} hitSlop={8}><Text style={{ fontSize: 18 }}>‹</Text></Pressable>
        <Text style={{ fontSize: 16, fontWeight: "600" }}>{monthLabel}</Text>
        <Pressable onPress={onNextMonth} hitSlop={8}><Text style={{ fontSize: 18 }}>›</Text></Pressable>
      </View>

      {/* DOW row */}
      <View style={{ flexDirection: "row", opacity: 0.6, marginBottom: 6 }}>
        {dow.map((d) => (
          <View key={d} style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 12 }}>{d}</Text>
          </View>
        ))}
      </View>

      {/* grid */}
      {weeks.map((w, wi) => (
        <View key={wi} style={{ flexDirection: "row", marginBottom: 6 }}>
          {w.map((d) => {
            const inMonth = d.getMonth() === monthBase.getMonth();
            const id = dayKey(d);
            const selected = id === selectedDayId;

            return (
              <Pressable
                key={id}
                onPress={() => onSelectDate(d)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 8,
                  borderRadius: 8,
                  marginHorizontal: 2,
                  backgroundColor: selected ? "#FF6A00" : "transparent",
                }}
              >
                <Text style={{ color: selected ? "white" : inMonth ? "white" : "#909090" }}>
                  {d.getDate()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

