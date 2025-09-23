// app/(tabs)/progress.tsx
import { View, Text, StyleSheet } from "react-native";

const ORANGE = "#FF6A00";

export default function Progress() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Progress</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>This Week</Text>
        <Text style={styles.item}>• Workouts: 3 / 4</Text>
        <Text style={styles.item}>• Average Sleep: 7h 20m</Text>
        <Text style={styles.item}>• Average Calories: 2,180</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal Bests</Text>
        <Text style={styles.item}>• 5K Run: 26:10</Text>
        <Text style={styles.item}>• Bench: 185 × 5</Text>
        <Text style={styles.item}>• Deadlift: 275 × 3</Text>
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f1f1f",
    marginBottom: 16,
  },
  cardTitle: { color: ORANGE, fontWeight: "800", marginBottom: 8 },
  item: { color: "#eee", marginTop: 2 },
});
