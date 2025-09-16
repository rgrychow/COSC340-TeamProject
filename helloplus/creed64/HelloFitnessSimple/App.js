// App.js
import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, StatusBar } from "react-native";

export default function App() {
  const [count, setCount] = useState(0);

  // Rotate motivational phrases as the count changes
  const phrase = useMemo(() => {
    const phrases = [
      "One more rep than yesterday.",
      "Strong body, stronger mind.",
      "Consistency beats intensity.",
      "You're doing great — keep going!",
      "Progress > perfection."
    ];
    return phrases[count % phrases.length];
  }, [count]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.title}>Push-Up Counter</Text>

      <Text style={styles.count}>{count}</Text>
      <Text style={styles.phrase}>{phrase}</Text>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() => setCount((c) => c + 1)}
        accessibilityRole="button"
        accessibilityLabel="Add one push-up"
      >
        <Text style={styles.buttonText}>+ Add Push-Up</Text>
      </Pressable>

      <Pressable
        style={styles.reset}
        onPress={() => setCount(0)}
        onLongPress={() => setCount((c) => Math.max(0, c - 1))}
        delayLongPress={300}
        accessibilityRole="button"
        accessibilityLabel="Reset counter. Long press to undo one."
      >
        <Text style={styles.resetText}>Reset (long-press to undo one)</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF"
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 16
  },
  count: {
    fontSize: 72,
    fontWeight: "800",
    marginVertical: 8
  },
  phrase: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 28
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 12,
    backgroundColor: "#0A84FF", // iOS blue
    elevation: 2, // Android shadow
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    minWidth: 220,
    alignItems: "center"
  },
  buttonPressed: {
    opacity: 0.9
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700"
  },
  reset: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 14
  },
  resetText: {
    color: "#666",
    fontSize: 14
  }
});
