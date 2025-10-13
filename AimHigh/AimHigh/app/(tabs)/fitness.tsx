// app/(tabs)/fitness.tsx
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

  const deleteWorkout = (workoutId: string): void => {
    setWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
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

  const deleteExercise = (workoutId: string, exerciseId: string): void => {
    setWorkouts((prev) =>
      prev.map((w) =>
        w.id === workoutId
          ? { ...w, exercises: w.exercises.filter((ex) => ex.id !== exerciseId) }
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

  const deleteSet = (
    workoutId: string,
    exerciseId: string,
    setId: string
  ): void => {
    setWorkouts((prev) =>
      prev.map((w) =>
        w.id === workoutId
          ? {
              ...w,
              exercises: w.exercises.map((ex) =>
                ex.id === exerciseId
                  ? { ...ex, sets: ex.sets.filter((s) => s.id !== setId) }
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
              onDeleteWorkout={deleteWorkout}
              onDeleteExercise={deleteExercise}
              onDeleteSet={deleteSet}
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
  onDeleteWorkout,
  onDeleteExercise,
  onDeleteSet,
}: {
  workout: Workout;
  onAddExercise: (workoutId: string, name: string) => void;
  onAddSet: (
    workoutId: string,
    exerciseId: string,
    reps: number,
    weight: number
  ) => void;
  onDeleteWorkout: (workoutId: string) => void;
  onDeleteExercise: (workoutId: string, exerciseId: string) => void;
  onDeleteSet: (workoutId: string, exerciseId: string, setId: string) => void;
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
      {/* DELETE WORKOUT (top-right corner) */}
      <TouchableOpacity
        accessibilityLabel="Delete workout"
        style={styles.deletePillTopRight}
        onPress={() => onDeleteWorkout(workout.id)}
      >
        <Text style={styles.deletePillText}>Delete</Text>
      </TouchableOpacity>

      {/* Title + date */}
      <Text style={styles.cardTitle}>Workout</Text>
      <Text style={styles.cardSubtitle}>{dateLabel}</Text>

      {/* Add Exercise button */}
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
            onDeleteExercise={onDeleteExercise}
            onDeleteSet={onDeleteSet}
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
  onDeleteExercise,
  onDeleteSet,
}: {
  workoutId: string;
  exercise: Exercise;
  onAddSet: (
    workoutId: string,
    exerciseId: string,
    reps: number,
    weight: number
  ) => void;
  onDeleteExercise: (workoutId: string, exerciseId: string) => void;
  onDeleteSet: (workoutId: string, exerciseId: string, setId: string) => void;
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
      {/* Header row: name left, actions right */}
      <View style={styles.exerciseHeaderRow}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.smallOutlineBtn}
            onPress={() => setShowSetForm((s) => !s)}
          >
            <Text style={styles.outlineBtnText}>
              {showSetForm ? "Cancel" : "Add Set"}
            </Text>
          </TouchableOpacity>

          {/* DELETE EXERCISE (top-right of exercise block) */}
          <TouchableOpacity
            accessibilityLabel="Delete exercise"
            style={styles.smallDeleteBtn}
            onPress={() => onDeleteExercise(workoutId, exercise.id)}
          >
            <Text style={styles.deletePillText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      {exercise.sets.length === 0 ? (
        <Text style={styles.muted}>No sets yet.</Text>
      ) : (
        exercise.sets.map((s, idx) => (
          <View key={s.id} style={styles.setRow}>
            <Text style={styles.setText}>Set {idx + 1}</Text>

            <View style={styles.setRightRow}>
              <Text style={styles.setText}>
                Reps: <Text style={styles.white}>{s.reps}</Text> • Wt:{" "}
                <Text style={styles.white}>{s.weight}</Text> lb
              </Text>

              {/* DELETE SET (right side of the row) */}
              <TouchableOpacity
                accessibilityLabel="Delete set"
                style={styles.smallDeleteBtn}
                onPress={() => onDeleteSet(workoutId, exercise.id, s.id)}
              >
                <Text style={styles.deletePillText}>Delete</Text>
              </TouchableOpacity>
            </View>
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
    position: "relative",
  },
  // Workout delete pill (top-right)
  deletePillTopRight: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: ORANGE,
    borderRadius: 10,
  },
  deletePillText: { color: ORANGE, fontWeight: "700" },

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
  actionsRow: { flexDirection: "row", alignItems: "center" },

  exerciseName: { color: "#fff", fontWeight: "700", fontSize: 16 },

  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1f1f1f",
  },
  setRightRow: { flexDirection: "row", alignItems: "center" },
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
  smallDeleteBtn: {
    borderWidth: 1,
    borderColor: ORANGE,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginLeft: 8,
  },
  outlineBtnText: { color: ORANGE, fontWeight: "700" },
});
