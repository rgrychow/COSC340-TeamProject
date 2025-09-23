// app/(tabs)/home.tsx
import { View, Text, StyleSheet } from "react-native";
const ORANGE = "#FF6A00";

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Home</Text>
      <Text style={styles.text}>
        Welcome to <Text style={styles.bold}>AimHigh</Text> — your hub for quick
        stats, today’s plan, and shortcuts to Fitness, Nutrition, and Progress.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today</Text>
        <Text style={styles.cardText}>• 5,432 steps</Text>
        <Text style={styles.cardText}>• Workout: Upper Body (6:00 PM)</Text>
        <Text style={styles.cardText}>• Calories target: 2,200</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  header: { color: "#fff", fontSize: 28, fontWeight: "800", marginBottom: 12 },
  text: { color: "#ccc", lineHeight: 20, marginBottom: 16 },
  bold: { color: "#fff", fontWeight: "700" },
  card: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f1f1f",
  },
  cardTitle: { color: ORANGE, fontWeight: "800", marginBottom: 8 },
  cardText: { color: "#eee", marginTop: 2 },
});
