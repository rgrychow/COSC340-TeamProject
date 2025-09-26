// hooks/useNutrition.ts
import { useState } from "react";

export type Meal = { id: string; name: string; calories: number };
export type NutritionTargets = { calories: number; protein: number; carbs: number; fats: number };

export function useNutrition() {
  const [targets, setTargets] = useState<NutritionTargets>({
    calories: 2200,
    protein: 160,
    carbs: 220,
    fats: 70,
  });

  const [meals, setMeals] = useState<Meal[]>([]);

  const addMeal = (name: string, calories: number): void => {
    setMeals((prev) => [
      ...prev,
      { id: String(Date.now()), name, calories },
    ]);
  };

  const updateTargets = (newTargets: Partial<NutritionTargets>): void => {
    setTargets((prev) => ({ ...prev, ...newTargets }));
  };

  return { targets, meals, addMeal, updateTargets };
}

