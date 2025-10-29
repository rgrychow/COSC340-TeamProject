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
