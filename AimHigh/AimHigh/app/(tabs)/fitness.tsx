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

type SetItem = { id: string; reps: number; weight: number };
type Exercise = { id: string; name: string; sets: SetItem[] };
type Workout = { id: string; dateISO: string; exercises: Exercise[] };

export default function Fitness() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  const addWorkout = (): void => {
    const w: Workout = {
      id: String(Date.now()),
      dateISO: new Date().toISOString(),
      exercises: [],
    };
    setWorkouts((prev) => [w, ...prev]);
  };

  const addExercise = (workoutId: string, name: string): void => {
    setWorkouts((prev) =>
      prev.map((w) =>
        w.id === workoutId
          ? {
              ...w,
              exercises: [
                ...w.exercises,
                { id: `${workoutId}-${Date.now()}`, name, sets: [] },
              ],
            }
          : w
      )
    );
  };

  const addSet = (
    workoutId: string,
    exerciseId: string,
    reps: number,
    weight: number
  ): void => {
    setWorkouts((prev) =>
      prev.map((w) =>
        w.id === workoutId
          ? {
              ...w,
              exercises: w.exercises.map((ex) =>
                ex.id === exerciseId
                  ? {
                      ...ex,
                      sets: [
                        ...ex.sets,
                        { id: `${exerciseId}-${Date.now()}`, reps, weight },
                      ],
                    }
                  : ex
              ),
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
            <WorkoutCard
              workout={item}
              onAddExercise={addExercise}
              onAddSet={addSet}
            />
          )}
        />
      )}
    </View>
  );
}

function WorkoutCard({
  workout,
  onAddExercise,
  onAddSet,
}: {
  workout: Workout;
  onAddExercise: (workoutId: string, name: string) => void;
  onAddSet: (
    workoutId: string,
    exerciseId: string,
    reps: number,
    weight: number
  ) => void;
}) {
  const [showExerciseForm, setShowExerciseForm] = useState<boolean>(false);
  const [exerciseName, setExerciseName] = useState<string>("Push Ups");

  const dt = new Date(workout.dateISO);
  const dateLabel = `${dt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}  ${dt.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })}`;

  const handleAddExercise = (): void => {
    const name = exerciseName.trim() || "Exercise";
    onAddExercise(workout.id, name);
    setExerciseName("Push Ups");
    setShowExerciseForm(false);
  };

  return (
    <View style={styles.card}>
      {/* Title and date stacked left; button below so it never overflows */}
      <Text style={styles.cardTitle}>Workout</Text>
      <Text style={styles.cardSubtitle}>{dateLabel}</Text>

      <TouchableOpacity
        style={[styles.outlineBtn, { alignSelf: "flex-start", marginTop: 6 }]}
        onPress={() => setShowExerciseForm((s) => !s)}
      >
        <Text style={styles.outlineBtnText}>
          {showExerciseForm ? "Cancel" : "Add Exercise"}
        </Text>
      </TouchableOpacity>

      {showExerciseForm && (
        <View style={styles.form}>
          <Text style={styles.formLabel}>Exercise Name</Text>
          <TextInput
            value={exerciseName}
            onChangeText={setExerciseName}
            placeholder="e.g., Push Ups"
            placeholderTextColor="#777"
            style={styles.input}
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleAddExercise}>
            <Text style={styles.primaryBtnText}>Save Exercise</Text>
          </TouchableOpacity>
        </View>
      )}

      {workout.exercises.length === 0 ? (
        <Text style={[styles.muted, { marginTop: 8 }]}>No exercises yet.</Text>
      ) : (
        workout.exercises.map((ex) => (
          <ExerciseBlock
            key={ex.id}
            workoutId={workout.id}
            exercise={ex}
            onAddSet={onAddSet}
          />
        ))
      )}
    </View>
  );
}

function ExerciseBlock({
  workoutId,
  exercise,
  onAddSet,
}: {
  workoutId: string;
  exercise: Exercise;
  onAddSet: (
    workoutId: string,
    exerciseId: string,
    reps: number,
    weight: number
  ) => void;
}) {
  const [showSetForm, setShowSetForm] = useState<boolean>(false);
  const [reps, setReps] = useState<string>("12");
  const [weight, setWeight] = useState<string>("45");

  const handleSaveSet = (): void => {
    const r = parseInt(reps, 10);
    const w = parseFloat(weight);
    onAddSet(workoutId, exercise.id, isNaN(r) ? 0 : r, isNaN(w) ? 0 : w);
    setShowSetForm(false);
    setReps("12");
    setWeight("45");
  };

  return (
    <View style={styles.exerciseBlock}>
      <View style={styles.exerciseHeaderRow}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <TouchableOpacity
          style={styles.smallOutlineBtn}
          onPress={() => setShowSetForm((s) => !s)}
        >
          <Text style={styles.outlineBtnText}>
            {showSetForm ? "Cancel" : "Add Set"}
          </Text>
        </TouchableOpacity>
      </View>

      {exercise.sets.length === 0 ? (
        <Text style={styles.muted}>No sets yet.</Text>
      ) : (
        exercise.sets.map((s, idx) => (
          <View key={s.id} style={styles.setRow}>
            <Text style={styles.setText}>Set {idx + 1}</Text>
            <Text style={styles.setText}>
              Reps: <Text style={styles.white}>{s.reps}</Text> • Wt:{" "}
              <Text style={styles.white}>{s.weight}</Text> lb
            </Text>
          </View>
        ))
      )}

      {showSetForm && (
        <View style={styles.formInline}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.formLabel}>Reps</Text>
            <TextInput
              value={reps}
              onChangeText={setReps}
              keyboardType="number-pad"
              placeholder="e.g., 12"
              placeholderTextColor="#777"
              style={styles.input}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.formLabel}>Weight (lb)</Text>
            <TextInput
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholder="e.g., 45"
              placeholderTextColor="#777"
              style={styles.input}
            />
          </View>
          <TouchableOpacity
            style={[styles.primaryBtn, { marginTop: 18 }]}
            onPress={handleSaveSet}
          >
            <Text style={styles.primaryBtnText}>Save Set</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  header: { color: "#fff", fontSize: 28, fontWeight: "800", marginBottom: 12 },
  muted: { color: "#9a9a9a" },
  orange: { color: ORANGE },

  card: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1f1f1f",
    marginTop: 16,
  },
  cardTitle: { color: ORANGE, fontWeight: "800", fontSize: 18 },
  cardSubtitle: { color: "#bbb", marginTop: 2, marginBottom: 8 },

  exerciseBlock: {
    backgroundColor: "#0b0b0b",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f1f1f",
    marginTop: 12,
  },
  exerciseHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  exerciseName: { color: "#fff", fontWeight: "700", fontSize: 16 },

  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1f1f1f",
  },
  setText: { color: "#ddd" },
  white: { color: "#fff", fontWeight: "700" },

  form: { marginTop: 12 },
  formInline: { marginTop: 8 },
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
    marginTop: 6,
  },
  primaryBtnText: { color: "#000", fontWeight: "800", fontSize: 16 },

  outlineBtn: {
    borderWidth: 1,
    borderColor: ORANGE,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  smallOutlineBtn: {
    borderWidth: 1,
    borderColor: ORANGE,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  outlineBtnText: { color: ORANGE, fontWeight: "700" },
});
