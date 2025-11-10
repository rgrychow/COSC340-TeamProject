// hooks/useNutrition.ts
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { doc, onSnapshot, setDoc, getDoc, query, collection, orderBy } from "firebase/firestore";
import { auth, db } from "../firebase";
import { onAuthStateChanged, getAuth } from "firebase/auth";
// import { localYMD } from "../utils/date";
import { addEntry as addEntryFs, ensureSummary } from "../lib/nutrition-store";
import {
  subscribeTargets,
  subscribeTodayTotals,
  upsertTargets,
  addToTodayTotals,
  Targets,
  Totals,
  dayKey,
  addEntryToDay,
  getDayLog,
  subscribeDayLog,
} from "../lib/nutrition-store";


type NutritionContextValue = {
  targets: Targets;
  summary: { kcal: number; protein_g: number; carbs_g: number; fat_g: number; };
  entries: LogEntry[];
  loading: boolean;
  addEntry: (e: Omit<LogEntry, "id" | "createdAt">) => void;
  updateTargets: (patch: Partial<Targets>) => Promise<void> | void;
  selectedDayId: string;
  setSelectedDayId: (id: string) => void;
  setSelectedDate: (d: Date) => void;
};

export const NutritionCtx = createContext<NutritionContextValue | undefined>(undefined);

// Provider: subscribes once and shares to all screens
export function NutritionProvider({ children }: { children: React.ReactNode }) {

  /*
  type Targets = { kcal: number; protein_g: number; carbs_g: number; fat_g: number };
  type LogEntry = {
    id: string;
    name: string;
    brand?: string | null;
    kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    createdAt: number;
  };
  */
  const ZERO: Targets = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  const DEFAULTS: Targets = { kcal: 2200, protein_g: 160, carbs_g: 220, fat_g: 70 };

  const [uid, setUid] = useState<string | null>(null);
  const [targets, setTargets] = useState<Targets | null>(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<Array<{ id: string; kcal: number; protein_g: number; carbs_g: number; fat_g: number}>>([]);
  const [summary, setSummary] = useState({ kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
  const [_summary, _setSummary] = useState<Totals>(ZERO);
  const [selectedDayId, setSelectedDayId] = useState<string>(dayKey(new Date()));

  const setSelectedDate = useCallback((d: Date) => { setSelectedDayId(dayKey(d)); }, []);

  const auth = getAuth();



  // auth
  useEffect(() => {
    const off = onAuthStateChanged(auth, (user) => setUid(user?.uid ?? null));
    return off;
  }, []);

  useEffect(() => {
    if (!uid) {
      setEntries([]);
      return;
    }
    const off = subscribeDayLog(db, uid, selectedDayId, (list) => setEntries(list));
    return off;
  }, [db, uid, selectedDayId]);

  // live Firestore targets
  useEffect(() => {
    if (!uid) {
      setTargets(null);
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const offTargets = subscribeTargets(uid, (t) => {
      setTargets(t);
      setLoading(false);
    });

    const offToday = subscribeTodayTotals(uid, ({ totals, entries }) => {
      _setSummary(totals);
      setEntries(entries);
    });

    return () => {
      offTargets();
      offToday();
    };
  }, [uid]);

  useEffect(() => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) return;

    const dayId = dayKey(new Date());
    const dayRef = doc(db, "users", uid, "days", dayId);
    const entriesQ = query(collection(dayRef, "entries"), orderBy("createdAt", "desc"));

    const off = onSnapshot(entriesQ, (snap) => {
      const next = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setEntries(next);
    });
    return off;
  }, [db]);

  useEffect(() => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) return;

    const dayId = dayKey(new Date());
    const dayRef = doc(db, "users", uid, "days", dayId);

    const off = onSnapshot(dayRef, (snap) => {
      const d = snap.data() as any;
      const t = d?.totals || { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, target_kcal: 0, target_protein_g: 0, target_carbs_g: 0, target_fat_g: 0, water_oz: 0 };
      setSummary({
        kcal: t.kcal,
        protein_g: t.protein_g,
        carbs_g: t.carbs_g,
        fat_g: t.fat_g,
        targets: {
          kcal: t.target_kcal,
          protein_g: t.target_protein_g,
          carbs_g: t.target_carbs_g,
          fat_g: t.target_fat_g,
        },
      });
    });
    return off;
  }, [db]);

  useEffect(() => {
    if (!uid || !selectedDayId) {
      setEntries([]);
      setSummary({ kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
      return;
    }
    const col = collection(db, "users", uid, "days", selectedDayId, "entries");
    const q = query(col, orderBy("createdAt", "desc"));

    const off = onSnapshot(
      q,
      (snap) => {
        const list: typeof entries = [];
        let tot = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
        const toNum = (v: any) => typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0;
        snap.forEach((d) => {
          const e = d.data() as any;
          const item = {
            id: d.id,
            name: e.name ?? "Food",
            brand: e.brand ?? null,
            servings: toNum(e.servings),
            gramsPerServing: toNum(e.grams),
            createdAt: e.createdAt ?? null,
            kcal: toNum(e.kcal) ?? 0,
            protein_g: toNum(e.protein_g) ?? 0,
            carbs_g: toNum(e.carbs_g) ?? 0,
            fat_g: toNum(e.fat_g) ?? 0,
          };
          list.push(item);
          tot.kcal += item.kcal;
          tot.protein_g += item.protein_g,
          tot.carbs_g += item.carbs_g;
          tot.fat_g += item.fat_g;
        });

        setEntries(list);
        setSummary(tot);
      },
      (err) => {
        console.warn("[nutrition] entries onSnapshot error", err);
        setEntries([]);
        setSummary({ kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
      }
    );

    return off;
  }, [uid, selectedDayId]);
  /*
    const ref = doc(db, "users", uid);
    //         const snap = await getDoc(ref);
    const off = onSnapshot(
      ref,
      (snap) => {

        const d = (snap.data() as any) || {};
        const t = d?.nutrition?.target as Partial<Targets> | undefined;
        setTargets({
          kcal: t?.kcal ?? DEFAULTS.kcal,
          protein_g: t?.protein_g ?? DEFAULTS.protein_g,
          carbs_g: t?.carbs_g ?? DEFAULTS.carbs_g,
          fat_g: t?.fat_g ?? DEFAULTS.fat_g,
        });
        setLoading(false);
      },
      () => setLoading(false)
    );
    return off;
  }, [uid]);
  */

  /*
  const summary = useMemo<Targets>(() => {
    return entries.reduce(
      (acc, e) => ({
        kcal: acc.kcal + (e.kcal ?? 0),
        protein_g: acc.protein_g + (e.protein_g ?? 0),
        carbs_g: acc.carbs_g + (e.carbs_g ?? 0),
        fat_g: acc.fat_g + (e.fat_g ?? 0),
      }),
      { ...ZERO }
    );
  }, [entries]);
*/

  const updateTargets = useCallback(
    async (patch: Partial<Targets>) => {
      if (!uid) return;

      setTargets((prev) => ({ ...(prev ?? DEFAULTS), ...patch}));

      await upsertTargets(uid, patch);
      /*
      const ref = doc(db, "users", user.uid);
      const next = { ...(targets ?? DEFAULTS), ...patch };
      await setDoc(
        ref, 
        { nutrition: { target: next } }, 
        { merge: true }
      );
      */

    },
    [uid]
  );

  const addEntry = useCallback(
    async (e: Omit<Entry, "id" | "createdAt">) => {
      if (!uid) return;
      await addEntryFs(uid, e);
      /*
      const now = Date.now();
      const id = `${now}`;
      const normalized: Entry = {
        id,
        name: e.name ?? "Food",
        brand: e.brand ?? null,
        kcal: Number(e.kcal) || 0,
        protein_g: Number(e.protein_g) || 0,
        carbs_g: Number(e.carbs_g) || 0,
        fat_g: Number(e.fat_g) || 0,
        createdAt: now,
      };

      setEntries((prev) => [...prev, normalized]);
      */
    },
    [uid]
  );

  /*
  const value = useMemo(
    () => ({
      targets: targets ?? DEFAULTS, 
      summary: _summary,
      entries,
      loading,
      addEntry,
      updateTargets,
    }),
    [targets, summary, entries, loading, addEntry, updateTargets]
  );
  */


  // Keep?
  const ctxValue: NutritionContextValue = {
    targets: (targets ?? DEFAULTS),
    summary,
    entries,
    loading,
    addEntry,
    updateTargets,
    selectedDayId,
    setSelectedDayId,
    setSelectedDate,
  };



  return (
    <NutritionCtx.Provider value={ctxValue}>
      {children}
    </NutritionCtx.Provider>
  );

}

// Hook for screens
export function useNutrition() {
  const ctx = useContext(NutritionCtx);
  if (!ctx) throw new Error("useNutrition must be used within NutritionProvider");
  return ctx;
}

