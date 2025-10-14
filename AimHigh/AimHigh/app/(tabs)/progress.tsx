// app/(tabs)/progress.tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Line as SvgLine, Circle, Text as SvgText } from "react-native-svg";
import { useWorkouts } from "../../hooks/useWorkouts";

const ORANGE = "#FF6A00";
const { width } = Dimensions.get("window");

export default function Progress() {
  const { workouts } = useWorkouts();

  // Each set becomes a point: x = reps, y = weight
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
          <Text style={styles.muted}>
            Add sets on the Fitness tab to see your chart.
          </Text>
        ) : (
          <ScatterChart points={points} />
        )}
      </View>
    </View>
  );
}

function ScatterChart({ points }: { points: { x: number; y: number }[] }) {
  const chartWidth = width - 40;   // match container padding (20 + 20)
  const chartHeight = 260;
  const pad = 36;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);

  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);

  // Add a small padding to domains so points aren't glued to edges
  const xSpan = Math.max(1, xMax - xMin);
  const ySpan = Math.max(1, yMax - yMin);
  const x0 = xMin - xSpan * 0.05;
  const x1 = xMax + xSpan * 0.05;
  const y0 = yMin - ySpan * 0.05;
  const y1 = yMax + ySpan * 0.05;

  const innerW = chartWidth - pad * 2;
  const innerH = chartHeight - pad * 2;

  const xScale = (x: number) => pad + ((x - x0) / (x1 - x0)) * innerW;
  const yScale = (y: number) => chartHeight - pad - ((y - y0) / (y1 - y0)) * innerH;

  // 4 tick marks each axis
  const ticks = 4;
  const xTicks = Array.from({ length: ticks + 1 }, (_, i) => x0 + (i * (x1 - x0)) / ticks);
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => y0 + (i * (y1 - y0)) / ticks);

  return (
    <Svg width={chartWidth} height={chartHeight}>
      {/* Axes */}
      <SvgLine x1={pad} y1={chartHeight - pad} x2={chartWidth - pad} y2={chartHeight - pad} stroke="#444" strokeWidth={2} />
      <SvgLine x1={pad} y1={pad} x2={pad} y2={chartHeight - pad} stroke="#444" strokeWidth={2} />

      {/* Grid + tick labels */}
      {xTicks.map((tx, i) => {
        const x = xScale(tx);
        return (
          <React.Fragment key={`x-${i}`}>
            <SvgLine x1={x} y1={pad} x2={x} y2={chartHeight - pad} stroke="#222" strokeWidth={1} />
            <SvgText x={x} y={chartHeight - pad + 18} fill="#ddd" fontSize="10" textAnchor="middle">
              {Math.round(tx)}
            </SvgText>
          </React.Fragment>
        );
      })}
      {yTicks.map((ty, i) => {
        const y = yScale(ty);
        return (
          <React.Fragment key={`y-${i}`}>
            <SvgLine x1={pad} y1={y} x2={chartWidth - pad} y2={y} stroke="#222" strokeWidth={1} />
            <SvgText x={pad - 8} y={y + 3} fill="#ddd" fontSize="10" textAnchor="end">
              {Math.round(ty)}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Axis labels */}
      <SvgText x={(chartWidth) / 2} y={chartHeight - 6} fill="#fff" fontSize="12" textAnchor="middle">
        Reps
      </SvgText>
      <SvgText
        x={12}
        y={chartHeight / 2}
        fill="#fff"
        fontSize="12"
        textAnchor="middle"
        transform={`rotate(-90, 12, ${chartHeight / 2})`}
      >
        Weight (lb)
      </SvgText>

      {/* Points */}
      {points.map((p, idx) => (
        <Circle key={idx} cx={xScale(p.x)} cy={yScale(p.y)} r={4} fill={ORANGE} />
      ))}
    </Svg>
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
