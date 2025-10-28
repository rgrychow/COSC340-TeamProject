// app/(tabs)/progress.tsx
import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, {
  Circle,
  Polyline,
  Rect,
  Line as SvgLine,
  Text as SvgText,
} from "react-native-svg";
import { useWorkouts } from "../../hooks/useWorkouts";
import { average, total } from "../../utils/calc";
import { formatDateTime } from "../../utils/date";
import {
  fetchDayData,
  saveWorkout,
} from "../../utils/firestoreHelpers";
import { weeklyStreak } from "../../utils/streak";

const ORANGE = "#FF6A00";
const CHIP_BG = "#151515";
const CHIP_BG_ACTIVE = "#1E1E1E";
const GRAY = "#888";

type Point = {
  dateISO: string;
  bestWeight: number;
  volume: number;
  avgReps: number;
};

export default function Progress() {
  const { workouts } = useWorkouts();
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<"Overview" | "Trends">("Overview");
  const [metric, setMetric] = useState<"weight" | "volume" | "reps">("weight");
  const [cloudStatus, setCloudStatus] = useState("local");

  // -------------------
  // Sync workouts to Firestore
  // -------------------
  async function syncToCloud() {
    try {
      const today = new Date().toISOString().slice(0, 10);
      for (const w of workouts) {
        const day = w.dateISO.slice(0, 10);
        for (const ex of w.exercises) {
          for (let i = 0; i < ex.sets.length; i++) {
            const s = ex.sets[i];
            await saveWorkout(day, ex.name, i + 1, s.reps, s.weight);
          }
        }
      }
      setCloudStatus("synced");
      Alert.alert("✅ Synced", "Workouts saved to Firestore!");
    } catch (err: any) {
      console.error("Sync Error:", err);
      Alert.alert("Error", "Failed to sync workouts.");
      setCloudStatus("error");
    }
  }

  const [cloudData, setCloudData] = useState<any>(null);

  async function pullFromCloud() {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const data = await fetchDayData(today);
      setCloudData(data);
      setCloudStatus("downloaded");
      Alert.alert("📥 Pulled Data", "Fetched workouts from Firestore!");
    } catch (err: any) {
      console.error("Fetch Error:", err);
      Alert.alert("Error", "Failed to fetch from Firestore.");
    }
  }

  // -------------------
  // Flatten data
  // -------------------
  const allSets = useMemo(() => {
    const rows: any[] = [];
    for (const w of workouts) {
      for (const ex of w.exercises) {
        for (const s of ex.sets) {
          rows.push({
            reps: s.reps,
            weight: s.weight,
            exercise: ex.name,
            dateISO: w.dateISO,
          });
        }
      }
    }
    return rows;
  }, [workouts]);

  // -------------------
  // Overview metrics
  // -------------------
  const totalWorkouts = workouts.length;
  const totalSets = allSets.length;
  const avgReps = totalSets ? average(allSets.map((s) => s.reps)) : 0;
  const personalBest = totalSets
    ? Math.max(...allSets.map((s) => s.weight))
    : 0;

  const bestsByExercise = useMemo(() => {
    const map = new Map<string, { weight: number; date: string }>();
    for (const s of allSets) {
      if (!map.has(s.exercise) || s.weight > map.get(s.exercise)!.weight) {
        map.set(s.exercise, { weight: s.weight, date: s.dateISO });
      }
    }
    return Array.from(map.entries()).map(([exercise, info]) => ({
      exercise,
      ...info,
    }));
  }, [allSets]);

  const weeklyGoal = 4;
  const streak = weeklyStreak(workouts, weeklyGoal);

  const avgGap = useMemo(() => {
    if (workouts.length < 2) return 0;
    const times = workouts
      .map((w) => new Date(w.dateISO).getTime())
      .sort((a, b) => a - b);
    const diffs = [];
    for (let i = 1; i < times.length; i++)
      diffs.push((times[i] - times[i - 1]) / (1000 * 60 * 60 * 24));
    return average(diffs);
  }, [workouts]);

  const weekdayStats = useMemo(() => {
    const counts = Array(7).fill(0);
    workouts.forEach((w) => counts[new Date(w.dateISO).getDay()]++);
    return counts;
  }, [workouts]);

  // -------------------
  // Trends
  // -------------------
  const exerciseNames = useMemo(() => {
    const set = new Set<string>();
    workouts.forEach((w) => w.exercises.forEach((ex) => set.add(ex.name)));
    return Array.from(set).sort();
  }, [workouts]);

  const [exercise, setExercise] = useState<string>(exerciseNames[0] ?? "");

  const series: Point[] = useMemo(() => {
    if (!exercise) return [];
    return workouts
      .map((w) => {
        const exMatches = w.exercises.filter((e) => e.name === exercise);
        if (!exMatches.length) return null;
        const sets = exMatches.flatMap((e) => e.sets);
        const bestWeight = Math.max(...sets.map((s) => s.weight));
        const volume = total(sets.map((s) => s.reps * s.weight));
        const avgReps = average(sets.map((s) => s.reps));
        return { dateISO: w.dateISO, bestWeight, volume, avgReps };
      })
      .filter(Boolean) as Point[];
  }, [workouts, exercise]);

  const maxVal =
    metric === "weight"
      ? Math.max(...series.map((p) => p.bestWeight), 0)
      : metric === "volume"
        ? Math.max(...series.map((p) => p.volume), 0)
        : Math.max(...series.map((p) => p.avgReps), 0);

  // -------------------
  // Render
  // -------------------
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text style={styles.header}>Progress</Text>

      <View style={styles.syncBadge}>
        <View
          style={[
            styles.dot,
            {
              backgroundColor:
                cloudStatus === "synced"
                  ? "#4CAF50"
                  : cloudStatus === "error"
                    ? "#F44336"
                    : cloudStatus === "downloaded"
                      ? "#2196F3"
                      : "#AAA",
            },
          ]}
        />
        <Text style={styles.syncText}>
          {cloudStatus === "synced"
            ? "Cloud Synced"
            : cloudStatus === "downloaded"
              ? "Data Pulled"
              : "Local Data"}
        </Text>
      </View>

      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        <TouchableOpacity style={styles.syncButton} onPress={syncToCloud}>
          <Text style={styles.syncButtonText}>Sync → Cloud</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.syncButton} onPress={pullFromCloud}>
          <Text style={styles.syncButtonText}>Pull ← Cloud</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TabChip
          label="Overview"
          active={tab === "Overview"}
          onPress={() => setTab("Overview")}
        />
        <TabChip
          label="Trends"
          active={tab === "Trends"}
          onPress={() => setTab("Trends")}
        />
      </View>

      {tab === "Overview" ? (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Consistency</Text>
            <Text style={styles.item}>Weekly Goal: {weeklyGoal} workouts</Text>
            <Text style={styles.item}>Current Streak: {streak} weeks 🔥</Text>
            {avgGap > 0 && (
              <Text style={styles.item}>
                Avg gap between workouts: {avgGap.toFixed(1)} days
              </Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Personal Bests</Text>
            {bestsByExercise.length === 0 ? (
              <Text style={styles.item}>No data yet</Text>
            ) : (
              bestsByExercise.map((b, i) => (
                <Text key={i} style={styles.item}>
                  {b.exercise}: {b.weight} lb ({formatDateTime(b.date)})
                </Text>
              ))
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Most Active Days</Text>
            <Svg width={width - 80} height={120}>
              {weekdayStats.map((count, i) => {
                const max = Math.max(...weekdayStats);
                const h = max ? (count / max) * 100 : 0;
                const barX = 20 + i * 40;
                const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
                return (
                  <React.Fragment key={i}>
                    <Rect
                      x={barX}
                      y={110 - h}
                      width={20}
                      height={h}
                      fill={ORANGE}
                      rx={4}
                    />
                    <SvgText
                      x={barX + 10}
                      y={115}
                      fill={GRAY}
                      fontSize="10"
                      textAnchor="middle"
                    >
                      {dayLabels[i]}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </Svg>
          </View>
        </>
      ) : (
        <>
          {/* Metric Toggle */}
          <View
            style={[
              styles.card,
              { flexDirection: "row", justifyContent: "space-around" },
            ]}
          >
            {["weight", "volume", "reps"].map((m) => (
              <Pressable
                key={m}
                onPress={() => setMetric(m as any)}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      metric === m ? CHIP_BG_ACTIVE : CHIP_BG,
                    borderColor: metric === m ? ORANGE : "#222",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: metric === m ? ORANGE : "#ddd" },
                  ]}
                >
                  {m === "weight"
                    ? "Best Weight"
                    : m === "volume"
                      ? "Volume"
                      : "Reps"}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Graph */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Progress Over Time ({metric})
            </Text>
            {series.length < 2 ? (
              <Text style={styles.item}>Not enough data yet</Text>
            ) : (
              <LineChart
                data={series.map((p) => ({
                  x: new Date(p.dateISO).getTime(),
                  y:
                    metric === "weight"
                      ? p.bestWeight
                      : metric === "volume"
                        ? p.volume
                        : p.avgReps,
                }))}
                width={Math.max(260, width - 40)}
                height={260}
                color={ORANGE}
                metric={metric}
              />
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

// ----------------- Components -----------------
function TabChip({ label, active, onPress }: any) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tabChip,
        {
          backgroundColor: active ? CHIP_BG_ACTIVE : CHIP_BG,
          borderColor: active ? ORANGE : "#222",
        },
      ]}
    >
      <Text
        style={[styles.tabChipText, { color: active ? ORANGE : "#ddd" }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function LineChart({ data, width, height, color, metric }: any) {
  const sorted = [...data].sort((a, b) => a.x - b.x);
  const pad = 40;
  const cw = width - pad * 2;
  const ch = height - pad * 2;
  const minX = sorted[0].x;
  const maxX = sorted[sorted.length - 1].x;
  const minY = 0;
  const maxY = Math.max(...sorted.map((p) => p.y));
  const mapX = (x: number) => pad + ((x - minX) / Math.max(1, maxX - minX)) * cw;
  const mapY = (y: number) => pad + ch - ((y - minY) / Math.max(1, maxY - minY)) * ch;
  const points = sorted.map((p) => `${mapX(p.x)},${mapY(p.y)}`).join(" ");
  const tickCount = 4;
  const tickValues = Array.from({ length: tickCount + 1 }, (_, i) => Math.round((maxY / tickCount) * i));

  return (
    <Svg width={width} height={height}>
      <SvgLine x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#444" strokeWidth={1} />
      <SvgLine x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#444" strokeWidth={1} />
      {tickValues.map((val, i) => {
        const y = mapY(val);
        return (
          <React.Fragment key={i}>
            <SvgLine x1={pad - 5} y1={y} x2={width - pad} y2={y} stroke="#222" strokeWidth={0.5} />
            <SvgText x={pad - 8} y={y + 3} fill="#888" fontSize="10" textAnchor="end">
              {val}
            </SvgText>
          </React.Fragment>
        );
      })}
      {[sorted[0], sorted[Math.floor(sorted.length / 2)], sorted.at(-1)].map((p, i) =>
        p ? (
          <SvgText
            key={i}
            x={mapX(p.x)}
            y={height - pad + 15}
            fill="#888"
            fontSize="10"
            textAnchor="middle"
          >
            {new Date(p.x).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </SvgText>
        ) : null
      )}
      <Polyline points={points} fill="none" stroke={color} strokeWidth={2} />
      {sorted.map((p, i) => (
        <Circle key={i} cx={mapX(p.x)} cy={mapY(p.y)} r={3} fill={color} />
      ))}
      <SvgText x={pad - 30} y={pad - 10} fill="#aaa" fontSize="12" textAnchor="start">
        {metric === "weight" ? "Weight (lb)" : metric === "volume" ? "Volume" : "Reps"}
      </SvgText>
      <SvgText x={width / 2} y={height - 5} fill="#aaa" fontSize="12" textAnchor="middle">
        Date
      </SvgText>
    </Svg>
  );
}

// ----------------- Styles -----------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  header: { color: "#fff", fontSize: 28, fontWeight: "800", marginBottom: 12 },
  tabRow: { flexDirection: "row", marginBottom: 12 },
  tabChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, marginRight: 8, borderWidth: 1 },
  tabChipText: { fontSize: 13, fontWeight: "700" },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, marginRight: 8, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: "600" },
  card: { backgroundColor: "#111", padding: 16, borderRadius: 14, borderWidth: 1, borderColor: "#1f1f1f", marginBottom: 16 },
  cardTitle: { color: ORANGE, fontWeight: "800", marginBottom: 8, fontSize: 18 },
  item: { color: "#eee", marginTop: 4, fontSize: 14 },
  itemSmall: { color: "#aaa", marginTop: 6, fontSize: 12 },
  syncBadge: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  syncText: { color: "#aaa", fontSize: 12 },
  syncButton: { backgroundColor: "#222", padding: 10, borderRadius: 8, marginRight: 10, borderWidth: 1, borderColor: "#444" },
  syncButtonText: { color: ORANGE, fontWeight: "700" },
});
