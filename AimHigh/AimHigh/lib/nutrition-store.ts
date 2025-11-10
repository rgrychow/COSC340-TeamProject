import { db } from "../firebase";
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDocs,
	Firestore,
	getDoc,
	increment,
	onSnapshot,
	orderBy,
	query,
	serverTimestamp,
	runTransaction,
	setDoc,
	updateDoc,
	writeBatch,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import type { MealEntry, Macros } from "types/nutrition";
import { entries, setEntries } from "../hooks/useNutrition";

export type Targets = { kcal: number; protein_g: number; carbs_g: number; fat_g: number };
export type Totals = Targets;

export type NutritionEntry = {
	//id: string;
	name: string;
	brand: string | null;
	kcal: number; protein_g: number; carbs_g: number; fat_g: number;
	grams: number;
	servings: number;
	createdAt?: any;
};

export type DayTargets = {
  target_kcal: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
  target_water_oz: number;
};



export const ensureSummary = async (uid: string, dayId: string) => {
	const ref = doc(db, "users", uid, "days", dayId);
	const snap = await getDoc(ref);
	if (!snap.exists()) await setDoc(ref, { kcal:0, protein_g: 0, carbs_g: 0, fat_g: 0 });
};


const todayId = () => new Date().toISOString().slice(0,10); // YYYY-MM-DD

function userDoc(uid: string) {
	return doc(db, "users", uid);
}
function targetsDoc(uid: string) {
	return doc(db, "users", uid);
}
function dayDoc(uid: string, dayId: string) {
	return doc(db, "users", uid, "days", dayId);
}
function rid() {
  return (Math.random().toString(36) + Math.random().toString(36)).replace(/[^a-z0-9]/g, "").slice(0,20);
}
export const dayKey = (d: Date = new Date()) => d.toISOString().slice(0,10);

// === Subscriptions ===
export const subscribeTargets = (uid: string, cb: (t: Targets)=>void) => {
  const ref = doc(db, "users", uid);
  return onSnapshot(ref, (s) => {
    const t = s.get("nutrition.target") as Partial<Targets> | undefined;
    cb({ kcal:0, protein_g:0, carbs_g:0, fat_g:0, ...t });
  });
};

export const subscribeTodayTotals = (
  uid: string,
  cb: (p:{ totals: Totals; entries: LogEntry[] })=>void
) => {
  const dayId = new Date().toISOString().slice(0,10); // YYYY-MM-DD
  const dayRef = doc(db, "users", uid, "days", dayId);
  const entriesRef = collection(db, "users", uid, "days", dayId, "entries");

  const off1 = onSnapshot(dayRef, (s) => {
    const d = (s.exists() ? s.data() : {}) as Partial<Totals>;
    _send({ totals: { kcal:0, protein_g:0, carbs_g:0, fat_g:0, ...d } });
  });
  const off2 = onSnapshot(query(entriesRef, orderBy("createdAt","desc")), (qs) => {
    const list: LogEntry[] = qs.docs.map(d => ({ id:d.id, ...(d.data() as any) }));
    _send({ entries: list });
  });

  let lastTotals: Totals = {kcal:0,protein_g:0,carbs_g:0,fat_g:0};
  let lastEntries: LogEntry[] = [];
  const _send = (p: Partial<{totals:Totals;entries:LogEntry[]}>) => {
    if (p.totals)  lastTotals  = p.totals;
    if (p.entries) lastEntries = p.entries;
    cb({ totals: lastTotals, entries: lastEntries });
  };

  return () => { off1(); off2(); };
};

// === Mutations ===
export const upsertTargets = async (uid: string, patch: Partial<Targets>) => {
  const ref = doc(db, "users", uid);
  await setDoc(ref, { nutrition: { target: patch } }, { merge: true });
};

export async function addEntry(db: Firestore, uid: string, dayId: string, e: Entry) {
  const dayRef = doc(db, "users", uid, "days", dayId);
  await setDoc(dayRef, { touchedAt: serverTimestamp() }, { merge: true });

  const entryId = rid();
  const entryRef = doc(db, "users", uid, "days", dayId, "entries", entryId);

  await setDoc(entryRef, { ...e, createdAt: serverTimestamp() });

  return entryId;
}

export async function addToTodayTotals(delta: Partial<Totals>) {
	const uid = getAuth().currentUser?.uid;
	if (!uid) throw new Error("No user");
	const ref = dayDoc(uid, todayId());
	const snap = await getDoc(ref);
	const prev = (snap.data() as any)?.totals ?? { kcal:0, protein_g:0, carbs_g:0, fat_g:0 };
	const next: Totals = {
		kcal: (prev.kcal ?? 0) + (delta.kcal ?? 0),
		protein_g: (prev.protein_g ?? 0) + (delta.protein_g ?? 0),
		carbs_g: (prev.carbs_g ?? 0) + (delta.carbs_g ?? 0),
		fat_g: (prev.fat_g ?? 0) + (delta.fat_g ?? 0),
	};
	await setDoc(ref, { totals: next }, { merge: true });
}

export function todayIdForDebug() {
	return todayId();
}

// New
export async function addEntryToDay(opts: {
  db: Firestore;
  uid: string;
  dayId: string;
  entry: NutritionEntry;
  targets: DayTargets;
  water_oz?: number
}) {
  const { db, uid, dayId, entry, targets, water_oz = 0 } = opts;

  const dayRef = doc(db, "users", uid, "days", dayId);

  await runTransaction(db, async (tx) => {
    const daySnap = await tx.get(dayRef);

    const prevTotals = (daySnap.exists() ? (daySnap.data() as any).totals : null) || {
      kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0,
      water_oz: 0,
      target_kcal: targets.target_kcal,
      target_protein_g: targets.target_protein_g,
      target_carbs_g: targets.target_carbs_g,
      target_fat_g: targets.target_fat_g,
      target_water_oz: targets.target_water_oz,
    };

    const newTotals = {
      kcal: prevTotals.kcal + entry.kcal,
      protein_g: prevTotals.protein_g + entry.protein_g,
      carbs_g: prevTotals.carbs_g + entry.carbs_g,
      fat_g: prevTotals.fat_g + entry.fat_g,
      water_oz: typeof prevTotals.water_oz === "number" ? prevTotals.water_oz : water_oz,

      target_kcal: targets.target_kcal,
      target_protein_g: targets.target_protein_g,
      target_carbs_g: targets.target_carbs_g,
      target_fat_g: targets.target_fat_g,
      target_water_oz: targets.target_water_oz,
    };

    tx.set(dayRef, { totals: newTotals, updatedAt: serverTimestamp() }, { merge: true });

    const entriesCol = collection(dayRef, "entries");
    const entryRef = doc(entriesCol);
    tx.set(entryRef, {
      ...entry,
      createdAt: serverTimestamp(),
    } as NutritionEntry);
  });
}

export async function getDayLog(db: Firestore, uid: string, dayId: string): Promise<MealEntry[]> {
  const colRef = collection(db, "users", uid, "days", dayId, "entries");
  const qref = query(colRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(qref);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as MealEntry[];
}

export function subscribeDayLog(db: Firestore, uid: string, dayId: string, cb: (items: MealEntry[]) => void) {
  const colRef = collection(db, "users", uid, "days", dayId, "entries");
  const qref = query(colRef, orderBy("createdAt", "desc"));
  return onSnapshot(qref, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as MealEntry[];
    cb(list);
  });
}
