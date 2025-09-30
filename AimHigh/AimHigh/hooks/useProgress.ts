// hooks/useProgress.ts
import { Workout } from "./useWorkouts";
import { Meal } from "./useNutrition";

export function useProgress(workouts: Workout[], meals: Meal[]) {
  const totalWorkouts = workouts.length;

  const weeklyWorkouts = workouts.filter((w) => {
    const dt = new Date(w.dateISO);
    const now = new Date();
    const diffDays = (now.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  });

  const avgCalories =
    meals.length > 0
      ? Math.round(meals.reduce((sum, m) => sum + m.calories, 0) / meals.length)
      : 0;

  return {
    totalWorkouts,
    weeklyWorkouts: weeklyWorkouts.length,
    avgCalories,
  };
}

