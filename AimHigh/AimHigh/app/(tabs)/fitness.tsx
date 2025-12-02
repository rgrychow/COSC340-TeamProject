// app/(tabs)/fitness.tsx
import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useWorkouts } from "../../hooks/useWorkouts";

const ORANGE = "#FF6A00";

export default function Fitness() {
  const {
    workouts,
    addWorkout,
    deleteWorkout,
    addExercise,
    deleteExercise,
    addSet,
    deleteSet,
  } = useWorkouts();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Fitness</Text>

      <TouchableOpacity style={styles.primaryBtn} onPress={addWorkout}>
        <Text style={styles.primaryBtnText}>+ New Workout</Text>
      </TouchableOpacity>

      {workouts.length === 0 ? (
        <Text style={styles.muted}>
          No workouts yet. Tap <Text style={styles.orange}>+ New Workout</Text> to
          start.
        </Text>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(w) => w.id}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item }) => (
            <WorkoutCard
              workoutId={item.id}
              dateISO={item.dateISO}
              exercises={item.exercises}
              onAddExercise={addExercise}
              onDeleteWorkout={deleteWorkout}
              onDeleteExercise={deleteExercise}
              onAddSet={addSet}
              onDeleteSet={deleteSet}
            />
          )}
        />
      )}
    </View>
  );
}

type SetType = { id: string; reps: number; weight: number };
type ExerciseType = { id: string; name: string; sets: SetType[] };

type WorkoutCardProps = {
  workoutId: string;
  dateISO: string;
  exercises: ExerciseType[];
  onAddExercise: (workoutId: string, name: string) => void;
  onDeleteWorkout: (workoutId: string) => void;
  onDeleteExercise: (workoutId: string, exerciseId: string) => void;
  onAddSet: (
    workoutId: string,
    exerciseId: string,
    reps: number,
    weight: number
  ) => void;
  onDeleteSet: (
    workoutId: string,
    exerciseId: string,
    setId: string
  ) => void;
};

function WorkoutCard({
  workoutId,
  dateISO,
  exercises,
  onAddExercise,
  onDeleteWorkout,
  onDeleteExercise,
  onAddSet,
  onDeleteSet,
}: WorkoutCardProps) {
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [exerciseName, setExerciseName] = useState("Push Ups");

  const dt = new Date(dateISO);
  const dateLabel = `${dt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}  ${dt.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })}`;

  const handleAddExercise = () => {
    const trimmed = (exerciseName || "").trim() || "Exercise";

    // avoid duplicate names on the same card
    const exists = exercises.some(
      (ex) => ex.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      alert("That exercise is already in this workout.");
      setShowExerciseForm(false);
      return;
    }

    onAddExercise(workoutId, trimmed);
    setExerciseName("Push Ups");
    setShowExerciseForm(false);
  };

  return (
    <View style={styles.card}>
      {/* delete whole workout card */}
      <TouchableOpacity
        style={styles.deletePillTopRight}
        onPress={() => onDeleteWorkout(workoutId)}
        hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
        accessibilityRole="button"
        accessibilityLabel="Delete workout"
        testID={`delete-workout-${workoutId}`}
      >
        <Text style={styles.deletePillText}>Delete</Text>
      </TouchableOpacity>

      <Text style={styles.cardTitle}>Workout</Text>
      <Text style={styles.cardSubtitle}>{dateLabel}</Text>

      <TouchableOpacity
        style={[styles.outlineBtn, { alignSelf: "flex-start", marginTop: 6 }]}
        onPress={() => setShowExerciseForm((s) => !s)}
        accessibilityRole="button"
        accessibilityLabel={
          showExerciseForm ? "Cancel add exercise" : "Add exercise"
        }
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
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleAddExercise}
            accessibilityRole="button"
            accessibilityLabel="Save exercise"
          >
            <Text style={styles.primaryBtnText}>Save Exercise</Text>
          </TouchableOpacity>
        </View>
      )}

      {exercises.length === 0 ? (
        <Text style={[styles.muted, { marginTop: 8 }]}>No exercises yet.</Text>
      ) : (
        exercises.map((ex) => (
          <ExerciseBlock
            key={ex.id}
            workoutId={workoutId}
            exerciseId={ex.id}
            name={ex.name}
            sets={ex.sets}
            onAddSet={onAddSet}
            onDeleteExercise={onDeleteExercise}
            onDeleteSet={onDeleteSet}
          />
        ))
      )}
    </View>
  );
}

type ExerciseBlockProps = {
  workoutId: string;
  exerciseId: string;
  name: string;
  sets: SetType[];
  onAddSet: (
    workoutId: string,
    exerciseId: string,
    reps: number,
    weight: number
  ) => void;
  onDeleteExercise: (workoutId: string, exerciseId: string) => void;
  onDeleteSet: (
    workoutId: string,
    exerciseId: string,
    setId: string
  ) => void;
};

function ExerciseBlock({
  workoutId,
  exerciseId,
  name,
  sets,
  onAddSet,
  onDeleteExercise,
  onDeleteSet,
}: ExerciseBlockProps) {
  const [showSetForm, setShowSetForm] = useState(false);
  const [reps, setReps] = useState("12");
  const [weight, setWeight] = useState("45");

  return (
    <View style={styles.exerciseBlock}>
      <View style={styles.exerciseHeaderRow}>
        <Text style={styles.exerciseName}>{name}</Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.smallOutlineBtn}
            onPress={() => setShowSetForm((s) => !s)}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            accessibilityRole="button"
            accessibilityLabel={showSetForm ? "Cancel add set" : "Add set"}
          >
            <Text style={styles.outlineBtnText}>
              {showSetForm ? "Cancel" : "Add Set"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.smallDeleteBtn}
            onPress={() => onDeleteExercise(workoutId, exerciseId)}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            accessibilityRole="button"
            accessibilityLabel={`Delete exercise ${name}`}
            testID={`delete-exercise-${exerciseId}`}
          >
            <Text style={styles.deletePillText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      {sets.length === 0 ? (
        <Text style={styles.muted}>No sets yet.</Text>
      ) : (
        sets.map((s, idx) => (
          <View key={s.id} style={styles.setRow}>
            <Text style={styles.setText}>Set {idx + 1}</Text>
            <View style={styles.setRightRow}>
              <Text style={styles.setText}>
                Reps: <Text style={styles.white}>{s.reps}</Text> • Wt:{" "}
                <Text style={styles.white}>{s.weight}</Text> lb
              </Text>
              <TouchableOpacity
                style={styles.smallDeleteBtn}
                onPress={() => onDeleteSet(workoutId, exerciseId, s.id)}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                accessibilityRole="button"
                accessibilityLabel={`Delete set ${idx + 1}`}
                testID={`delete-set-${s.id}`}
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
            onPress={() => {
              const r = parseInt(reps, 10);
              const w = parseFloat(weight);
              onAddSet(
                workoutId,
                exerciseId,
                Number.isNaN(r) ? 0 : r,
                Number.isNaN(w) ? 0 : w
              );
              setShowSetForm(false);
              setReps("12");
              setWeight("45");
            }}
            accessibilityRole="button"
            accessibilityLabel="Save set"
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
  deletePillTopRight: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: ORANGE,
    borderRadius: 10,
    zIndex: 1000,
    elevation: 8,
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
