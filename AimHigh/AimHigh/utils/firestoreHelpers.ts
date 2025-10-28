import { doc, setDoc, getDoc, collection } from "firebase/firestore";
import { auth, db } from "../firebase";

// ✅ Save a single workout set to Firestore
export async function saveWorkout(
  day: string,
  exercise: string,
  setNum: number,
  reps: number,
  weight: number
) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    // Path: users/{uid}/workouts/{day}/exercises/{exercise}
    const exerciseRef = doc(db, "users", user.uid, "workouts", day, "exercises", exercise);

    // Each exercise has multiple sets, we’ll merge them under 'sets'
    await setDoc(
      exerciseRef,
      {
        date: day,
        name: exercise,
        sets: {
          [`set_${setNum}`]: { reps, weight },
        },
      },
      { merge: true }
    );

    console.log("✅ Saved to Firestore:", {
      user: user.uid,
      day,
      exercise,
      setNum,
      reps,
      weight,
    });
  } catch (error) {
    console.error("❌ Firestore save error:", error);
  }
}

// ✅ Fetch all workouts for a given day
export async function fetchDayData(day: string) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const dayRef = doc(db, "users", user.uid, "workouts", day);
    const daySnap = await getDoc(dayRef);

    if (daySnap.exists()) {
      console.log("📄 Fetched workout:", daySnap.data());
      return daySnap.data();
    } else {
      console.log("⚠️ No data found for that day:", day);
      return null;
    }
  } catch (error) {
    console.error("❌ Firestore fetch error:", error);
    return null;
  }
}
