// app/(tabs)/progress.tsx
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Svg, { Circle, Polyline, Line as SvgLine, Text as SvgText } from "react-native-svg";
import { useWorkouts } from "../../hooks/useWorkouts";
import { average, total } from "../../utils/calc";
import { formatDateTime } from "../../utils/date";

const ORANGE = "#FF6A00";
const CHIP_BG = "#151515";
const CHIP_BG_ACTIVE = "#1E1E1E";

type SetRow = { reps: number; weight: number; exercise: string; dateISO: string; ts?: number };
type Point = { dateISO: string; bestWeight: number; volume: number };

export default function Progress() {
  const { workouts } = useWorkouts();
  const { width } = useWindowDimensions();

  // -------------------
  // LOCAL “TAB” STATE
  // -------------------
  type Tab = "Overview" | "Trends";
  const [tab, setTab] = useState<Tab>("Overview");

  // -------------------
  // SHARED DERIVED DATA
  // -------------------
  const allSets: SetRow[] = useMemo(() => {
    const rows: SetRow[] = [];
    for (const w of workouts) {
      for (const ex of w.exercises) {
        for (const s of ex.sets) {
          rows.push({
            reps: s.reps,
            weight: s.weight,
            ts: (s as any).ts,
            exercise: ex.name,
            dateISO: w.dateISO,
          });
        }
      }
    }
    return rows;
  }, [workouts]);

  const totalWorkouts = workouts.length;
  const weeklyGoal = 4;
  const weeklyWorkouts = workouts.filter((w) => {
    const dt = new Date(w.dateISO).getTime();
    const days = (Date.now() - dt) / (1000 * 60 * 60 * 24);
    return days <= 7;
  }).length;
  const weeklyPct = Math.max(0, Math.min(100, (weeklyWorkouts / weeklyGoal) * 100));

  // -------------------
  // OVERVIEW METRICS
  // -------------------
  const maxWeightOverall = allSets.length ? Math.max(...allSets.map((s) => s.weight)) : 0;
  const avgRepsOverall = allSets.length ? average(allSets.map((s) => s.reps)) : 0;
  const recent = workouts.slice(-3).reverse(); // last 3 workouts (newest first)

  // -------------------
  // TRENDS: BY EXERCISE (for the graph)
  // -------------------
  const exerciseNames = useMemo(() => {
    const set = new Set<string>();
    workouts.forEach((w) => w.exercises.forEach((ex) => set.add(ex.name)));
    return Array.from(set).sort();
  }, [workouts]);

  const [exercise, setExercise] = useState<string>(exerciseNames[0] ?? "");

  const series: Point[] = useMemo(() => {
    if (!exercise) return [];
    // For each workout, compute best weight & volume for the selected exercise
    return workouts
      .map((w) => {
        const exMatches = w.exercises.filter((e) => e.name === exercise);
        if (exMatches.length === 0) return null;

        const sets = exMatches.flatMap((e) => e.sets);
        const bestWeight = sets.length ? Math.max(...sets.map((s) => s.weight)) : 0;
        const volume = sets.length ? total(sets.map((s) => s.reps * s.weight)) : 0;

        return { dateISO: w.dateISO, bestWeight, volume };
      })
      .filter(Boolean) as Point[];
  }, [workouts, exercise]);

  const maxBest = series.length ? Math.max(...series.map((p) => p.bestWeight)) : 0;
  const maxVol = series.length ? Math.max(...series.map((p) => p.volume)) : 0;

  // -------------------
  // RENDER
  // -------------------
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={styles.header}>Progress</Text>

      {/* Top-level in-screen tabs */}
      <View style={styles.tabRow}>
        <TabChip label="Overview" active={tab === "Overview"} onPress={() => setTab("Overview")} />
        <TabChip label="Trends" active={tab === "Trends"} onPress={() => setTab("Trends")} />
      </View>

      {tab === "Overview" ? (
        <>
          {/* Weekly Summary */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>This Week</Text>
            <Text style={styles.item}>• Workouts: {weeklyWorkouts} / {weeklyGoal}</Text>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${weeklyPct}%` }]} />
            </View>
            <Text style={styles.progressBarLabel}>
              {weeklyWorkouts}/{weeklyGoal} completed
            </Text>
          </View>

          {/* Overall Stats */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Stats</Text>
            <Text style={styles.item}>• Total Workouts: {totalWorkouts}</Text>
            <Text style={styles.item}>• Total Sets: {allSets.length}</Text>
            <Text style={styles.item}>• Avg Reps per Set: {avgRepsOverall.toFixed(1)}</Text>
            <Text style={styles.item}>• Personal Best (Weight): {maxWeightOverall} lb</Text>
          </View>

          {/* Recent Workouts */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Workouts</Text>
            {recent.length === 0 ? (
              <Text style={styles.item}>No workout data yet</Text>
            ) : (
              recent.map((w) => (
                <View key={w.id} style={styles.workoutCard}>
                  <Text style={styles.workoutTitle}>{formatDateTime(w.dateISO)}</Text>
                  {w.exercises.length === 0 ? (
                    <Text style={styles.exercise}>No exercises added</Text>
                  ) : (
                    w.exercises.map((ex) => (
                      <Text key={ex.id} style={styles.exercise}>
                        {ex.name} — {ex.sets.length} set{ex.sets.length === 1 ? "" : "s"}
                      </Text>
                    ))
                  )}
                </View>
              ))
            )}
          </View>
        </>
      ) : (
        <>
          {/* Exercise Picker */}
          <View style={[styles.card, { paddingBottom: 10 }]}>
            <Text style={styles.cardTitle}>Select Exercise</Text>
            {exerciseNames.length === 0 ? (
              <Text style={styles.item}>No exercises yet — add some in Fitness</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                {exerciseNames.map((name) => {
                  const active = exercise === name;
                  return (
                    <Pressable
                      key={name}
                      onPress={() => setExercise(name)}
                      style={[
                        styles.chip,
                        { backgroundColor: active ? CHIP_BG_ACTIVE : CHIP_BG, borderColor: active ? ORANGE : "#222" },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: active ? ORANGE : "#ddd" }]}>{name}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
            {!!exercise && <Text style={styles.itemSmall}>Showing: {exercise}</Text>}
          </View>

          {/* ===== Line Graph: Best Weight over Time ===== */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Best Weight Over Time</Text>
            {series.length < 2 ? (
              <Text style={styles.item}>Need at least 2 sessions for a line chart</Text>
            ) : (
              <LineChart
                data={series.map((p) => ({ x: new Date(p.dateISO).getTime(), y: p.bestWeight }))}
                width={Math.max(260, width - 40)} // padding accounted by container
                height={220}
                color={ORANGE}
              />
            )}
          </View>

          {/* Trends: Volume per Workout (bars) */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Volume per Workout (reps × weight)</Text>
            {series.length === 0 ? (
              <Text style={styles.item}>No data yet</Text>
            ) : (
              series.map((p, idx) => {
                const maxVolSafe = Math.max(1, maxVol);
                const pct = Math.max(5, (p.volume / maxVolSafe) * 100);
                return (
                  <View key={idx} style={styles.row}>
                    <Text style={styles.rowLabel}>{shortDate(p.dateISO)}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFillMuted, { width: `${pct}%` }]} />
                    </View>
                    <Text style={styles.rowValue}>{p.volume}</Text>
                  </View>
                );
              })
            )}
          </View>

          {/* Timeline (optional) */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Timeline</Text>
            {series.length === 0 ? (
              <Text style={styles.item}>No data yet</Text>
            ) : (
              series.map((p, idx) => (
                <Text key={idx} style={styles.item}>
                  • {formatDateTime(p.dateISO)} — Best: {p.bestWeight} lb, Volume: {p.volume}
                </Text>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

/* ------------- helpers + tiny line chart ------------- */

function shortDate(dateISO: string) {
  const d = new Date(dateISO);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function TabChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tabChip,
        { backgroundColor: active ? CHIP_BG_ACTIVE : CHIP_BG, borderColor: active ? ORANGE : "#222" },
      ]}
    >
      <Text style={[styles.tabChipText, { color: active ? ORANGE : "#ddd" }]}>{label}</Text>
    </Pressable>
  );
}

function LineChart({
  data,
  width,
  height,
  color,
}: {
  data: { x: number; y: number }[];
  width: number;
  height: number;
  color: string;
}) {
  // sort by time
  const sorted = [...data].sort((a, b) => a.x - b.x);

  const minX = sorted[0].x;
  const maxX = sorted[sorted.length - 1].x;
  const minY = Math.min(...sorted.map((p) => p.y));
  const maxY = Math.max(...sorted.map((p) => p.y));

  const pad = 30; // inner padding for axes
  const cw = width - pad * 2;
  const ch = height - pad * 2;

  const mapX = (x: number) => pad + ((x - minX) / Math.max(1, maxX - minX)) * cw;
  const mapY = (y: number) =>
    pad + ch - ((y - minY) / Math.max(1, maxY - minY)) * ch;

  const points = sorted.map((p) => `${mapX(p.x)},${mapY(p.y)}`).join(" ");

  // Build x-axis tick labels (first, middle, last)
  const midIndex = Math.floor(sorted.length / 2);
  const tickXs = [sorted[0].x, sorted[midIndex].x, sorted[sorted.length - 1].x];
  const tickLabels = tickXs.map((t) =>
    new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" })
  );

  return (
    <Svg width={width} height={height}>
      {/* Axes */}
      <SvgLine x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#444" strokeWidth={1} />
      <SvgLine x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#444" strokeWidth={1} />

      {/* X ticks */}
      {tickXs.map((tx, i) => {
        const x = mapX(tx);
        return (
          <React.Fragment key={i}>
            <SvgLine x1={x} y1={height - pad} x2={x} y2={height - pad + 4} stroke="#555" strokeWidth={1} />
            <SvgText
              x={x}
              y={height - pad + 16}
              fill="#888"
              fontSize="10"
              textAnchor="middle"
            >
              {tickLabels[i]}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Line */}
      <Polyline points={points} fill="none" stroke={color} strokeWidth={2} />

      {/* Dots */}
      {sorted.map((p, idx) => (
        <Circle key={idx} cx={mapX(p.x)} cy={mapY(p.y)} r={3} fill={color} />
      ))}

      {/* Y labels: min & max */}
      <SvgText x={pad - 6} y={mapY(minY)} fill="#888" fontSize="10" textAnchor="end">
        {minY}
      </SvgText>
      <SvgText x={pad - 6} y={mapY(maxY)} fill="#888" fontSize="10" textAnchor="end">
        {maxY}
      </SvgText>
    </Svg>
  );
}

/* ------------- styles ------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  header: { color: "#fff", fontSize: 28, fontWeight: "800", marginBottom: 12 },

  // in-screen tabs
  tabRow: { flexDirection: "row", marginBottom: 12 },
  tabChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginRight: 8,
    borderWidth: 1,
  },
  tabChipText: { fontSize: 13, fontWeight: "700" },

  // exercise chips
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginRight: 8,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: "600" },

  card: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f1f1f",
    marginBottom: 16,
  },
  cardTitle: { color: ORANGE, fontWeight: "800", marginBottom: 8, fontSize: 18 },
  item: { color: "#eee", marginTop: 4, fontSize: 14 },
  itemSmall: { color: "#aaa", marginTop: 6, fontSize: 12 },

  progressBarBackground: {
    width: "100%",
    height: 10,
    backgroundColor: "#333",
    borderRadius: 6,
    overflow: "hidden",
    marginTop: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: ORANGE,
    borderRadius: 6,
  },
  progressBarLabel: { color: "#aaa", fontSize: 12, marginTop: 6 },

  // trends bars
  row: { flexDirection: "row", alignItems: "center", marginVertical: 6 },
  rowLabel: { color: "#aaa", width: 72, fontSize: 12 },
  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: "#2a2a2a",
    borderRadius: 6,
    overflow: "hidden",
    marginHorizontal: 8,
  },
  barFill: { height: "100%", backgroundColor: ORANGE },
  barFillMuted: { height: "100%", backgroundColor: "#4c4c4c" },
  rowValue: { color: "#eee", width: 72, textAlign: "right", fontSize: 12 },

  workoutCard: {
    marginTop: 8,
    backgroundColor: "#0f0f0f",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#1f1f1f",
  },
  workoutTitle: { color: ORANGE, fontWeight: "700", marginBottom: 6 },
  exercise: { color: "#eee", marginLeft: 6 },
});
