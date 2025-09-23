// app/(tabs)/fitness.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
} from "react-native";

const ORANGE = "#FF6A00";

type Exercise = { id: string; name: string; reps: number };
type Workout = { id: string; dateISO: string; exercises: Exercise[] };

export default function Fitness() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  const addWorkout = () => {
    const w: Workout = {
      id: String(Date.now()),
      dateISO: new Date().toISOString(),
      exercises: [],
    };
    setWorkouts((prev) => [w, ...prev]);
  };

  const addExercise = (workoutId: string, name: string, reps: number) => {
    setWorkouts((prev) =>
      prev.map((w) =>
        w.id === workoutId
          ? {
              ...w,
              exercises: [
                ...w.exercises,
                { id: `${workoutId}-${Date.now()}`, name, reps },
              ],
            }
          : w
      )
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Fitness</Text>

      <TouchableOpacity style={styles.primaryBtn} onPress={addWorkout}>
        <Text style={styles.primaryBtnText}>+ New Workout</Text>
      </TouchableOpacity>

      {workouts.length === 0 ? (
        <Text style={styles.muted}>
          No workouts yet. Tap <Text style={styles.orange}>+ New Workout</Text>{" "}
          to start.
        </Text>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(w) => w.id}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item }) => (
            <WorkoutCard workout={item} onAddExercise={addExercise} />
          )}
        />
      )}
    </View>
  );
}

function WorkoutCard({
  workout,
  onAddExercise,
}: {
  workout: Workout;
  onAddExercise: (workoutId: string, name: string, reps: number) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("Push Ups"); // dummy default
  const [reps, setReps] = useState("12");

  const dateLabel = new Date(workout.dateISO).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const handleSave = () => {
    const cleanName = name.trim() || "Exercise";
    const count = parseInt(reps, 10);
    onAddExercise(workout.id, cleanName, isNaN(count) ? 0 : count);
    setShowForm(false);
    setName("Push Ups");
    setReps("12");
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>Workout • {dateLabel}</Text>
        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={() => setShowForm((s) => !s)}
        >
          <Text style={styles.outlineBtnText}>
            {showForm ? "Cancel" : "Add Exercise"}
          </Text>
        </TouchableOpacity>
      </View>

      {workout.exercises.length === 0 ? (
        <Text style={styles.muted}>No exercises yet.</Text>
      ) : (
        workout.exercises.map((ex) => (
          <View key={ex.id} style={styles.exerciseRow}>
            <Text style={styles.exerciseName}>{ex.name}</Text>
            <Text style={styles.exerciseReps}>{ex.reps} reps</Text>
          </View>
        ))
      )}

      {showForm && (
        <View style={styles.form}>
          <Text style={styles.formLabel}>Exercise Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g., Push Ups"
            placeholderTextColor="#777"
            style={styles.input}
          />

          <Text style={[styles.formLabel, { marginTop: 12 }]}>Reps</Text>
          <TextInput
            value={reps}
            onChangeText={setReps}
            keyboardType="number-pad"
            placeholder="e.g., 12"
            placeholderTextColor="#777"
            style={styles.input}
          />

          <TouchableOpacity style={styles.primaryBtn} onPress={handleSave}>
            <Text style={styles.primaryBtnText}>Save Exercise</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  header: { color: "#fff", fontSize: 28, fontWeight: "800", marginBottom: 12 },
  muted: { color: "#9a9a9a", marginTop: 8 },
  orange: { color: ORANGE },

  card: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1f1f1f",
    marginTop: 16,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardTitle: { color: ORANGE, fontWeight: "800", fontSize: 16 },

  exerciseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1f1f1f",
  },
  exerciseName: { color: "#fff", fontWeight: "600" },
  exerciseReps: { color: "#ddd" },

  form: { marginTop: 14 },
  formLabel: { color: "#fff", fontWeight: "700", marginBottom: 6 },
  input: {
    backgroundColor: "#0b0b0b",
    borderWidth: 1,
    borderColor: ORANGE,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
  },

  primaryBtn: {
    backgroundColor: ORANGE,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignSelf: "flex-start",
  },
  primaryBtnText: { color: "#000", fontWeight: "800", fontSize: 16 },

  outlineBtn: {
    borderWidth: 1,
    borderColor: ORANGE,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  outlineBtnText: { color: ORANGE, fontWeight: "700" },
});
