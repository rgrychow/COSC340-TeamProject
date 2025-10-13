// hooks/useWorkouts.tsx
import React, { createContext, useContext, useState } from "react";

export type SetItem = { id: string; reps: number; weight: number; ts: number };
export type Exercise = { id: string; name: string; sets: SetItem[] };
export type Workout = { id: string; dateISO: string; exercises: Exercise[] };

type Ctx = {
  workouts: Workout[];
  addWorkout: () => void;
  deleteWorkout: (workoutId: string) => void;
  addExercise: (workoutId: string, name: string) => void;
  deleteExercise: (workoutId: string, exerciseId: string) => void;
  addSet: (workoutId: string, exerciseId: string, reps: number, weight: number) => void;
  deleteSet: (workoutId: string, exerciseId: string, setId: string) => void;
};

const WorkoutsContext = createContext<Ctx | null>(null);

export function WorkoutsProvider({ children }: { children: React.ReactNode }) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  const addWorkout = () => {
    setWorkouts((prev) => [
      { id: String(Date.now()), dateISO: new Date().toISOString(), exercises: [] },
      ...prev,
    ]);
  };

  const deleteWorkout = (workoutId: string) => {
    setWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
  };

  const addExercise = (workoutId: string, name: string) => {
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

  const deleteExercise = (workoutId: string, exerciseId: string) => {
    setWorkouts((prev) =>
      prev.map((w) =>
        w.id === workoutId
          ? { ...w, exercises: w.exercises.filter((ex) => ex.id !== exerciseId) }
          : w
      )
    );
  };

  const addSet = (workoutId: string, exerciseId: string, reps: number, weight: number) => {
    const ts = Date.now();
    setWorkouts((prev) =>
      prev.map((w) =>
        w.id === workoutId
          ? {
              ...w,
              exercises: w.exercises.map((ex) =>
                ex.id === exerciseId
                  ? {
                      ...ex,
                      sets: [...ex.sets, { id: `${exerciseId}-${ts}`, reps, weight, ts }],
                    }
                  : ex
              ),
            }
          : w
      )
    );
  };

  const deleteSet = (workoutId: string, exerciseId: string, setId: string) => {
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
    <WorkoutsContext.Provider
      value={{ workouts, addWorkout, deleteWorkout, addExercise, deleteExercise, addSet, deleteSet }}
    >
      {children}
    </WorkoutsContext.Provider>
  );
}

export function useWorkouts() {
  const ctx = useContext(WorkoutsContext);
  if (!ctx) throw new Error("useWorkouts must be used within WorkoutsProvider");
  return ctx;
}

}

