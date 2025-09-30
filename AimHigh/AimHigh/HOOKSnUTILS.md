# Hooks
**useWorkouts.ts**

Manages workout state (workouts → exercises → sets).

Provides functions:

- addWorkout() – create a new workout session.

- addExercise(workoutId, name) – add an exercise to a workout.

- addSet(workoutId, exerciseId, reps, weight) – add a set to an exercise.

Returns: { workouts, addWorkout, addExercise, addSet }.

Use in Fitness screen:

import { useWorkouts } from "../hooks/useWorkouts";

const { workouts, addWorkout, addExercise, addSet } = useWorkouts();

**useNutrition.ts**

Manages nutrition targets and meals.

Provides functions:

- addMeal(name, calories) – add a meal entry.

- updateTargets(partialTargets) – update calorie/macros goals.

Returns: { targets, meals, addMeal, updateTargets }.

Use in Nutrition screen:

import { useNutrition } from "../hooks/useNutrition";

const { targets, meals, addMeal, updateTargets } = useNutrition();

**useProgress.ts**

Calculates progress stats using workouts + meals.

Functions:

- weeklyWorkouts – workouts in the last 7 days.

- avgCalories – average calories from meals.

Use in Progress screen:

import { useProgress } from "../hooks/useProgress";
import { useWorkouts } from "../hooks/useWorkouts";
import { useNutrition } from "../hooks/useNutrition";

const { workouts } = useWorkouts();
const { meals } = useNutrition();
const { weeklyWorkouts, avgCalories } = useProgress(workouts, meals);

**useNow.ts**

Keeps track of the current time, updating every second (default).

Useful for clocks or “last updated” labels.

Example:

import { useNow } from "../hooks/useNow";

const now = useNow();
<Text>{now.toLocaleTimeString()}</Text>

# Utils
**date.ts**

- formatDateTime(dateISO) – returns "Jan 10, 2025 6:30 PM".

- formatRelativeTime(dateISO) – returns "5m ago", "2h ago", etc.

Example:

import { formatDateTime } from "../utils/date";

<Text>{formatDateTime(workout.dateISO)}</Text>

**calc.ts**

- average(numbers) – returns the average of an array.

- total(numbers) – returns the sum of an array.

Example:

import { average, total } from "../utils/calc";

const avg = average([1, 2, 3]); // 2
const sum = total([1, 2, 3]);   // 6
