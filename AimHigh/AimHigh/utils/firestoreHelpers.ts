// utils/firestoreHelpers.ts
import { db, auth } from "../firebase";
import { collection, doc, setDoc, getDocs, serverTimestamp } from "firebase/firestore";

function getUid() {
  const user = auth.currentUser;
  if (!user) throw new Error("User not signed in");
  return user.uid;
}

export async function saveWorkout(day: string, workoutType: string, setNumber: number, reps: number, weightLb: number) {
  const uid = getUid();
  const workoutId = `${workoutType}_${Date.now()}`;
  const setId = `set_${setNumber}`;
  const setRef = doc(db, "users", uid, "workoutDays", day, "workouts", workoutId, "sets", setId);
  await setDoc(setRef, { setNumber, reps, weightLb, createdAt: serverTimestamp() });
  const workoutRef = doc(db, "users", uid, "workoutDays", day, "workouts", workoutId);
  await setDoc(workoutRef, { workoutType, createdAt: serverTimestamp() }, { merge: true });
}

export async function saveRun(day: string, distanceMiles: number, durationSec: number) {
  const uid = getUid();
  const runId = `run_${Date.now()}`;
  const runRef = doc(db, "users", uid, "runDays", day, "runs", runId);
  await setDoc(runRef, { distanceMiles, durationSec, createdAt: serverTimestamp() });
}

export async function saveMeal(day: string, mealName: string, calories: number, protein: number, fats: number, carbs: number) {
  const uid = getUid();
  const mealId = `meal_${Date.now()}`;
  const mealRef = doc(db, "users", uid, "mealDays", day, "meals", mealId);
  await setDoc(mealRef, { mealName, calories, protein, fats, carbs, createdAt: serverTimestamp() });
}

export async function fetchDayData(day: string) {
  const uid = getUid();
  const [workoutsSnap, runsSnap, mealsSnap] = await Promise.all([
    getDocs(collection(db, "users", uid, "workoutDays", day, "workouts")),
    getDocs(collection(db, "users", uid, "runDays", day, "runs")),
    getDocs(collection(db, "users", uid, "mealDays", day, "meals")),
  ]);

  const workouts = workoutsSnap.docs.map((d) => d.data());
  const runs = runsSnap.docs.map((d) => d.data());
  const meals = mealsSnap.docs.map((d) => d.data());

  return { workouts, runs, meals };
}
