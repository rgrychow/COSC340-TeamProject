// app/(tabs)/fitness.tsx
import { View, Text, StyleSheet } from "react-native";

const ORANGE = "#FF6A00";

export default function Fitness() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Fitness</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sample Workout</Text>
        <Text style={styles.item}>• Warmup: 5 min jump rope</Text>
        <Text style={styles.item}>• Bench Press: 4 × 8</Text>
        <Text style={styles.item}>• Rows: 4 × 10</Text>
        <Text style={styles.item}>• Shoulder Press: 3 × 10</Text>
        <Text style={styles.item}>• Plank: 3 × 45s</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notes</Text>
        <Text style={styles.item}>Rest 60–90s between sets.</Text>
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
