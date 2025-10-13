// app/(tabs)/progress.tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { VictoryChart, VictoryScatter, VictoryAxis } from "victory-native";
import { useWorkouts } from "../../hooks/useWorkouts";

const ORANGE = "#FF6A00";
const { width } = Dimensions.get("window");

export default function Progress() {
  const { workouts } = useWorkouts();

  // Build points: each set becomes a dot (x=reps, y=weight)
  const points = useMemo(
    () =>
      workouts.flatMap((w) =>
        w.exercises.flatMap((ex) =>
          ex.sets.map((s) => ({ x: s.reps, y: s.weight }))
        )
      ),
    [workouts]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Progress</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reps vs Weight</Text>
        {points.length === 0 ? (
          <Text style={styles.muted}>Add sets on the Fitness tab to see your chart.</Text>
        ) : (
          <View style={{ width: "100%" }}>
            <VictoryChart domainPadding={10} height={280} width={width - 40}>
              <VictoryAxis
                label="Reps"
                style={{
                  axis: { stroke: "#444" },
                  tickLabels: { fill: "#ddd", fontSize: 12 },
                  axisLabel: { fill: "#fff", padding: 30, fontSize: 14 },
                  grid: { stroke: "#222" },
                }}
              />
              <VictoryAxis
                dependentAxis
                label="Weight (lb)"
                style={{
                  axis: { stroke: "#444" },
                  tickLabels: { fill: "#ddd", fontSize: 12 },
                  axisLabel: { fill: "#fff", padding: 40, fontSize: 14 },
                  grid: { stroke: "#222" },
                }}
              />
              <VictoryScatter
                data={points}
                size={5}
                style={{ data: { fill: ORANGE } }}
              />
            </VictoryChart>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  header: { color: "#fff", fontSize: 28, fontWeight: "800", marginBottom: 12 },

  card: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1f1f1f",
    marginTop: 16,
  },
  cardTitle: { color: ORANGE, fontWeight: "800", fontSize: 18, marginBottom: 8 },
  muted: { color: "#9a9a9a" },
});
