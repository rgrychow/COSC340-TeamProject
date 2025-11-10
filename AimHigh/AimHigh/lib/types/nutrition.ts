import type { Timestamp, FielddValue } from "../../firebase/firestore";

export type Macros = {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export type MealEntry = {
  id: string;
  name: string;
  brand: string | null;
  servings: number;
  gramPerServing?: number | null;
  macros: Macros;
  createdAt: Timestamp | FieldValue | null
};
