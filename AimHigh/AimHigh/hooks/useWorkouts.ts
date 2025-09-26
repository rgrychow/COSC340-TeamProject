// hooks/useWorkouts.ts
import { useState } from "react";

export type SetItem = { id: string; reps: number; weight: number };
export type Exercise = { id: string; name: string; sets: SetItem[] };
export type Workout = { id: string; dateISO: string; exercises: Exercise[] };

export function useWorkouts() {
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

  return { workouts, addWorkout, addExercise, addSet };
}

