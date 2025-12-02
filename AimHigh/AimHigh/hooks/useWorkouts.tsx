// hooks/useWorkouts.tsx
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// This file lives in /hooks (project root)
import { auth, db } from "../firebase";

export type SetItem = { id: string; reps: number; weight: number; ts: number };
export type Exercise = { id: string; name: string; sets: SetItem[] };
export type Workout = { id: string; dateISO: string; exercises: Exercise[] };

type WorkoutsContextValue = {
  workouts: Workout[];
  addWorkout: () => void;
  deleteWorkout: (workoutId: string) => void;
  addExercise: (workoutId: string, name: string) => void;
  deleteExercise: (workoutId: string, exerciseId: string) => void;
  addSet: (
    workoutId: string,
    exerciseId: string,
    reps: number,
    weight: number
  ) => void;
  deleteSet: (workoutId: string, exerciseId: string, setId: string) => void;
};

const WorkoutsContext = createContext<WorkoutsContextValue | undefined>(
  undefined
);

// ---------- helpers ----------
const nowISO = () => new Date().toISOString();
const dayIdFromISO = (iso: string) => iso.slice(0, 10); // YYYY-MM-DD

const lastNDays = (n: number) => {
  const days: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    const di = new Date(d);
    di.setDate(d.getDate() - i);
    days.push(di.toISOString().slice(0, 10));
  }
  return days;
};

type SessionKey = string;

type LocalMaps = {
  // workout card id -> session ISO string
  cardToSession: Map<string, SessionKey>;
  // exercise id -> Firestore doc location
  exerciseToDoc: Map<string, { dayId: string; workoutDocId: string }>;
};

// ---------- provider ----------
export function WorkoutsProvider({ children }: { children: ReactNode }) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const uidRef = useRef<string | null>(null);
  const mapsRef = useRef<LocalMaps>({
    cardToSession: new Map(),
    exerciseToDoc: new Map(),
  });
  const unsubscribersRef = useRef<(() => void)[]>([]);

  // resubscribe whenever auth changes
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      uidRef.current = user?.uid ?? null;
      resubscribe();
    });
    return unsubAuth;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resubscribe = () => {
    // clear listeners & maps & local state
    unsubscribersRef.current.forEach((u) => u());
    unsubscribersRef.current = [];
    mapsRef.current.cardToSession.clear();
    mapsRef.current.exerciseToDoc.clear();
    setWorkouts([]);

    const uid = uidRef.current;
    if (!uid) return;

    const days = lastNDays(14);

    days.forEach((dayId) => {
      const workoutsCol = collection(
        db,
        "users",
        uid,
        "workoutDays",
        dayId,
        "workouts"
      );
      const qWorkouts = query(workoutsCol, orderBy("createdAt", "asc"));

      const unsub = onSnapshot(
        qWorkouts,
        async (snap) => {
          const bySession = new Map<string, Exercise[]>();
          const exDocs: { exId: string; createdAtISO: string }[] = [];

          // PASS 1: build exercise shells & group by createdAt
          snap.docs.forEach((d) => {
            const data = d.data() as {
              workoutType?: string;
              createdAt?: Timestamp;
              isSummary?: boolean;
            };

            // Ignore summary docs (from the Save button)
            if (data.isSummary) return;

            const createdAtISO =
              data.createdAt?.toDate?.().toISOString?.() ??
              new Date(`${dayId}T00:00:00`).toISOString();

            const exercise: Exercise = {
              id: d.id,
              name: data.workoutType || "Exercise",
              sets: [],
            };

            const list = bySession.get(createdAtISO) || [];
            list.push(exercise);
            bySession.set(createdAtISO, list);

            mapsRef.current.exerciseToDoc.set(d.id, {
              dayId,
              workoutDocId: d.id,
            });
            exDocs.push({ exId: d.id, createdAtISO });
          });

          // PASS 2: fetch sets for each exercise
          await Promise.all(
            exDocs.map(async ({ exId, createdAtISO }) => {
              const setsCol = collection(
                db,
                "users",
                uid,
                "workoutDays",
                dayId,
                "workouts",
                exId,
                "sets"
              );
              const qSets = query(setsCol, orderBy("setNumber", "asc"));
              const sSnap = await getDocs(qSets);

              const sets: SetItem[] = sSnap.docs.map((sd) => {
                const sdata = sd.data() as {
                  reps?: number;
                  weightLb?: number;
                  createdAt?: Timestamp;
                };
                return {
                  id: sd.id,
                  reps: sdata.reps ?? 0,
                  weight: sdata.weightLb ?? 0,
                  ts: sdata.createdAt
                    ? sdata.createdAt.toMillis()
                    : Date.now(),
                };
              });

              const list = bySession.get(createdAtISO) || [];
              const ex = list.find((e) => e.id === exId);
              if (ex) ex.sets = sets;
            })
          );

          // build Workout cards for this day
          const dayCards: Workout[] = Array.from(bySession.entries()).map(
            ([sessionISO, exercises]) => {
              mapsRef.current.cardToSession.set(sessionISO, sessionISO);
              return { id: sessionISO, dateISO: sessionISO, exercises };
            }
          );

          // merge into global list, wiping old cards for this day
          setWorkouts((prev) => {
            const keep = prev.filter(
              (w) => dayIdFromISO(w.dateISO) !== dayId
            );
            return [...keep, ...dayCards].sort((a, b) =>
              b.dateISO.localeCompare(a.dateISO)
            );
          });
        },
        (err) => {
          console.error("Workout day listener error", dayId, err);
        }
      );

      unsubscribersRef.current.push(unsub);
    });
  };

  // ---------- mutations ----------

  // New empty workout card (not yet persisted)
  const addWorkout = () => {
    const iso = nowISO();
    setWorkouts((prev) => [{ id: iso, dateISO: iso, exercises: [] }, ...prev]);
    mapsRef.current.cardToSession.set(iso, iso);
  };

  // Delete all exercises in the same session (createdAt)
  const deleteWorkout = async (workoutId: string) => {
    const uid = uidRef.current;
    if (!uid) {
      setWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
      return;
    }

    const sessionISO = mapsRef.current.cardToSession.get(workoutId) || workoutId;
    const dayId = dayIdFromISO(sessionISO);

    const workoutsCol = collection(
      db,
      "users",
      uid,
      "workoutDays",
      dayId,
      "workouts"
    );
    const qSameSession = query(
      workoutsCol,
      where("createdAt", "==", Timestamp.fromDate(new Date(sessionISO)))
    );
    const toDelete = await getDocs(qSameSession);

    await Promise.all(
      toDelete.docs.map((d) =>
        deleteDoc(
          doc(db, "users", uid, "workoutDays", dayId, "workouts", d.id)
        )
      )
    );

    setWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
    mapsRef.current.cardToSession.delete(workoutId);
  };

  // Add an exercise => create a workout doc with workoutType & createdAt
  const addExercise = async (workoutId: string, name: string) => {
    const uid = uidRef.current;
    const sessionISO =
      mapsRef.current.cardToSession.get(workoutId) ||
      workouts.find((w) => w.id === workoutId)?.dateISO ||
      nowISO();

    if (!uid) {
      // purely local fallback if not signed in
      setWorkouts((prev) =>
        prev.map((w) =>
          w.id === workoutId
            ? {
                ...w,
                exercises: [
                  ...w.exercises,
                  {
                    id: `${workoutId}-${Date.now()}`,
                    name,
                    sets: [],
                  },
                ],
              }
            : w
        )
      );
      return;
    }

    const dayId = dayIdFromISO(sessionISO);
    const workoutsCol = collection(
      db,
      "users",
      uid,
      "workoutDays",
      dayId,
      "workouts"
    );

    const added = await addDoc(workoutsCol, {
      workoutType: String(name || "Exercise"),
      createdAt: Timestamp.fromDate(new Date(sessionISO)),
      isSummary: false,
    });

    mapsRef.current.exerciseToDoc.set(added.id, {
      dayId,
      workoutDocId: added.id,
    });
    mapsRef.current.cardToSession.set(workoutId, sessionISO);
    // no local setWorkouts: snapshot will pull it in
  };

  const deleteExercise = async (workoutId: string, exerciseId: string) => {
    const uid = uidRef.current;

    if (!uid) {
      setWorkouts((prev) =>
        prev.map((w) =>
          w.id === workoutId
            ? {
                ...w,
                exercises: w.exercises.filter((e) => e.id !== exerciseId),
              }
            : w
        )
      );
      return;
    }

    const mapping = mapsRef.current.exerciseToDoc.get(exerciseId);
    const sessionISO =
      mapsRef.current.cardToSession.get(workoutId) ||
      workouts.find((w) => w.id === workoutId)?.dateISO ||
      nowISO();
    const dayId = mapping?.dayId || dayIdFromISO(sessionISO);
    const workoutDocId = mapping?.workoutDocId || exerciseId;

    await deleteDoc(
      doc(db, "users", uid, "workoutDays", dayId, "workouts", workoutDocId)
    );

    // local update for snappier UI
    setWorkouts((prev) =>
      prev.map((w) =>
        w.id === workoutId
          ? {
              ...w,
              exercises: w.exercises.filter((e) => e.id !== exerciseId),
            }
          : w
      )
    );
    mapsRef.current.exerciseToDoc.delete(exerciseId);
  };

  // Add a set under the exercise's /sets subcollection
  const addSet = async (
    workoutId: string,
    exerciseId: string,
    reps: number,
    weight: number
  ) => {
    const uid = uidRef.current;

    // not signed in -> only update local state
    if (!uid) {
      const ts = Date.now();
      setWorkouts((prev) =>
        prev.map((w) =>
          w.id === workoutId
            ? {
                ...w,
                exercises: w.exercises.map((e) =>
                  e.id === exerciseId
                    ? {
                        ...e,
                        sets: [
                          ...e.sets,
                          { id: `${exerciseId}-${ts}`, reps, weight, ts },
                        ],
                      }
                    : e
                ),
              }
            : w
        )
      );
      return;
    }

    // signed in -> write to Firestore + optimistic local update
    const mapping = mapsRef.current.exerciseToDoc.get(exerciseId);
    const sessionISO =
      mapsRef.current.cardToSession.get(workoutId) ||
      workouts.find((w) => w.id === workoutId)?.dateISO ||
      nowISO();
    const dayId = mapping?.dayId || dayIdFromISO(sessionISO);
    const workoutDocId = mapping?.workoutDocId || exerciseId;

    const current = workouts
      .find((w) => w.id === workoutId)
      ?.exercises.find((e) => e.id === exerciseId);
    const nextNumber = (current?.sets?.length ?? 0) + 1;

    const setsCol = collection(
      db,
      "users",
      uid,
      "workoutDays",
      dayId,
      "workouts",
      workoutDocId,
      "sets"
    );

    const added = await addDoc(setsCol, {
      setNumber: nextNumber,
      reps: Number.isFinite(reps) ? reps : 0,
      weightLb: Number.isFinite(weight) ? weight : 0,
      createdAt: serverTimestamp(),
    });

    const ts = Date.now();
    setWorkouts((prev) =>
      prev.map((w) =>
        w.id === workoutId
          ? {
              ...w,
              exercises: w.exercises.map((e) =>
                e.id === exerciseId
                  ? {
                      ...e,
                      sets: [...e.sets, { id: added.id, reps, weight, ts }],
                    }
                  : e
              ),
            }
          : w
      )
    );
  };

  const deleteSet = async (
    workoutId: string,
    exerciseId: string,
    setId: string
  ) => {
    const uid = uidRef.current;

    if (!uid) {
      setWorkouts((prev) =>
        prev.map((w) =>
          w.id === workoutId
            ? {
                ...w,
                exercises: w.exercises.map((e) =>
                  e.id === exerciseId
                    ? {
                        ...e,
                        sets: e.sets.filter((s) => s.id !== setId),
                      }
                    : e
                ),
              }
            : w
        )
      );
      return;
    }

    const mapping = mapsRef.current.exerciseToDoc.get(exerciseId);
    const sessionISO =
      mapsRef.current.cardToSession.get(workoutId) ||
      workouts.find((w) => w.id === workoutId)?.dateISO ||
      nowISO();
    const dayId = mapping?.dayId || dayIdFromISO(sessionISO);
    const workoutDocId = mapping?.workoutDocId || exerciseId;

    await deleteDoc(
      doc(
        db,
        "users",
        uid,
        "workoutDays",
        dayId,
        "workouts",
        workoutDocId,
        "sets",
        setId
      )
    );

    setWorkouts((prev) =>
      prev.map((w) =>
        w.id === workoutId
          ? {
              ...w,
              exercises: w.exercises.map((e) =>
                e.id === exerciseId
                  ? {
                      ...e,
                      sets: e.sets.filter((s) => s.id !== setId),
                    }
                  : e
              ),
            }
          : w
      )
    );
  };

  const value: WorkoutsContextValue = useMemo(
    () => ({
      workouts,
      addWorkout,
      deleteWorkout,
      addExercise,
      deleteExercise,
      addSet,
      deleteSet,
    }),
    [workouts]
  );

  return (
    <WorkoutsContext.Provider value={value}>
      {children}
    </WorkoutsContext.Provider>
  );
}

export function useWorkouts(): WorkoutsContextValue {
  const ctx = useContext(WorkoutsContext);
  if (!ctx) {
    throw new Error("useWorkouts must be used within WorkoutsProvider");
  }
  return ctx;
}





