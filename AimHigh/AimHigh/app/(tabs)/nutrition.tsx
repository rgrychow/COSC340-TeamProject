// app/(tabs)/nutrition.tsx
import { View, Text, StyleSheet } from "react-native";

const ORANGE = "#FF6A00";

export default function Nutrition() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Nutrition</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily Targets (Dummy)</Text>
        <Text style={styles.item}>• Calories: 2,200 kcal</Text>
        <Text style={styles.item}>• Protein: 160 g</Text>
        <Text style={styles.item}>• Carbs: 220 g</Text>
        <Text style={styles.item}>• Fats: 70 g</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Meals</Text>
        <Text style={styles.item}>• Breakfast: Oats + Eggs</Text>
        <Text style={styles.item}>• Lunch: Chicken Bowl</Text>
        <Text style={styles.item}>• Dinner: Salmon + Rice</Text>
        <Text style={styles.item}>• Snack: Greek Yogurt</Text>
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
