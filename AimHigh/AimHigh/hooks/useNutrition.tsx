// hooks/useNutrition.ts
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
// import { localYMD } from "../utils/date";
import { addEntry as addEntryFs, ensureSummary } from "../lib/nutrition-store";
import {
  subscribeTargets,
  subscribeTodayTotals,
  upsertTargets,
  addToTodayTotals,
  Targets,
  Totals,
} from "../lib/nutrition-store";


type NutritionContextValue = {
  targets: Targets;
  summary: { kcal: number; protein_g: number; carbs_g: number; fat_g: number; };
  entries: LogEntry[];
  loading: boolean;
  addEntry: (e: Omit<LogEntry, "id" | "createdAt">) => void;
  updateTargets: (patch: Partial<Targets>) => Promise<void> | void;
};

export const NutritionCtx = createContext<NutritionContextValue | undefined>(undefined);

// Provider: subscribes once and shares to all screens
export function NutritionProvider({ children }: { children: React.ReactNode }) {

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
  const ZERO: Targets = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  const DEFAULTS: Targets = { kcal: 2200, protein_g: 160, carbs_g: 220, fat_g: 70 };

  const [uid, setUid] = useState<string | null>(null);
  const [targets, setTargets] = useState<Targets | null>(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<Entry[]>([]);



  // auth
  useEffect(() => {
    const off = onAuthStateChanged(auth, (user) => setUid(user?.uid ?? null));
    return off;
  }, []);

  // live Firestore targets
  useEffect(() => {
    if (!uid) {
      setTargets(null);
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
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

  const updateTargets = useCallback(
    async (patch: Partial<Targets>) => {
      if (!uid) return;

      setTargets((prev) => ({ ...(prev ?? DEFAULTS), ...patch}));


      const ref = doc(db, "users", user.uid);
      const next = { ...(targets ?? DEFAULTS), ...patch };
      await setDoc(
        ref, 
        { nutrition: { target: next } }, 
        { merge: true }
      );
    },
    [uid, targets]
  );

  const addEntry = useCallback(
    async (e: Omit<Entry, "id" | "createdAt">) => {
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
    },
    [uid]
  );

  const value = useMemo(
    () => ({
      targets: targets ?? DEFAULTS, 
      summary,
      entries,
      loading,
      addEntry,
      updateTargets,
    }),
    [targets, summary, entries, loading, addEntry, updateTargets]
  );

  return (
    <NutritionCtx.Provider value={{ targets, updateTargets, loading, entries, addEntry, summary }}>
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

