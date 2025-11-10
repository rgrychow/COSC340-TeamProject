import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp, Firestore } from "firebase/firestore";
import type { MealEntry, Macros } from "types/nutrition";

const rid = () => (Math.random().toString(36) + Math.random().toString(36)).replace(/[^a-z0-9]/g, "").slice(0,20);

const dayKey = (uid: string, dayId: string) => `${uid}_${dayId}`;

export async function addMealToDay(db: Firestore, uid: string, dayId: string, entry: Omit<MealEntry, "id" | "createdAt">) {
  if (!uid) throw new Error("No uid");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayId)) throw new Error(`Bad dayId: ${dayId}`);

  const id = rid();
  const docId = dayKey(uid, dayId);
  const ref = doc(db, "nutritionDays", docId);

  await setDoc(ref, { uid, dayId }, { merge: true });

  await updateDoc(ref, {
    entries: arrayUnion({
      id,
      ...entry,
      createdAt: serverTimestamp(),
    }),
    lastUpdated: serverTimestamp(),
  });

  return id;
}

export async function getDayLog(db: Firestore, uid: string, dayId: string): Promise<MealEntry[]> {
  const ref = doc(db, "nutritionDays", dayKey(uid, dayId));
  const snap = await getDoc(ref);
  if (!snap.exists()) return [];
  const data = snap.data() as any;
  return Array.isArray(data.entries) ? data.entries : [];
}
