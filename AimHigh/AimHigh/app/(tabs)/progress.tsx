// app/(tabs)/progress.tsx
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { auth, db } from "../../firebase";
import { useWorkouts } from "../../hooks/useWorkouts";
import { average, total } from "../../utils/calc";
import { weeklyStreak } from "../../utils/streak";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ORANGE = "#FF6A00";
const GRAY = "#888";
const screenWidth = Dimensions.get("window").width;

// -------- date helpers --------
const pad2 = (n: number) => String(n).padStart(2, "0");
const toDayId = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const compareISO = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const todayISO = toDayId(new Date());

type PlannedWorkout = {
  id: string;
  name: string;
  notes?: string;
  targetReps?: number;
  targetWeight?: number;
  completed: boolean;
  createdAt?: any;
};

export default function Progress() {
  // -------- core state --------
  const { workouts } = useWorkouts(); // local context used for charts/metrics
  const [tab, setTab] = useState<"Overview" | "Trends">("Overview");
  const [metric, setMetric] = useState<"weight" | "volume" | "reps">("weight");
  const [exercise, setExercise] = useState<string>("");

  // Calendar UI
  const [calendarOpen, setCalendarOpen] = useState(true);
  const [selectedDayISO, setSelectedDayISO] = useState<string>(todayISO);

  // Month grid (simple current-month calendar)
  const [monthCursor, setMonthCursor] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  // Firestore marker maps
  const [plannedDays, setPlannedDays] = useState<string[]>([]);
  const [completedDays, setCompletedDays] = useState<string[]>([]);

  // Planned items for selected day
  const [plannedItems, setPlannedItems] = useState<PlannedWorkout[]>([]);

  // Plan/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<{
    id?: string;
    name: string;
    notes: string;
    targetReps: string;
    targetWeight: string;
  }>({ name: "", notes: "", targetReps: "", targetWeight: "" });

  // -------- collapsing calendar --------
  const toggleCalendar = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCalendarOpen((s) => !s);
  };

  // -------- Firestore listeners: planned days + completed days --------
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubPlanned = onSnapshot(
      collection(db, "users", user.uid, "plannedDays"),
      (snap) => {
        const days: string[] = [];
        snap.forEach((d) => days.push(d.id));
        setPlannedDays(days.sort(compareISO));
      }
    );

    const unsubCompleted = onSnapshot(
      collection(db, "users", user.uid, "workoutDays"),
      (snap) => {
        const days: string[] = [];
        snap.forEach((d) => days.push(d.id));
        setCompletedDays(days.sort(compareISO));
      }
    );

    return () => {
      unsubPlanned();
      unsubCompleted();
    };
  }, []);

  // -------- Firestore listener: planned workouts for selected day --------
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !selectedDayISO) return;

    const unsub = onSnapshot(
      collection(
        db,
        "users",
        user.uid,
        "plannedDays",
        selectedDayISO,
        "plannedWorkouts"
      ),
      (snap) => {
        const arr: PlannedWorkout[] = [];
        snap.forEach((d) => {
          const data = d.data() as any;
          arr.push({
            id: d.id,
            name: String(data.name || ""),
            notes: data.notes || "",
            targetReps:
              typeof data.targetReps === "number" ? data.targetReps : undefined,
            targetWeight:
              typeof data.targetWeight === "number"
                ? data.targetWeight
                : undefined,
            completed: !!data.completed,
            createdAt: data.createdAt,
          });
        });
        setPlannedItems(arr);
      }
    );

    return () => unsub();
  }, [selectedDayISO]);

  // -------- calendar computations --------
  const daysInMonth = new Date(
    monthCursor.getFullYear(),
    monthCursor.getMonth() + 1,
    0
  ).getDate();
  const firstDow = new Date(
    monthCursor.getFullYear(),
    monthCursor.getMonth(),
    1
  ).getDay();
  const grid: (string | null)[] = [];
  for (let i = 0; i < firstDow; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${monthCursor.getFullYear()}-${pad2(
      monthCursor.getMonth() + 1
    )}-${pad2(d)}`;
    grid.push(iso);
  }
  while (grid.length % 7 !== 0) grid.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < grid.length; i += 7) weeks.push(grid.slice(i, i + 7));

  // -------- planning helpers --------
  const isFuture = (iso: string) => compareISO(iso, todayISO) === 1;
  const openPlanModal = (existing?: PlannedWorkout) => {
    if (existing) {
      setEditDraft({
        id: existing.id,
        name: existing.name,
        notes: existing.notes || "",
        targetReps:
          existing.targetReps != null ? String(existing.targetReps) : "",
        targetWeight:
          existing.targetWeight != null ? String(existing.targetWeight) : "",
      });
    } else {
      setEditDraft({
        id: undefined,
        name: "",
        notes: "",
        targetReps: "",
        targetWeight: "",
      });
    }
    setModalOpen(true);
  };

  const savePlan = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const name = editDraft.name.trim();
    if (!name) {
      Alert.alert("Please enter a workout name.");
      return;
    }
    const payload = {
      name,
      notes: editDraft.notes.trim(),
      targetReps:
        editDraft.targetReps !== "" ? Number(editDraft.targetReps) : null,
      targetWeight:
        editDraft.targetWeight !== "" ? Number(editDraft.targetWeight) : null,
      completed: false,
      createdAt: serverTimestamp(),
    };
    try {
      const colRef = collection(
        db,
        "users",
        user.uid,
        "plannedDays",
        selectedDayISO,
        "plannedWorkouts"
      );
      if (editDraft.id) {
        await updateDoc(doc(colRef, editDraft.id), payload as any);
      } else {
        await setDoc(doc(colRef), payload as any);
      }
      setModalOpen(false);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save plan.");
    }
  };

  const markPlanComplete = async (plan: PlannedWorkout) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const ref = doc(
        db,
        "users",
        user.uid,
        "plannedDays",
        selectedDayISO,
        "plannedWorkouts",
        plan.id
      );
      await updateDoc(ref, { completed: true, completedAt: serverTimestamp() });
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to mark complete.");
    }
  };

  const deletePlan = async (plan: PlannedWorkout) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const ref = doc(
        db,
        "users",
        user.uid,
        "plannedDays",
        selectedDayISO,
        "plannedWorkouts",
        plan.id
      );
      await deleteDoc(ref);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to delete plan.");
    }
  };

  // -------- derive metrics for Overview --------
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

  const totalWorkouts = workouts.length;
  const totalSets = allSets.length;
  const avgReps = totalSets ? average(allSets.map((s) => s.reps)) : 0;
  const personalBest = totalSets ? Math.max(...allSets.map((s) => s.weight)) : 0;

  const exerciseNames = useMemo(() => {
    const set = new Set<string>();
    allSets.forEach((s) => set.add(s.exercise));
    return Array.from(set).sort();
  }, [allSets]);

  useEffect(() => {
    if (!exercise && exerciseNames.length > 0) setExercise(exerciseNames[0]);
  }, [exerciseNames.length]);

  // --- adaptive aggregation for large datasets ---
const series = useMemo(() => {
  if (!exercise) return [];

  const filtered = allSets.filter((s) => s.exercise === exercise);
  const grouped: Record<string, any[]> = {};

  filtered.forEach((s) => {
    const day = s.dateISO;
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(s);
  });

  // daily averages
  const daily = Object.entries(grouped).map(([dateISO, sets]) => {
    const reps = average(sets.map((s) => s.reps));
    const vol = total(sets.map((s) => s.reps * s.weight));
    const best = Math.max(...sets.map((s) => s.weight));
    return { dateISO, bestWeight: best, volume: vol, avgReps: reps };
  });

  // sort chronologically
  daily.sort((a, b) => compareISO(a.dateISO, b.dateISO));

  return daily;
}, [allSets, exercise]);

// --- chartData with adaptive smoothing and fixed axis ---
const chartData = useMemo(() => {
  if (!series.length) return null;

  const MAX_POINTS = 40;
  let points = [...series];

  if (points.length > MAX_POINTS) {
    // Smooth by averaging chunks
    const chunkSize = Math.ceil(points.length / MAX_POINTS);
    const smoothed: any[] = [];
    for (let i = 0; i < points.length; i += chunkSize) {
      const chunk = points.slice(i, i + chunkSize);
      const avgVal = {
        dateISO: chunk[Math.floor(chunk.length / 2)].dateISO,
        bestWeight: average(chunk.map((p) => p.bestWeight)),
        volume: average(chunk.map((p) => p.volume)),
        avgReps: average(chunk.map((p) => p.avgReps)),
      };
      smoothed.push(avgVal);
    }
    points = smoothed;
  }

  const labels = points.map((p, i) => {
    const d = new Date(p.dateISO);
    // show only a few evenly spaced labels
    return i % Math.ceil(points.length / 6) === 0
      ? `${d.getMonth() + 1}/${d.getDate()}`
      : "";
  });

  const values =
    metric === "weight"
      ? points.map((p) => p.bestWeight)
      : metric === "volume"
      ? points.map((p) => p.volume)
      : points.map((p) => p.avgReps);

  return { labels, values };
}, [series, metric]);



  const weeklyGoal = 4;
  const streak = weeklyStreak(workouts, weeklyGoal);

  // -------- demo data visibility (show only if no completed days) --------
  const showDemoButton = completedDays.length === 0;

  const loadDemoData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const sample = [
        {
          date: "2025-11-01",
          items: [
            {
              name: "Bench Press",
              sets: [
                { reps: 10, weight: 135 },
                { reps: 8, weight: 145 },
                { reps: 6, weight: 155 },
              ],
            },
          ],
        },
        {
          date: "2025-11-03",
          items: [
            {
              name: "Squat",
              sets: [
                { reps: 10, weight: 185 },
                { reps: 8, weight: 205 },
                { reps: 6, weight: 225 },
              ],
            },
          ],
        },
        {
          date: "2025-11-05",
          items: [
            {
              name: "Deadlift",
              sets: [
                { reps: 8, weight: 225 },
                { reps: 6, weight: 245 },
                { reps: 4, weight: 265 },
              ],
            },
          ],
        },
      ];

      for (const day of sample) {
        const workoutsCol = collection(
          db,
          "users",
          user.uid,
          "workoutDays",
          day.date,
          "workouts"
        );
        for (const w of day.items) {
          const workoutRef = doc(workoutsCol);
          await setDoc(workoutRef, {
            workoutType: w.name,
            createdAt: serverTimestamp(),
          });
          for (const s of w.sets) {
            await setDoc(
              doc(
                db,
                "users",
                user.uid,
                "workoutDays",
                day.date,
                "workouts",
                workoutRef.id,
                "sets",
                crypto.randomUUID()
              ),
              { reps: s.reps, weight: s.weight, createdAt: serverTimestamp() }
            );
          }
        }
      }

      Alert.alert("✅ Demo Data Loaded", "Sample workouts added to your account.");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to load demo data.");
    }
  };

  // -------- render calendar --------
  const renderCalendar = () => (
    <View style={styles.card}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity
          onPress={() =>
            setMonthCursor(
              new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1)
            )
          }
        >
          <Text style={styles.monthBtn}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.cardTitle}>
          {monthCursor.toLocaleString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </Text>
        <TouchableOpacity
          onPress={() =>
            setMonthCursor(
              new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1)
            )
          }
        >
          <Text style={styles.monthBtn}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <Text key={d} style={[styles.weekDay, { color: "#777" }]}>
            {d}
          </Text>
        ))}
      </View>

      {weeks.map((w, wi) => (
        <View key={wi} style={styles.weekRow}>
          {w.map((iso, di) => {
            if (!iso)
              return (
                <View
                  key={`empty-${wi}-${di}`}
                  style={[styles.dayCell, { backgroundColor: "transparent" }]}
                />
              );
            const planned = plannedDays.includes(iso);
            const completed = completedDays.includes(iso);
            const selected = selectedDayISO === iso;
            const bg = selected ? "#1A1A1A" : "#0D0D0D";
            const border = selected ? ORANGE : "#222";

            return (
              <Pressable
                key={iso}
                onPress={() => setSelectedDayISO(iso)}
                style={[styles.dayCell, { backgroundColor: bg, borderColor: border }]}
              >
                <Text style={styles.dayNum}>{parseInt(iso.slice(-2))}</Text>
                <View style={styles.dotRow}>
                  {planned && (
                    <View style={[styles.dotSmall, { backgroundColor: "#3BA3FF" }]} />
                  )}
                  {completed && (
                    <View style={[styles.dotSmall, { backgroundColor: ORANGE }]} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}

      {/* Day actions & planned list */}
      <View style={{ marginTop: 10 }}>
        {isFuture(selectedDayISO) ? (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => openPlanModal()}
          >
            <Text style={styles.primaryBtnText}>
              Plan Workout for {selectedDayISO}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.muted}>
            {selectedDayISO === todayISO ? "Today" : "Past Day"} — view and
            check off planned items below.
          </Text>
        )}
      </View>

      <View style={{ marginTop: 10 }}>
        <Text style={styles.sectionTitle}>Planned Workouts ({selectedDayISO})</Text>
        {plannedItems.length === 0 ? (
          <Text style={styles.muted}>No plans yet.</Text>
        ) : (
          plannedItems.map((p) => (
            <View key={p.id} style={styles.planRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.planTitle}>
                  {p.name} {p.completed ? "✓" : ""}
                </Text>
                {!!p.notes && <Text style={styles.planNotes}>{p.notes}</Text>}
                <Text style={styles.planMeta}>
                  {p.targetReps != null ? `Target Reps: ${p.targetReps}   ` : ""}
                  {p.targetWeight != null ? `Target Wt: ${p.targetWeight} lb` : ""}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {!p.completed && !isFuture(selectedDayISO) && (
                  <TouchableOpacity
                    style={[styles.smallBtn, { borderColor: "#52D273" }]}
                    onPress={() => markPlanComplete(p)}
                  >
                    <Text style={styles.smallBtnText}>Check Off</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={() => openPlanModal(p)}
                >
                  <Text style={styles.smallBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallBtn, { borderColor: "#C44" }]}
                  onPress={() => deletePlan(p)}
                >
                  <Text style={styles.smallBtnText}>Del</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );

  // -------- render --------
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      <Text style={styles.header}>Progress</Text>

      {/* Collapsible Calendar Header */}
      <TouchableOpacity onPress={toggleCalendar} style={styles.collapseHeader}>
        <Text style={styles.cardTitle}>Calendar</Text>
        <Text style={styles.toggleArrow}>{calendarOpen ? "▲" : "▼"}</Text>
      </TouchableOpacity>
      {calendarOpen && renderCalendar()}

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TabChip label="Overview" active={tab === "Overview"} onPress={() => setTab("Overview")} />
        <TabChip label="Trends" active={tab === "Trends"} onPress={() => setTab("Trends")} />
      </View>

      {tab === "Overview" ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Overview</Text>
          <Text style={styles.item}>Workouts Logged: {totalWorkouts}</Text>
          <Text style={styles.item}>Personal Best: {personalBest} lb</Text>
          <Text style={styles.item}>Avg Reps: {avgReps.toFixed(1)}</Text>
          <Text style={styles.item}>Streak: {streak} weeks 🔥</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trends</Text>

          {/* Load Demo Data — shows only if no completed workouts exist */}
          

          {/* Organized controls */}
          <View style={styles.trendSelectors}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {exerciseNames.map((name) => (
                <Pressable
                  key={name}
                  onPress={() => setExercise(name)}
                  style={[styles.trendPill, exercise === name && styles.trendPillActive]}
                >
                  <Text
                    style={[
                      styles.trendPillText,
                      exercise === name && styles.trendPillTextActive,
                    ]}
                  >
                    {name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {(["weight", "volume", "reps"] as const).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setMetric(m)}
                  style={[styles.trendPill, metric === m && styles.trendPillActive]}
                >
                  <Text
                    style={[
                      styles.trendPillText,
                      metric === m && styles.trendPillTextActive,
                    ]}
                  >
                    {m.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Chart */}
          {chartData ? (
            <LineChart
              data={{
                labels: chartData.labels,
                datasets: [
                  {
                    data: chartData.values,
                    color: () => ORANGE,
                    strokeWidth: 2,
                  },
                ],
              }}
              width={screenWidth - 40}
              height={240}
              yAxisLabel=""
              fromZero
              withDots={chartData.values.length <= 30}
              yAxisInterval={1}
              chartConfig={{
                backgroundGradientFrom: "#000",
                backgroundGradientTo: "#000",
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(255, 106, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255,255,255,${opacity})`,
                propsForDots: { r: "3", strokeWidth: "1", stroke: "#FF6A00" },
              }}
              bezier
              style={{ marginTop: 10, borderRadius: 10 }}
            />
          ) : (
            <Text style={styles.muted}>No data yet.</Text>
          )}

        </View>
      )}

      {/* Plan/Edit Modal */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editDraft.id ? "Edit Planned Workout" : "Plan Workout"} — {selectedDayISO}
            </Text>

            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Push/Pull Day"
              placeholderTextColor="#666"
              value={editDraft.name}
              onChangeText={(t) => setEditDraft((s) => ({ ...s, name: t }))}
            />

            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, { height: 68 }]}
              placeholder="Notes, focus, time, etc."
              placeholderTextColor="#666"
              multiline
              value={editDraft.notes}
              onChangeText={(t) => setEditDraft((s) => ({ ...s, notes: t }))}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Target Reps</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="e.g., 30"
                  placeholderTextColor="#666"
                  value={editDraft.targetReps}
                  onChangeText={(t) =>
                    setEditDraft((s) => ({ ...s, targetReps: t.replace(/[^\d]/g, "") }))
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Target Weight (lb)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="e.g., 135"
                  placeholderTextColor="#666"
                  value={editDraft.targetWeight}
                  onChangeText={(t) =>
                    setEditDraft((s) => ({
                      ...s,
                      targetWeight: t.replace(/[^\d.]/g, ""),
                    }))
                  }
                />
              </View>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 12, gap: 8 }}>
              <TouchableOpacity style={styles.outlineBtn} onPress={() => setModalOpen(false)}>
                <Text style={styles.outlineBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={savePlan}>
                <Text style={styles.primaryBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
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
    <Pressable style={[styles.pill, active && styles.pillActive]} onPress={onPress}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

// -------- styles --------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  header: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 10 },

  // Cards
  card: {
    backgroundColor: "#0D0D0D",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#161616",
  },
  cardTitle: { color: "#fff", fontWeight: "700", fontSize: 16 },
  sectionTitle: { color: "#fff", fontWeight: "700", marginBottom: 6 },
  item: { color: "#ccc", marginTop: 6 },
  muted: { color: GRAY, marginTop: 6 },

  // Collapsible header
  collapseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0D0D0D",
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
  },
  toggleArrow: { color: "#fff", fontSize: 16 },

  // Calendar
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  monthBtn: { color: "#fff", fontSize: 22, paddingHorizontal: 8 },
  weekRow: { flexDirection: "row", gap: 6, marginBottom: 6 },
  weekDay: { flex: 1, textAlign: "center", color: "#999" },
  dayCell: {
    flex: 1,
    height: 54,
    backgroundColor: "#0D0D0D",
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 2,
  },
  dayNum: { color: "#fff", fontWeight: "700", marginBottom: 4 },
  dotRow: { flexDirection: "row", gap: 4 },

  dotSmall: { width: 6, height: 6, borderRadius: 999 },

  // Tabs & Pills
  tabRow: { flexDirection: "row", gap: 8, marginTop: 8, marginBottom: 8 },
  pill: {
    backgroundColor: "#151515",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#222",
  },
  pillActive: { backgroundColor: "#1E1E1E", borderColor: ORANGE },
  pillText: { color: "#aaa", fontWeight: "600" },
  pillTextActive: { color: "#fff" },

  // Trend selectors
  trendSelectors: { gap: 8, marginBottom: 10 },
  trendPill: {
    backgroundColor: "#151515",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#222",
    marginRight: 8,
  },
  trendPillActive: { backgroundColor: "#1E1E1E", borderColor: ORANGE },
  trendPillText: { color: "#aaa", fontWeight: "600" },
  trendPillTextActive: { color: "#fff" },

  // Buttons
  primaryBtn: {
    backgroundColor: ORANGE,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  primaryBtnText: { color: "#000", fontWeight: "700" },
  outlineBtn: {
    borderColor: "#333",
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  outlineBtnText: { color: "#fff" },

  // Planned list
  planRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 10,
    borderBottomColor: "#181818",
    borderBottomWidth: 1,
  },
  planTitle: { color: "#fff", fontWeight: "700" },
  planNotes: { color: "#bbb", marginTop: 2 },
  planMeta: { color: "#aaa", marginTop: 2, fontSize: 12 },

  smallBtn: {
    borderWidth: 1,
    borderColor: "#444",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  smallBtnText: { color: "#fff", fontSize: 12 },

  // Modal
  modalWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#0E0E0E",
    borderRadius: 14,
    padding: 14,
    borderColor: "#1A1A1A",
    borderWidth: 1,
    width: "100%",
  },
  modalTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 10 },
  label: { color: "#bbb", marginTop: 8, marginBottom: 6 },
  input: {
    backgroundColor: "#141414",
    color: "#fff",
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
});
