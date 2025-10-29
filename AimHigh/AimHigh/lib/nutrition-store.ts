import { db } from "../firebase";
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDoc,
	increment,
	serverTimestamp,
	setDoc,
	updateDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

export type Targets = { kcal: number; protein_g: number; carbs_g: number; fat_g: number };
export type Totals = Targets;

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

// === Subscriptions ===
export function subscribeTargets(
	cb: (t: Targets) => void,
	onError?: (e: any) => void
) {
	const uid = getAuth().currentUser?.uid;
	if (!uid) return () => {};
	return onSnapshot(
		targetsDoc(uid),
		(snap) => {
			const d = snap.data() as any;
			const t: Targets = 
				d?.nutrition?.target ?? { kcal: 2200, protein_g: 160, carbs_g: 220, fat_g: 70 };
			cb(t);
		},
		onError
	);
}

export function subscribeTodayTotals(
	cb: (x: Totals) => void,
	onError?: (e: any) => void
) {
	const uid = getAuth().currentUser?.uid;
	if (!uid) return () => {};
	const id = todayId();
	return onSnapshot(
		dayDoc(uid, id),
		(snap) => {
			const d = snap.data() as any;
			const t: Targets = 
				d?.nutrition?.target ?? { kcal:0, protein_g:0, carbs_g:0, fat_g:0 };
			cb(totals);
		},
		onError
	);
}

// === Mutations ===
export async function upsertTargets(partial: Partial<Targets>) {
	const uid = getAuth().currentUser?.uid;
	if (!uid) throw new Error("No user");
	const ref = targetsDoc(uid);

	// merge into nutrition.target
	const existing = await getDoc(ref);
	const prev = existing.data() as any;
	const curr = prev?.nutrition?.target ?? {};
	const next = {...curr, ...partial };

	await setDoc(
		ref,
		{ nutrition: { ...(prev?.nutrition ?? {}), target: next } },
		{ merge: true }
	);
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


//---------------------------------------
/*
export const ZERO_TOTALS: Totals = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };

const dayRef = (uid: string, date: string) => doc(db, "users", uid, "days", date);
const entriesCol = (uid: string, date: string) => collection(db, "users", uid, "days", date, "entries");

export async function ensureSummary(uid: string, date: string): Promise<void> {
	const dref = dayRef(uid, date);
	const snap = await getDoc(dref);
	if (!snap.exists()) {
		await setDoc(dref, {
			summary: { ...ZERO_TOTALS },
			createdAt: serverTimestamp(),
			updateAt: serverTimestamp(),
		});
	}
}

export async function addEntry(
	uid: string,
	date: string,
	entry: any,
	totals: Totals
) : Promise<string> {
	const dref = dayRef(uid, date);
	await ensureSummary(uid, date);

	const eref = await addDoc(entriesCol(uid, date), {
		...entry,
		totals,
		createdAt: serverTimestamp(),
	});

	await updateDoc(dref, {
		"summary.kcal": increment(totals.kcal || 0),
		"summary.protein_g": increment(totals.protein_g || 0),
		"summary.carbs_g": increment(totals.carbs_g || 0),
		"summary.fat_g": increment(totals.fat_g || 0),
		updateAt: serverTimestamp(),
	});

	return eref.id;
}

export async function removeEntry(
	uid: string,
	date: string,
	entryId: string,
	totals: Totals
): Promise<void> {
	const dref = dayRef(uid, date);
	const eref = doc(db, "users", uid, "days", date, "entries", entryId);

	await deleteDoc(eref);

	await updateDoc(dref, {
		"summary.kcal": increment(-(totals.kcal || 0)),
		"summary.protein_g": increment(-(totals.protein_g || 0)),
		"summary.carbs_g": increment(-(totals.carbs_g || 0)),
		"summary.fat_g": increment(-(totals.fat_g || 0)),
		updateAt: serverTimestamp(),
	});
}
*/
