import { Ionicons } from "@expo/vector-icons"; // For icons
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth"; // Import Firebase Auth
import { collection, doc, getDoc, getDocs, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"; // Import necessary components
import { db } from "../../firebase"; // Import Firestore instance from your firebaseConfig.js
import SettingsModal from "../settings_modal"; // Import the Settings Modal

const ORANGE = "#FF6A00";

const carouselItems = [
  {
    image: require("../../assets/images/runningAthlete.jpg"),
    label: "Start Run",
    key: "run",
  },
  {
    image: require("../../assets/images/trainingAthlete.jpg"),
    label: "Start Workout",
    key: "workout",
  },
  {
    image: require("../../assets/images/healthyFoodWoman.jpg"),
    label: "Track Nutrition",
    key: "nutrition",
  },
];

const ITEM_WIDTH = 300; // must match styles.carouselItem147.width
const ITEM_SPACING = 10; // marginHorizontal:5 on each side => 10 total
const SNAP_INTERVAL = ITEM_WIDTH + ITEM_SPACING;

export default function Home() {
  const router = useRouter();

  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false); // State for search modal
  const [searchInput, setSearchInput] = useState(""); // State for search input
  const [recentSearches, setRecentSearches] = useState<string[]>([]); // State for recent searches
  const [userName, setUserName] = useState("User"); // Default to "User"
  const [darkBg, setDarkBg] = useState<boolean>(true);

  // --- Run modal + timer state ---
  const [runModalVisible, setRunModalVisible] = useState(false);
  const [runTimerSec, setRunTimerSec] = useState(0);
  const [runTimerRunning, setRunTimerRunning] = useState(false);
  const runIntervalRef = useRef<NodeJS.Timer | null>(null);
  const [runDistanceMiles, setRunDistanceMiles] = useState<string>("");
  const [runDurationMinInput, setRunDurationMinInput] = useState<string>("");

  // --- Workout modal state ---
  const [workoutModalVisible, setWorkoutModalVisible] = useState(false);
  type WorkoutSet = { reps: number; weight: number };
  type WorkoutExercise = { id: string; name: string; nameSaved: boolean; sets: WorkoutSet[]; newSetReps: string; newSetWeight: string };
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);

  // --- Nutrition modal state ---
  const [nutritionModalVisible, setNutritionModalVisible] = useState(false);
  type MealDraft = { id: string; name: string; calories: string; protein: string; carbs: string; fats: string };
  const [meals, setMeals] = useState<MealDraft[]>([]);

  // --- Workout helpers ---
  // --- Nutrition helpers ---
  const addMeal = () => {
    setMeals((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), name: "", calories: "", protein: "", carbs: "", fats: "" },
    ]);
  };
  const updateMealField = (id: string, field: keyof MealDraft, value: string) => {
    setMeals((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };
  const removeMeal = (id: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
  };
  const resetNutritionState = () => {
    setMeals([]);
    setNutritionModalVisible(false);
  };
  const saveMealsToDb = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        alert("You must be signed in to save meals.");
        return;
      }
      // Validate and map meals
      const cleaned = meals
        .map((m) => ({
          mealName: m.name.trim(),
          calories: parseFloat(m.calories),
          protein: parseFloat(m.protein),
          carbs: parseFloat(m.carbs),
          fats: parseFloat(m.fats),
        }))
        .filter(
          (m) =>
            m.mealName.length > 0 &&
            [m.calories, m.protein, m.carbs, m.fats].every((x) => Number.isFinite(x) && x >= 0)
        );
      if (cleaned.length === 0) {
        alert("Add at least one valid meal with name and non-negative macros.");
        return;
      }
      const dayId = toDayId(new Date());
      for (const meal of cleaned) {
        const mealsCol = collection(db, "users", user.uid, "mealDays", dayId, "meals");
        const mealRef = doc(mealsCol);
        await setDoc(mealRef, {
          mealName: meal.mealName,
          calories: meal.calories,
          protein: meal.protein,
          fats: meal.fats,
          carbs: meal.carbs,
          createdAt: serverTimestamp(),
        });
      }
      // Refresh nutrition.current totals after saving meals
      await refreshNutritionCurrentForDay(user.uid, dayId);
      alert("Meals saved to your calendar day!");
      resetNutritionState();
    } catch (e) {
      console.error(e);
      alert("Failed to save meals. Check connection and rules.");
    }
  };

  // Helper to recompute and update users/{uid}.nutrition.current for a given day
  const refreshNutritionCurrentForDay = async (uid: string, dayId: string) => {
    // Sum today's meals and push into users/{uid}.nutrition.current
    const mealsCol = collection(db, "users", uid, "mealDays", dayId, "meals");
    const snap = await getDocs(mealsCol);
    let kcal = 0, protein = 0, carbs = 0, fats = 0;
    snap.forEach((d) => {
      const m: any = d.data();
      // tolerate strings, coerce to number
      kcal   += Number(m.calories) || 0;
      protein+= Number(m.protein)  || 0;
      carbs  += Number(m.carbs)    || 0;
      fats   += Number(m.fats)     || 0;
    });

    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      console.warn("User doc missing; cannot update nutrition.current");
      return;
    }

    // Merge new totals into existing document while preserving all required fields
    const existingData: any = userSnap.data() || {};
    const existingNutrition = existingData.nutrition || {};
    const updatedData = {
      ...existingData,
      nutrition: {
        ...existingNutrition,
        current: { kcal, protein, carbs, fats },
        // preserve target exactly as-is (rules require it to exist with numeric fields)
        ...(existingNutrition.target ? { target: existingNutrition.target } : {}),
      },
    };

    // Write back the full user document so validUserData() passes on update
    await setDoc(userRef, updatedData);
  };

  // Convenience function to update current nutrition for today for the signed-in user
  const updateCurrentNutritionNow = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        alert("You must be signed in to update nutrition.");
        return;
      }
      const dayId = toDayId(new Date());
      await refreshNutritionCurrentForDay(user.uid, dayId);
      alert("Current nutrition updated for today.");
    } catch (e) {
      console.error(e);
      alert("Failed to update current nutrition.");
    }
  };
  const addExercise = () => {
    setExercises((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        name: "",
        nameSaved: false,
        sets: [],
        newSetReps: "",
        newSetWeight: "",
      },
    ]);
  };
  const saveExerciseName = (id: string) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === id ? { ...ex, nameSaved: ex.name.trim() !== "" } : ex
      )
    );
  };
  const updateExerciseName = (id: string, name: string) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, name } : ex))
    );
  };
  const updateNewSetField = (
    id: string,
    field: "newSetReps" | "newSetWeight",
    value: string
  ) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === id ? { ...ex, [field]: value } as WorkoutExercise : ex
      )
    );
  };
  const addSetToExercise = (id: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== id) return ex;
        const reps = parseInt(ex.newSetReps, 10);
        const weight = parseFloat(ex.newSetWeight);
        if (!(reps > 0) || !(weight >= 0)) return ex;
        return {
          ...ex,
          sets: [...ex.sets, { reps, weight }],
          newSetReps: "",
          newSetWeight: "",
        };
      })
    );
  };
  const removeSet = (exId: string, setIndex: number) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exId
          ? { ...ex, sets: ex.sets.filter((_, i) => i !== setIndex) }
          : ex
      )
    );
  };
  const removeExercise = (id: string) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== id));
  };
  const resetWorkoutState = () => {
    setExercises([]);
    setWorkoutModalVisible(false);
  };
  const saveWorkoutToDb = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        alert("You must be signed in to save a workout.");
        return;
      }

      // Only keep exercises that have a saved name and at least one set
      const cleaned = exercises
        .filter((ex) => ex.nameSaved && ex.name.trim() !== "" && ex.sets.length > 0)
        .map((ex) => ({ name: ex.name.trim(), sets: ex.sets }));

      if (cleaned.length === 0) {
        alert("Add at least one exercise with sets.");
        return;
      }

      const dayId = toDayId(new Date());

      // For EACH exercise, create a workout doc under /users/{uid}/workoutDays/{dayId}/workouts
      // with fields: { workoutType: <exercise name>, createdAt },
      // then create child docs in /sets with fields: { setNumber, reps, weightLb, createdAt }
      for (const ex of cleaned) {
        const workoutsCol = collection(db, "users", user.uid, "workoutDays", dayId, "workouts");
        const workoutRef = doc(workoutsCol); // auto-id
        await setDoc(workoutRef, {
          workoutType: ex.name, // satisfies rules as string
          createdAt: serverTimestamp(),
        });

        // Write each set into the sets subcollection
        for (let i = 0; i < ex.sets.length; i++) {
          const s = ex.sets[i];
          const setsCol = collection(workoutRef, "sets");
          const setRef = doc(setsCol); // auto-id
          await setDoc(setRef, {
            setNumber: i + 1,
            reps: s.reps,
            weightLb: s.weight, // map UI "weight" to rules-required "weightLb"
            createdAt: serverTimestamp(),
          });
        }
      }

      alert("Workout saved to your calendar day!");
      resetWorkoutState();
    } catch (e) {
      console.error(e);
      alert("Failed to save workout. Check connection and rules.");
    }
  };

  const handleStartRun = () => {
    setRunModalVisible(true);
  };
  const handleStartWorkout = () => {
    setWorkoutModalVisible(true);
  };
  const handleTrackNutrition = () => {
    setNutritionModalVisible(true);
  };

  const handleSearchSubmit = () => {
    if (searchInput.trim() !== "") {
      setRecentSearches((prev) => [
        searchInput,
        ...prev.filter((item) => item !== searchInput),
      ]); // Add to recent searches, avoiding duplicates
      setSearchInput(""); // Clear the search input
    }
  };

  const startRunTimer = () => {
    if (runTimerRunning) return;
    setRunTimerRunning(true);
    runIntervalRef.current = setInterval(() => {
      setRunTimerSec((s) => s + 1);
    }, 1000);
  };
  const pauseRunTimer = () => {
    setRunTimerRunning(false);
    if (runIntervalRef.current) {
      clearInterval(runIntervalRef.current);
      runIntervalRef.current = null;
    }
  };
  const resetRunTimer = () => {
    pauseRunTimer();
    setRunTimerSec(0);
  };
  const formatHMS = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const hh = h.toString().padStart(2, "0");
    const mm = m.toString().padStart(2, "0");
    const ss = s.toString().padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };
  const useTimerForDuration = () => {
    setRunDurationMinInput(String(Math.round(runTimerSec / 60)));
  };
  const toDayId = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };
  const saveRunToDb = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        alert("You must be signed in to save a run.");
        return;
      }
      const distance = parseFloat(runDistanceMiles);
      // If duration input is blank, use timer minutes (rounded), else parse input as minutes
      const durationMin = runDurationMinInput.trim() !== "" ? parseInt(runDurationMinInput, 10) : Math.round(runTimerSec / 60);
      const durationSec = durationMin * 60;
      if (!(distance >= 0) || !(durationSec >= 0)) {
        alert("Enter a non-negative distance and duration.");
        return;
      }
      const dayId = toDayId(new Date());
      const runsCol = collection(db, "users", user.uid, "runDays", dayId, "runs");
      const runRef = doc(runsCol); // auto-id
      await setDoc(runRef, {
        distanceMiles: distance,
        durationSec: durationSec,
        createdAt: serverTimestamp(),
      });
      alert("Run saved to your calendar day!");
      setRunModalVisible(false);
    } catch (e) {
      console.error(e);
      alert("Failed to save run. Check connection and rules.");
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      setUserName("User");
      setDarkBg(true);
      return;
    }
    const userDocRef = doc(db, "users", user.uid);
    const unsub = onSnapshot(
      userDocRef,
      (snap) => {
        if (snap.exists()) {
          const data: any = snap.data();
          setUserName(data.name || "User");
          // Prefer `darkTheme` if present (matches rules), else fall back to legacy `darkBackground`
          const themeVal = (typeof data.darkTheme === 'boolean') ? data.darkTheme : Boolean(data.darkBackground);
          setDarkBg(themeVal);
        } else {
          setUserName("User");
          setDarkBg(true);
        }
      },
      (err) => {
        console.error("onSnapshot user doc error:", err);
      }
    );
    return () => unsub();
  }, []);

  return (
    <ScrollView style={[styles.container987, darkBg ? styles.bgDark : styles.bgLight]}>
      {runTimerRunning && (
        <View style={styles.runTimerBar}>
          <Text style={styles.runTimerBarText}>Run timer: {formatHMS(runTimerSec)}</Text>
        </View>
      )}
      <View style={[styles.headerRow654, darkBg ? styles.headerDark : styles.headerLight]}>
        <Text style={[styles.header321, darkBg ? styles.headerTextLight : styles.headerTextDark]}>
          Welcome, {userName}
        </Text>
        <View style={styles.headerButtons123}>
          <TouchableOpacity onPress={() => setSearchModalVisible(true)}>
            <Ionicons name="search" size={24} color={darkBg ? "#fff" : "#000"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSettingsModalVisible(true)}>
            <Ionicons name="settings-outline" size={24} color={darkBg ? "#fff" : "#000"} />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="start"
        disableIntervalMomentum
        contentContainerStyle={styles.carouselContent456}
        style={styles.carousel789}
      >
        {carouselItems.map((item, index) => (
          <View key={item.key} style={styles.carouselItem147}>
            <Image source={item.image} style={styles.carouselImage258} />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={item.label}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.carouselButton}
              onPress={
                index === 0
                  ? handleStartRun
                  : index === 1
                  ? handleStartWorkout
                  : handleTrackNutrition
              }
            >
              <Text style={styles.carouselButtonText}>{item.label}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      {/* Search Modal */}
      <Modal
        visible={searchModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.threeQuarterModalContent}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor="#888"
              value={searchInput}
              onChangeText={setSearchInput}
              onSubmitEditing={handleSearchSubmit} // Handle search submission
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSearchModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
            <View style={styles.recentSearchesContainer}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              {recentSearches.length > 0 ? (
                recentSearches.map((search, index) => (
                  <Text key={index} style={styles.recentSearchItem}>
                    {search}
                  </Text>
                ))
              ) : (
                <Text style={styles.noRecentSearches}>No recent searches</Text>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* Run Modal */}
      <Modal
        visible={runModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRunModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.runModalContent}>
            <Text style={styles.sectionTitle}>Track Run</Text>
            <View style={styles.timerRow}>
              <Text style={styles.timerDisplay}>{formatHMS(runTimerSec)}</Text>
              {!runTimerRunning ? (
                <TouchableOpacity style={[styles.smallBtn, { backgroundColor: ORANGE }]} onPress={startRunTimer}>
                  <Text style={styles.smallBtnText}>Start</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.smallBtn, { backgroundColor: "#555" }]} onPress={pauseRunTimer}>
                  <Text style={styles.smallBtnText}>Pause</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.smallBtn, { backgroundColor: "#333" }]} onPress={resetRunTimer}>
                <Text style={styles.smallBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 20 }} />
            <Text style={styles.inputLabel}>Distance (miles)</Text>
            <TextInput
              style={styles.searchInput}
              keyboardType="decimal-pad"
              placeholder="e.g., 3.10"
              placeholderTextColor="#888"
              value={runDistanceMiles}
              onChangeText={setRunDistanceMiles}
            />
            <Text style={styles.inputLabel}>Duration (minutes)</Text>
            <TextInput
              style={styles.searchInput}
              keyboardType="number-pad"
              placeholder="e.g., 31"
              placeholderTextColor="#888"
              value={runDurationMinInput}
              onChangeText={setRunDurationMinInput}
            />
            <TouchableOpacity style={styles.closeButton} onPress={saveRunToDb}>
              <Text style={styles.closeButtonText}>Save Run to Day</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.closeButton, { backgroundColor: "#333", marginTop: 8 }]} onPress={() => setRunModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* Workout Modal */}
      <Modal
        visible={workoutModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setWorkoutModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.runModalContent}>
            <Text style={styles.sectionTitle}>Start Workout</Text>
            <TouchableOpacity style={[styles.closeButton, { marginBottom: 12 }]} onPress={addExercise}>
              <Text style={styles.closeButtonText}>Add Exercise</Text>
            </TouchableOpacity>
            <ScrollView style={{ maxHeight: 350 }}>
              {exercises.length === 0 ? (
                <Text style={{ color: "#888" }}>No exercises yet. Tap "Add Exercise".</Text>
              ) : (
                exercises.map((ex, idx) => (
                  <View key={ex.id} style={{ borderColor: "#333", borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 }}>
                    <Text style={styles.inputLabel}>Exercise {idx + 1}</Text>
                    {!ex.nameSaved ? (
                      <>
                        <TextInput
                          style={styles.searchInput}
                          placeholder="Exercise name (e.g., Bench Press)"
                          placeholderTextColor="#888"
                          value={ex.name}
                          onChangeText={(t) => updateExerciseName(ex.id, t)}
                        />
                        <View style={{ flexDirection: "row", gap: 8 }}>
                          <TouchableOpacity style={[styles.smallBtn, { backgroundColor: ORANGE }]} onPress={() => saveExerciseName(ex.id)}>
                            <Text style={styles.smallBtnText}>Save Name</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.smallBtn, { backgroundColor: "#333" }]} onPress={() => removeExercise(ex.id)}>
                            <Text style={styles.smallBtnText}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    ) : (
                      <>
                        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>{ex.name}</Text>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                          <TextInput
                            style={[styles.searchInput, { flex: 1 }]}
                            placeholder="Reps"
                            placeholderTextColor="#888"
                            keyboardType="number-pad"
                            value={ex.newSetReps}
                            onChangeText={(t) => updateNewSetField(ex.id, "newSetReps", t)}
                          />
                          <TextInput
                            style={[styles.searchInput, { flex: 1 }]}
                            placeholder="Weight"
                            placeholderTextColor="#888"
                            keyboardType="decimal-pad"
                            value={ex.newSetWeight}
                            onChangeText={(t) => updateNewSetField(ex.id, "newSetWeight", t)}
                          />
                        </View>
                        <TouchableOpacity style={[styles.smallBtn, { backgroundColor: ORANGE, alignSelf: "flex-start" }]} onPress={() => addSetToExercise(ex.id)}>
                          <Text style={styles.smallBtnText}>Add Set</Text>
                        </TouchableOpacity>
                        {ex.sets.length > 0 && (
                          <View style={{ marginTop: 12 }}>
                            <Text style={styles.inputLabel}>Sets</Text>
                            {ex.sets.map((s, i) => (
                              <View key={i} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1a1a1a", padding: 10, borderRadius: 6, marginBottom: 8 }}>
                                <Text style={{ color: "#fff" }}>Set {i + 1}: {s.reps} reps @ {s.weight}</Text>
                                <TouchableOpacity style={[styles.smallBtn, { backgroundColor: "#333" }]} onPress={() => removeSet(ex.id, i)}>
                                  <Text style={styles.smallBtnText}>Remove</Text>
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
                        )}
                        <TouchableOpacity style={[styles.smallBtn, { backgroundColor: "#333", marginTop: 8 }]} onPress={() => removeExercise(ex.id)}>
                          <Text style={styles.smallBtnText}>Remove Exercise</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={saveWorkoutToDb}>
              <Text style={styles.closeButtonText}>Save Workout to Day</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.closeButton, { backgroundColor: "#333", marginTop: 8 }]} onPress={() => setWorkoutModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* Nutrition Modal */}
      <Modal
        visible={nutritionModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setNutritionModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.runModalContent}>
            <Text style={styles.sectionTitle}>Track Nutrition</Text>
            <TouchableOpacity style={[styles.closeButton, { marginBottom: 12 }]} onPress={addMeal}>
              <Text style={styles.closeButtonText}>Add Meal</Text>
            </TouchableOpacity>
            <ScrollView style={{ maxHeight: 350 }}>
              {meals.length === 0 ? (
                <Text style={{ color: "#888" }}>No meals yet. Tap "Add Meal".</Text>
              ) : (
                meals.map((m, idx) => (
                  <View key={m.id} style={{ borderColor: "#333", borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 }}>
                    <Text style={styles.inputLabel}>Meal {idx + 1}</Text>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Meal name (e.g., Grilled Chicken Bowl)"
                      placeholderTextColor="#888"
                      value={m.name}
                      onChangeText={(t) => updateMealField(m.id, "name", t)}
                    />
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TextInput
                        style={[styles.searchInput, { flex: 1 }]}
                        placeholder="Calories"
                        placeholderTextColor="#888"
                        keyboardType="decimal-pad"
                        value={m.calories}
                        onChangeText={(t) => updateMealField(m.id, "calories", t)}
                      />
                      <TextInput
                        style={[styles.searchInput, { flex: 1 }]}
                        placeholder="Protein (g)"
                        placeholderTextColor="#888"
                        keyboardType="decimal-pad"
                        value={m.protein}
                        onChangeText={(t) => updateMealField(m.id, "protein", t)}
                      />
                    </View>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TextInput
                        style={[styles.searchInput, { flex: 1 }]}
                        placeholder="Carbs (g)"
                        placeholderTextColor="#888"
                        keyboardType="decimal-pad"
                        value={m.carbs}
                        onChangeText={(t) => updateMealField(m.id, "carbs", t)}
                      />
                      <TextInput
                        style={[styles.searchInput, { flex: 1 }]}
                        placeholder="Fats (g)"
                        placeholderTextColor="#888"
                        keyboardType="decimal-pad"
                        value={m.fats}
                        onChangeText={(t) => updateMealField(m.id, "fats", t)}
                      />
                    </View>
                    <TouchableOpacity style={[styles.smallBtn, { backgroundColor: "#333", alignSelf: "flex-start" }]} onPress={() => removeMeal(m.id)}>
                      <Text style={styles.smallBtnText}>Remove Meal</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )} 
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={saveMealsToDb}>
              <Text style={styles.closeButtonText}>Save & Update Nutrition</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.closeButton, { backgroundColor: "#333", marginTop: 8 }]} onPress={() => setNutritionModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* Settings Modal */}
      <SettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container987: {
    flex: 1,
    backgroundColor: "#000",
  },
  headerRow654: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#1C2526",
  },
  runTimerBar: {
    width: "100%",
    backgroundColor: ORANGE,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  runTimerBarText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  header321: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  headerButtons123: {
    flexDirection: "row",
    gap: 15,
  },
  carousel789: {
    marginVertical: 10,
  },
  carouselContent456: {
    paddingHorizontal: 10,
  },
  carouselItem147: {
    width: 300,
    height: 220, // image + button
    borderRadius: 10,
    overflow: "hidden",
    marginHorizontal: 5,
    backgroundColor: "#111",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  carouselImage258: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  // New styles for carousel buttons
  carouselButton: {
    backgroundColor: ORANGE,
    width: 70,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    marginLeft: 8,
    borderRadius: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  carouselButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 10,
    textAlign: "center",
  },
  // Modal + search styles used by Search Modal
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
  },
  threeQuarterModalContent: {
    height: "75%", // Takes up 3/4 of the screen height
    backgroundColor: "#111", // Modal background color
    padding: 20,
    borderTopLeftRadius: 20, // Rounded top corners
    borderTopRightRadius: 20,
  },
  runModalContent: {
    width: "90%",
    backgroundColor: "#111",
    padding: 20,
    borderRadius: 12,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timerDisplay: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    flex: 1,
  },
  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  smallBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  miniLinkBtn: {
    marginTop: 6,
  },
  miniLinkText: {
    color: "#ccc",
    fontSize: 12,
    textDecorationLine: "underline",
  },
  inputLabel: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 6,
    marginTop: 8,
  },
  searchInput: {
    backgroundColor: "#222",
    color: "#fff",
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  closeButton: {
    backgroundColor: ORANGE,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  recentSearchesContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  recentSearchItem: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 8,
  },
  noRecentSearches: {
    color: "#888",
    fontSize: 14,
    fontStyle: "italic",
  },
  // Theme styles
  bgDark: { backgroundColor: "#000" },
  bgLight: { backgroundColor: "#fff" },
  headerDark: { backgroundColor: "#1C2526" },
  headerLight: { backgroundColor: "#f2f2f2" },
  headerTextLight: { color: "#fff" },
  headerTextDark: { color: "#000" },
});
