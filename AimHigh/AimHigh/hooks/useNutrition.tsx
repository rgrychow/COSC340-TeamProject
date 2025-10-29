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


// export type Meal = { id: string; name: string; calories: number };
// export type NutritionTargets = { kcal: number; protein_g: number; carbs_g: number; fat_g: number };
// export type Targets = Totals;

//type Targets = { kcal: number; protein_g: number; carbs_g: number; fat_g: number };
// const ZERO: Targets = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
// const DEFAULTS: Targets = { kcal: 2200, protein_g: 160, carbs_g: 220, fat_g: 70 };

//export type LogEntry = {
//  id: string;
//  name: string;
//  brand?: string | null;
//  kcal: number;
//  protein_g: number;
//  carbs_g: number;
//  fat_g: number;
//  createdAt: number;
//};

type NutritionContextValue = {
  targets: Targets;
  summary: { kcal: number; protein_g: number; carbs_g: number; fat_g: number; };
  entries: LogEntry[];
  loading: boolean;
  addEntry: (e: Omit<LogEntry, "id" | "createdAt">) => void;
  updateTargets: (patch: Partial<Targets>) => Promise<void> | void;
};

// Context contract
//type Ctx = {
//  loading: boolean;
//  targets: Targets;
//  totals: Totals;
//  updateTargets: (p: Partial<Targets>) => Promise<void>;
//  addToTotals: (d: Partial<Totals>) => Promise<void>;


// uid: string | null;

// current day key and ability to change
// date: string;
// setDate: (d: string) => void;

// live data
// targets: Targets | null;
// summary: Totals | null;

// mutations
// setTargets: (t: Targets) => Promise<void>;
// addEntry: (entry: any, totals: Totals) => Promise<void>;
//};

export const NutritionCtx = createContext<NutritionContextValue | undefined>(undefined);
//export const NutritionCtx = createContext<({
//  targets: {kcal: 2200, protein_g: 160, carbs_g: 220, fat_g: 70 },
//  summary: {kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
//  entries: [],
//  addEntry: () => {},
//  updateTargets: async () => {},
//});

// Provider: subscribes once and shares to all screens
// export const NutritionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
  // const [date, setDate] = useState(localYMD());
  const [targets, setTargets] = useState<Targets | null>(null);
  //  const [targets, setTargets] = useState<Targets>({
  //    kcal: 2200,
  //    protein_g: 160,
  //    carbs_g: 220,
  //    fat_g: 70,
  //  });

  //  const [summary, setSummary] = useState<Targets>(ZERO); <--------
  //  const [summary, setSummary] = useState<Totals>({
  //    kcal: 0,
  //    protein_g: 0,
  //    carbs_g: 0,
  //    fat_g: 0,
  //  });

  const [loading, setLoading] = useState(true);
  //const [summary, setSummary] = useState<Totals | null>(null);

  //  const [totals, setTotals] = useState<Totals>({
  //    kcal:0, protein_g:0, carbs_g:0, fat_g:0,
  //  });
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

  //          await setDoc(
  //          ref,
  //          { nutrition: { target: {
  //            kcal: patch.kcal,
  //            protein: patch.protein_g,
  //            carbs: patch.carbs_g,
  //            fats: patch.fat_g,
  //          } } },
  //          { merge: true }
  //          );
  //        }

  //        unsub = onSnapshot(
  //          ref,
  //          (s) => {
  //            const d = s.data();
  //            const t: Targets | null = data?.nutrition?.target
  //              ? {
  //                kcal: Number(data.nutrition.target.kcal ?? 2200),
  //                protein_g: Number(data.nutrition.target.protein ?? 160),
  //                carbs_g: Number(data.nutrition.target.carbs ?? 220),
  //                fat_g: Number(data.nutrition.target.fats ?? 70),
  //                }
  //              : null;
  //
  //            setTargets(t);
  //            setLoading(false);
  //          },
  //          (err) => {
  //            console.error("[NutritionProvider] onSnapshot error:", err);
  //            setLoading(false);
  //          }
  //        );
  //      } catch (e) {
  //        console.error("[NutritionProvider] init error:", e);
  //        setLoading(false);
  //      }
  //    });

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



  //    const body: any = {};
  //    if (patch.kcal !== undefined) body.kcal = patch.kcal;
  //    if (patch.protein_g !== undefined) body.protein = patch.protein_g;
  //    if (patch.carbs_g !== undefined) body.carbs = patch.carbs_g;
  //    if (patch.fat_g !== undefined) body.fats = patch.fat_g;
  //
  //    await setDoc(
  //      doc(db, "users", user.uid),
  //      { nutrition: { target: body} },
  //      { merge: true }
  //    );

  //  const summary = useMemo(() => { 
  //    return entries.reduce(
  //      (acc, e) => ({
  //        kcal: acc.kcal + (e.kcal || 0),
  //        protein_g: acc.protein_g + (e.protein_g || 0),
  //        carbs_g: acc.carbs_g + (e.carbs_g || 0),
  //        fat_g: acc.fat_g + (e.fat_g || 0),
  //      }),
  //      { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  //    );
  //  }, [entries]);
  //
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
        cretaedAt: now,
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


  //  useEffect(() => {
  //    const unsub1 = subscribeTargets((t) => {
  //      setTargets(t);
  //      setLoading(false);
  //    });
  //    const unsub2 = subscribeTodayTotals((x) => setTotals(x));
  //    return () => {
  //      unsub1 && unsub1();
  //      unsub2 && unsub2();
  //    };
  //  }, []);
  //
  //  const value = useMemo<Ctx>(() => ({
  //    loading,
  //    targets,
  //    totals,
  //    updateTargets: upsertTargets,
  //    addToTotals: addToTodayTotals,
  //  }), [loading, targets, totals]);
  //
  //  return <NutritionCtx.Provider value={value}>{children}</NutritionCtx.Provider>;
  /*
  // keep uid in sync with Firebase Auth
  useEffect(() => onAuthStateChanged(auth, u => setUid(u ? u.uid : null)), []);

  // subscribe to targets
  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, "users", uid, "targets", "main");
    const unsub = onSnapshot(ref, snap => setTargetsState((snap.data() as Targets) ?? null));
    return unsub;
  }, [uid]);

  // subscribe to day's summary
  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    const ref = doc(db, "users", uid, "days", date);
    const unsub = onSnapshot(ref, snap => {
      const s = (snap.data()?.summary ?? null) as Totals | null;
      setSummary(s);
      setLoading(false);
    });
    return unsub;
  }, [uid, date]);

  const value = useMemo<Ctx>(() => ({
    loading,
    uid,
    date,
    setDate,
    targets,
    summary,

    setTargets: async (t: Targets) => {
      if (!uid) return;
      await setDoc(doc(db, "users", uid, "targets", "main"), t, { merge: true});
    },

    addEntry: async (entry: any, totals: Totals) => {
      if (!uid) return;
      await ensureSummary(uid, date);
      await addEntryFs(uid, date, entry, totals);
      // Firestore listeners will update `summary` live after the write
    },
  }), [loading, uid, date, targets, summary]);

  return <NutritionCtx.Provider value={value}>{children}</NutritionCtx.Provider>;
  */

}

// Hook for screens
export function useNutrition() {
  const ctx = useContext(NutritionCtx);
  if (!ctx) throw new Error("useNutrition must be used within NutritionProvider");
  return ctx;
}


//const addEntry = (e: Omit<LogEntry, "id" | "createdAt">) => {
//  const entry: LogEntry = { id: String(Date.now()), createdAt: Date.now(), ...e, };
//  setEntries(prev => [entry, ...prev]);
//};

/* Old
export function useNutrition() {
  const [targets, setTargets] = useState<NutritionTargets>({
    calories: 2200,
    protein: 160,
    carbs: 220,
    fats: 70,
  });

  const [meals, setMeals] = useState<Meal[]>([]);

  const addMeal = (name: string, calories: number): void => {
    setMeals((prev) => [
      ...prev,
      { id: String(Date.now()), name, calories },
    ]);
  };

  const updateTargets = (newTargets: Partial<NutritionTargets>): void => {
    setTargets((prev) => ({ ...prev, ...newTargets }));
  };

  return { targets, meals, addMeal, updateTargets };
}
*/

