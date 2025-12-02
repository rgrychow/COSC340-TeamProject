// app/(tabs)/nutrition.tsx
import React, { useRef, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import Constants from "expo-constants";
import { Ring } from "../../components/nutrition-ring";
import DayCalendar from "../../components/day-calender"
import * as Haptics from "expo-haptics";
import { useNutrition } from "../../hooks/useNutrition";
import { getAuth } from "firebase/auth";
import { addEntry } from "lib/nutrition-store";
import { db } from "../../firebase"
import { addEntryToDay, dayKey, getDayLog, subscribeDayLog, MealEntry, addMealToDay, subscribeMacroTargets, updateTargets, Targets } from "../../lib/nutrition-store";
import { serverTimestamp } from "firebase/firestore"

const ORANGE = "#FF6A00";
//const USDA_API_KEY = Constants.expoConfig?.extra?.USDA_API_KEY;
const USDA_API_KEY = process.env.EXPO_PUBLIC_USDA_API_KEY;
const LIST_MAX = Math.min(420, Math.round(Dimensions.get("window").height * 0.5));
const MEAL_BASE = "https://themealdb.com/api/json/v1/1";

// Daily Targets (will update for user input when backend applied)
const TARGETS = { kcal: 2200, protein_g: 160, carbs_g: 220, fat_g: 70};

// USDA nutrient nums
const NUM = { kcal: "208", protein: "203", carbs: "205", fat: "204" };
const r1 = (x: number) => Math.round(x * 10) / 10;

// NutritionIX keys
const NIX_APP_ID = Constants.expoConfig?.extra?.NUTRITIONIX_APP_ID || "";
const NIX_APP_KEY = Constants.expoConfig?.extra?.NUTRITIONIX_APP_KEY || "";

function pickUSDA(nutrients: any[]) {
  const out = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  for (const n of nutrients || []) {
    const num = n?.nutrient?.number || n?.number;
    const amt = n?.amount ?? n?.value ?? 0;
    if (num === NUM.kcal) out.kcal = amt;
    if (num === NUM.protein) out.protein_g = amt;
    if (num === NUM.carbs) out.carbs_g = amt;
    if (num === NUM.fat_g) out.fat_g = amt;
  }
  return out;
}

function toEAN13(code: string) {
  const s = (code || "").trim();
  if (s.length === 12) return "0" + s;
  return s;
}

function scale(per100: any, grams: number) {
  return {
    kcal: (per100.kcal * grams) / 100,
    protein_g: (per100.protein_g * grams) / 100,
    carbs_g: (per100.carbs_g * grams) / 100,
    fat_g: (per100.fat_g * grams) / 100,
  };
}

function n(v: unknown) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function sumFrom(items: MealEntry[]) {
  return items.reduce(
    (acc, r) => ({
      kcal:      acc.kcal      + n(r.kcal),
      protein_g: acc.protein_g + n(r.protein_g),
      carbs_g:   acc.carbs_g   + n(r.carbs_g),
      fat_g:     acc.fat_g     + n(r.fat_g),
    }),
    { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );
}

function useDebounce(cb: (...args: any[]) => void, delay = 350) {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (...args: any[]) => {
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => cb(...args), delay);
  };
}

type LogEntry = {
  id: string;
  name: string;
  brand?: string | null;
  servings: number;
  gramsPerServing: number
  macros: { kcal: number; protein_g: number; carbs_g: number; fat_g: number };
  atISO: string;
};

function toDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === 'number') return new Date(val);
  if (typeof val === 'string') return new Date(val);
  if (typeof val === 'object' && ('seconds' in val)) {
    const ms = val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1e6);
    return new Date(ms);
  }
  return null;
}



export default function Nutrition() {
  const [q, setQ] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [items, setItems] = useState<Array<{ id: string; name: string; brand: string | null}>>([]);
  const [detail, setDetail] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // serving / consumption
  const [manualGramServing, setManualGramServing] = useState<string>("100"); // If USDA has now serving amt
  const [servingsCount, setServingsCount] = useState<string>("1");

  const [calendarMonth, setCalenderMonth] = useState<Date>(new Date());

  // Globals
  const { db, setTargets, targets, updateTargets, /*summary, setSummary,*/ loading, addEntry, /*selectedDayId,*/ setSelectedDate } = useNutrition();

  // Recipe Search state
  const [recipeQ, setRecipeQ] = useState("");
  const [recipes, setRecipes] = useState<any[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [recipesError, setRecipesError] = useState<string | null>(null);

  // scanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const [scanHeight, setScanHeight] = useState(0);

  const scanGate = useRef(false);
  const lineY = useRef(new Animated.Value(0)).current;

  const [entries, setEntries] = useState<MealEntry[]>([]);
  const auth = getAuth();
  const uid = auth.currentUser?.uid;
  //const dayId = dayKey(new Date());
  const dayId = new Date().toISOString().slice(0,10);

  //  const [targets, setTargets] = useState<Targets>({ kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0});
  //  const [targetsDraft, setTargetsDraft] = useState<MacroTargets>(targets);
  //  const [showTargetsModal, setShowTargetsModal] = useState(false);
  const [macroModalOpen, setMacroModalOpen] = useState(false);
  const [localTargets, setLocalTargets] = useState({ 
    kcal: String(targets?.kcal ?? 0),
    protein_g: String(targets?.protein_g ?? 0),
    carbs_g: String(targets?.carbs_g ?? 0),
    fat_g: String(targets?.carbs_g ?? 0), 
  });
  const [summary, setSummary] = useState<Summary>({
    kcal: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
  });
  const [selectedDayId, setSelectedDayId] = useState<String>(() => new Date().toISOString().slice(0, 10));

  // Edit 12/1
  useEffect(() => {
    if (targets) {
      setLocalTargets({
        kcal: Number(targets.kcal ?? 0),
        protein_g: Number(targets.protein_g ?? 0),
        carbs_g: Number(targets.carbs_g ?? 0),
        fat_g: Number(targets.fat_g ?? 0),
      });
    }
  }, [targets]);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    (async () => {
      try {
        const list = await getDayLog(db, uid, dayId);
        if (alive) setEntries(list);
      } catch (e) {
        console.log("[getDayLog] failed:", e);
      }
    })();
    return () => { alive = false; };
  }, [uid, dayId]);



  useEffect(() => {
    if (!scannerOpen) return;
    lineY.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(lineY, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(lineY, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scannerOpen]);

/*
  useEffect(() => {
    if(!uid) return;
    const off = subscribeDayLog(db, uid, selectedDayId, (items) => {
      setEntries(items);
      setSummary(sumFrom(items));
    });
    return off;
  }, [db, uid, selectedDayId]);
*/
  useEffect(() => {
    if (!uid) return;

    getDayLog(db, uid, selectedDayId).then((items) => {
      setEntries(items);
      setSummary(sumFrom(items));
    });

    const off = subscribeDayLog(db, uid, selectedDayId, (items) => {
      setEntries(items);
      setSummary(sumFrom(items));
    })
    return off;
  }, [db, uid, selectedDayId]);

  /*
  const handleOpenTargets = () => {
    setTargetsDraft(targets);
    setShowTargetsModal(true);
  };

  const handleSaveTargets = async () => {
    if (!db || !uid) return;
    await updateMacroTargets(db, uid, targetsDraft);
    setShowTargetsModal(false);
  };
*/
  const onChangeNum = (field: "kcal"|"protein_g"|"carbs_g"|"fat_g") => (t: string) => {
    const v = t.trim() == "" ? 0 : Number(t.replace(/[^0-9.]/g, ""));
    setLocalTargets((prev) => ({ ...prev, [field]: isFinite(v) ? v : 0 }));
  };
  const closeMacroModal = () => { setMacroModalOpen(false); Keyboard.dismiss(); };
/*
  const saveMacroTargets = async () => {
    await updateTargets(db, uid, localTargets);
    closeMacroModal();
  };
*/
  const onChangeLocal = (key: "kcal"|"protein_g"|"carbs_g"|"fat_g") =>
    (txt: string) => setLocalTargets((p) => ({ ...p, [key]: txt.replace(/[^0-9.]/g, "") }));
  const onSaveTargets = async () => {
    const next = {
      lcal: Number(localTargets.kcal) || 0,
      protein_g: Number(localTargets.protein_g) || 0,
      carbs_g: Number(localTargets.carbs_g) || 0,
      fat_g: Number(localTargets.fat_g) || 0,
    };
    setTargets(next);
    try {
      await updateTargets(db, uid!, next);
    } catch (e) {
      console.warn("updateTargets failed:", e);
    }
    setMacroModalOpen(false);
  };

  // Animated add button
  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
  const btnScale = useRef(new Animated.Value(1)).current;

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  const goals = targets ?? { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  const day = summary ?? { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };

  // ask for camera permission
  const openScanner = async () => {
    if (!permission || !permission.granted) {
      await requestPermission();
    }
    setScannerOpen(true);
  };

  // Barcode Scan Function
  async function fetchOpenFoodFactsUPC(raw: string) {
    const ean = toEAN13(raw);

    const url =
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(ean)}.json`;

    const r = await fetch(url);
    if (!r.ok) throw new Error(`Open Food Facts ${r.status}`);
    const j = await r.json();

    const p = j?.product;
    if (!p) throw new Error("Product not found");

    // --- basic identity ---
    const name =
      p.product_name_en ||
        p.product_name ||
        p.generic_name_en ||
        "Scanned Item";
    const brand = (p.brands || "").split(",")[0]?.trim() || null;

    // --- serving meta (label + grams if available) ---
    let servingGrams: number | undefined;
    if (typeof p.serving_quantity === "number") {
      servingGrams = p.serving_quantity;
    } else if (typeof p.serving_size === "string") {
      // e.g., "30 g", "2 oz (56 g)"
      const m = p.serving_size.match(/(\d+(?:\.\d+)?)\s*g/i);
      if (m) servingGrams = Number(m[1]);
    }
    const serving =
      servingGrams && Number.isFinite(servingGrams)
        ? { label: p.serving_size || "serving", grams: servingGrams }
        : null;

    // --- nutrients map from OFF ---
    const n: Record<string, any> = p.nutriments || {};

    const fromKJ = (kj: any) =>
      Number.isFinite(kj) ? Number(kj) / 4.184 : undefined;
    const num = (v: any) => (Number.isFinite(v) ? Number(v) : undefined);

    // --- per 100g (kept for your UI, but not used to scale here) ---
    const kcal100 =
      num(n["energy-kcal_100g"]) ??
        fromKJ(num(n["energy_100g"]));
    const protein100 = num(n["proteins_100g"]) ?? 0;
    const carbs100   = num(n["carbohydrates_100g"]) ?? 0;
    const fat100     = num(n["fat_100g"]) ?? 0;

    const per100 = {
      kcal: Math.max(0, kcal100 ?? 0),
      protein_g: Math.max(0, protein100),
      carbs_g: Math.max(0, carbs100),
      fat_g: Math.max(0, fat100),
    };

    // --- native per-serving macros (NO SCALING) ---
    const kcalServing =
      num(n["energy-kcal_serving"]) ??
        fromKJ(num(n["energy_serving"]));
    const proteinServing = num(n["proteins_serving"]);
    const carbsServing   = num(n["carbohydrates_serving"]);
    const fatServing     = num(n["fat_serving"]);

    // Only return macros if all four are present as numbers
    const hasAllServing =
    [kcalServing, proteinServing, carbsServing, fatServing].every(
      (v) => typeof v === "number"
    );

    const servingMacros = hasAllServing
      ? {
        kcal: Math.max(0, kcalServing as number),
        protein_g: Math.max(0, proteinServing as number),
        carbs_g: Math.max(0, carbsServing as number),
        fat_g: Math.max(0, fatServing as number),
      }
      : undefined;

    return {
      id: String(p.code || ean),
      name,
      brand,
      per100,          // for reference/backup in your UI
      serving,         // label + grams if OFF provided them
      servingMacros, // EXACT per-serving values from OFF; undefined if missing
      isPerServingFinal: !!servingMacros,
    };
  }

  const onUPCScanned = async ({ data }: { data: string }) => {
    if (scanGate.current) return;
    scanGate.current = true;
    setTimeout(() => (scanGate.current = false), 1200);

    try {
      // Success Buzz
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setSearchLoading(true);
      setError(null);

      const d = await fetchOpenFoodFactsUPC(data);

      setDetail({
        id: String(d.id),
        name: d.name,
        brand: d.brand ?? null,
        per100: d.per100,
        serving: d.serving ?? null,
        servingMaros: d.servingMacros ?? null,
        isScanned: true,
      });

      setServingsCount("1");
      setManualGramServing("");

    } catch (e: any) {
      setError(e.message || "Scan failed");
    } finally {
      setSearchLoading(false);
      setScannerOpen(false);
    }
  }; 

  // Recipe helpers
  const cleanParts = (s: string) => s.split(",").map(p => p.trim()).filter(Boolean);
  type MealItem = { idMeal: string; strMeal: string; strMealThumb: string };

  async function fetchMealsForIngredient(ingredient: string): Promise<MealItem[]> {
    const url = `${MEAL_BASE}/filter.php?i=${encodeURIComponent(ingredient)}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Meal filter ${r.status}`);
    const j = await r.json();
    return (j.meals || []) as MealItem[];
  }

  function intersectById(arrays: MealItem[][]): MealItem[] {
    if (!arrays.length) return [];
    const idSets = arrays.map(a => new Set(a.map(m => m.idMeal)));
    const first = arrays[0];
    return first.filter(m => idSets.every(set => set.has(m.idMeal)));
  }

  async function fetchMealDetail(idMeal: string) {
    const r = await fetch(`${MEAL_BASE}/lookup.php?i=${idMeal}`);
    if (!r.ok) throw new Error(`Meal detail ${r.status}`);
    const j = await r.json();
    return (j.meals && j.meals[0]) || null;
  }

  async function openMealLink(idMeal: string) {
    try {
      const d = await fetchMealDetail(idMeal);
      const url = d?.strSource || d?.strYoutube || null;
      if (url) await Linking.openURL(url);
    } catch {}
  }

  // Recipe Search Func
  const searchRecipes = async () => {
    setRecipesError(null);
    setRecipes([]);
    const parts = cleanParts(recipeQ.toLowerCase());
    if (!parts.length) return;

    setRecipesLoading(true);
    try {
      const lists = await Promise.all(parts.map(fetchMealsForIngredient));
      const common = intersectById(lists).slice(0, 5);
      setRecipes(common);
    } catch (e: any) {
      setRecipesError(e.message || "Recipe search failed");
    } finally {
      setRecipesLoading(false);
    }
  };


  const pulse = () => {
    btnScale.setValue(1);
    Animated.sequence([
      Animated.spring(btnScale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
  };

  const handleAdd = () => {
    addToDaily(); 
    pulse();
  };

  const search = useDebounce(async (text: string) => {
    setError(null);
    setDetail(null);
    if (!text.trim()) {
      setItems([]);
      return;
    }

    if (!USDA_API_KEY) {
      setError("Missing USDA_API_KEY");
      return;
    }

    setSearchLoading(true);
    try {
      const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
      url.searchParams.set("query", q);
      url.searchParams.set("pageSize", "20");

      //const r = await fetch(url.toString());
      const r = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "X-Api-Key": String(USDA_API_KEY ?? ""),
          "Accept": "application/json",
        },
      });

      if (!r.ok) throw new Error(`USDA search ${r.status}`);

      const data = await r.json();
      const list = (data.foods || []).map((f: any) => ({
        id: String(f.fdcId),
        name: f.description,
        brand: f.brandOwner || null,
      }));
      setItems(list);
    } catch (e: any) {
      setError(e.message || "Search failed");
      setItems([]);
    } finally {
      setSearchLoading(false);
    }
  }, 350);

  const onChange = (text: string) => {
    setQ(text);
    search(text);
  };

  const openDetail = async (fdcId: String) => {
    if (!USDA_API_KEY) {
      setError("Missing USDA_API_KEY");
      return;
    }
    setSearchLoading(true);
    setError(null);
    try {
      const u = `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${USDA_API_KEY}`;
      const r = await fetch(u);
      if (!r.ok) throw new Error(`USDA detail ${r.status}`);
      const d = await r.json();

      const per100 = pickUSDA(d.foodNutrients || []);
      const portion = (d.foodPortions || []).find((p: any) => p.gramWeight) || null;
      const serving = portion 
        ? { 
          label: portion.portionDescription || portion.modifier || "serving",
          grams: portion.gramWeight,
        }
        : null;

      setDetail({
        id: String(d.fdcId),
        name: d.description,
        brand: d.brandOwner || null,
        per100,
        serving,
      });

      setServingsCount("1");
      if (!serving) setManualGramServing("100");
    } catch (e: any) {
      setError(e.message || "Failed to load detail");
    } finally {
      setSearchLoading(false);
    }
  };

  // Determine macros per serving
  let macrosPerServing;
  let gramsPerServing;

  let hasServing = false;

  if (detail?.isScanned && detail?.servingMacros) {
    // We have final per-serving macros - use them directly, no calculation needed
    macrosPerServing = detail.servingMacros;
    gramsPerServing = detail.serving?.grams || 0; // Just for display
  } else {
    // Calculate from per100
    hasServing = !!detail?.serving;
    gramsPerServing = hasServing
      ? detail.serving.grams
      : Math.max(1, parseFloat(manualGramServing) || 0);

    macrosPerServing = detail && gramsPerServing 
      ? scale(detail.per100, gramsPerServing) 
      : { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0};
  }

  const servingsN = Math.max(0, parseFloat(servingsCount) || 0);
  const macrosThisEntry = {
    kcal: macrosPerServing.kcal * servingsN, 
    protein_g: macrosPerServing.protein_g * servingsN, 
    carbs_g: macrosPerServing.carbs_g * servingsN, 
    fat_g: macrosPerServing.fat_g * servingsN, 
  };

  const addToDaily = async () => {
    if (!detail) return;

    const servings = Number.isFinite(parseFloat(servingsCount))
      ? parseFloat(servingsCount)
      : 1;

    const gramPerServing = typeof detail.serving?.grams === "number"
      ? detail.serving!.grams
      : null;

    const entry = {
      name: detail.name,
      brand: detail.brand ?? null,
      kcal: Number(macrosThisEntry.kcal) || 0,
      protein_g: Number(macrosThisEntry.protein_g) || 0,
      carbs_g: Number(macrosThisEntry.carbs_g) || 0,
      fat_g:Number( macrosThisEntry.fat_g) || 0,
      grams: Number(detail.serving?.grams ?? manualGramServing ?? 0) || 0,
      servings: Number(servingsCount) || 1,
    };

    await addMealToDay(db, uid, dayId, entry);

    /*
    const t = targets ?? { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, water_oz: 0 };
    const dayTargets = {
      target_kcal: Number(t.kcal) || 0,
      target_protein_g: Number(t.protein_g) || 0,
      target_carbs_g: Number(t.carbs_g) || 0,
      target_fat_g: Number(t.fat_g) || 0,
      target_water_oz: 0,
    };

    try {
      const temp = {
        id: `temp-${Date.now()}`,
        ...entry,
        createdAt: { toDate: () => new Date() },
      };

      setEntries((prev) => [temp, ...prev]);

      await addEntryToDay({
        db, uid, dayId,
        entry,
        targets: dayTargets,
        water_oz: 0,
      });

      setDetail(null);
      setServingsCount("1");
      setManualGramServing("100");
    } catch (e: any) {
      setError(e?.message ?? "Failed to add to daily log");
    }
    */

    setDetail(null);
    setServingsCount("1");
    setManualGramServing("100");
  };

  const ResultRow = ({ item }: any) => (
    <Pressable style={styles.row} onPress={() => openDetail(item.id)}>
      <Text style={styles.item}>- {item.name}</Text>
      {!!item.brand && <Text style={styles.subItem}>{item.brand}</Text>}
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollBody}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          <View>
            <Text style={styles.header}>Nutrition</Text>


            {/* Daily Intake RINGS*/}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Daily Intake</Text>

              <View style={{ alignItems: "center", marginTop: 6, marginBottom: 10 }}>
                <Ring
                  size={120}
                  stroke={12}
                  value={Number(summary?.kcal ?? 0)}
                  target={Number(targets?.kcal ?? 0)}
                  color="#FF6A00"
                  label="Calories"
                  sublabel={`${Math.round(day.kcal)} / ${goals.kcal} kcal`}
                />
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 6 }}>
                <Ring
                  size={92}
                  value={Number(summary?.protein_g ?? 0)}
                  target={Number(targets?.protein_g ?? 0)}
                  color="#7abaff"
                  label="Protein"
                  sublabel={`${Math.round(day.protein_g)} / ${goals.protein_g} g`}
                />
                <Ring
                  size={92}
                  value={Number(summary?.carbs_g ?? 0)}
                  target={Number(targets?.carbs_g ?? 0)}
                  color="#9BE37D"
                  label="Carbs"
                  sublabel={`${Math.round(day.carbs_g)} / ${goals.carbs_g} g`}
                />
                <Ring
                  size={92}
                  value={Number(summary?.fat_g ?? 0)}
                  target={Number(targets?.fat_g ?? 0)}
                  color="#F6C945"
                  label="Fats"
                  sublabel={`${Math.round(day.fat_g)} / ${goals.fat_g} g`}
                />
              </View>
            </View>


            {/* Search */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Search Foods</Text>

              {/* Text Entry*/}
              <TextInput
                value={q}
                onChangeText={(t) => {
                  setQ(t);
                  search(t);
                }}
                placeholder="e.g., chicken breast"
                placeholderTextColor="#777"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                style={styles.input}
              />

              {/* OR divider */}
              <View style={styles.orRow}>
                <View style={styles.orLine} />
                <Text styles={styles.orText}>OR</Text>
                <View style={styles.orLine} />
              </View>

              {/* Scan Button */}
              <Pressable onPress={openScanner} style={styles.scanBtn}>
                <Text style={styles.scanBtnText}>ScanBarcode</Text>
              </Pressable>

              {loading && <ActivityIndicator style={{ marginTop: 10}} />}
              {error && <Text style={styles.error}>- {error}</Text>}
            </View>

            {/* Results Card / Detail Card*/}
            {!detail ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Results</Text>

                {items.length === 0 ? (
                  <Text style={styles.item}>- Start typing to search</Text>
                ) : (
                    <ScrollView
                      style={{ maxHeight: LIST_MAX }}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator
                      contentContainerStyle={{ paddingBottom: 6}}
                    >
                      {items.map((item) => (
                        <Pressable key={item.id} style={styles.row} onPress={() => openDetail(item.id)}>
                          <Text style={styles.item}>- {item.name}</Text>
                          {!!item.brand && <Text style={styles.subItem}>{item.brand}</Text>}
                        </Pressable>
                      ))}
                    </ScrollView>
                  )}
              </View>
            ) : (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Food Detail</Text>
                  <Text style={styles.item}>- {detail.name}</Text>
                  {detail.brand && <Text style={styles.subItem}>{detail.brand}</Text>}

                  {/* Serving Picker*/}
                  <View style={styles.block}>
                    {detail?.isScanned ? (
                      <Text style={styles.subItem}>
                        Serving: {detail.serving?.label || "1 serving"}
                        {detail.serving?.grams ? ` (${detail.serving.grams}g)` : ""}
                      </Text>
                    ) : hasServing ? (
                        <Text style={styles.subItem}>
                          Serving: {detail.serving.label} = {detail.serving.grams} g
                        </Text>
                      ) : (
                          <View style={{ marginTop: 4 }}>
                            <Text style={styles.subItem}>Serving (grams):</Text>
                            <TextInput
                              style={styles.inputSm}
                              inputMode="numeric"
                              value={manualGramServing}
                              onChangeText={(t) => setManualGramServing(t.replace(/[^0-9.]/g, ""))}
                              placeholder="grams"
                              placeholderTextColor="#777"
                            />
                          </View>
                        )}

                    {/* Per-serving macros*/}
                    <Text style={[styles.item, { marginTop: 8 }]}>Per serving</Text>
                    <Text style={styles.subItem}>
                      kcal: {r1(macrosPerServing.kcal)} | P: {r1(macrosPerServing.protein_g)} g | C:{" "} 
                      {r1(macrosPerServing.carbs_g)} g | F: {r1(macrosPerServing.fat_g)} g
                    </Text>

                    {/* How Many Servings?*/}
                    <View style={{ marginTop: 8 }}>
                      <Text style={styles.subItem}>Servings consumed:</Text>
                      <TextInput
                        style={styles.inputSm}
                        keyboardType={Platform.OS === "ios" ? "deciaml-pad" : "numeric"}
                        value={servingsCount}
                        onChangeText={(t) => {
                          const cleaned = t
                          .replace(/,/g, ".")
                          .replace(/[^0-9.]/g, "")
                          .replace(/(\..*)\./, "$1");
                          setServingsCount(cleaned);
                        }}
                        placeholder="e.g., 1.5"
                        placeholderTextColor="#777"
                        returnKeyType="done"
                      />
                      <Text style={styles.subItem}>
                        This entry total -- kcal: {r1(macrosThisEntry.kcal)} | P:{" "}
                        {r1(macrosThisEntry.protein_g)} g | C: {r1(macrosThisEntry.carbs_g)} g | F:{" "}
                        {r1(macrosThisEntry.fat_g)} g
                      </Text>
                    </View>
                  </View>

                  {/*Add to Daily Button*/}
                  <Pressable
                    onPress={handleAdd}
                    style={({ pressed }) => [
                      styles.addBtn,
                      pressed && styles.addBtnPressed,
                    ]}
                  >
                    <Animated.View style={{ transform: [{ scale: btnScale }] }}>
                      <Text style={styles.addText}>+ Add to Daily Total</Text>
                    </Animated.View>
                  </Pressable>

                  <Pressable onPress={() => setDetail(null)} style={{ marginTop: 10 }}>
                    <Text style={[styles.item, { color: "#7abaff" }]}>Back to Results</Text>
                  </Pressable>
                </View>
              )}

            {/*Daily Log*/}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Daily Log</Text>

              {entries.length === 0 ? (
                <Text style={styles.subItem}>No entries yet.</Text>
              ) : (
                  <ScrollView
                    style={{ maxHeight: LIST_MAX }}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 6 }}
                  >
                    {entries.map((item: any, idx: number) => {
                      const key = item.id ?? item.entryId ?? item.docId ?? (item.name && item.createdAt ? `${item.name}-${String(item.createdAt)}` : undefined) ?? String(idx);
                      return (
                        <View key={item.id} style={{ marginBottom: 8}}>
                          <Text style={styles.item}>
                            - {item.name}{item.brand ? ` - ${item.brand}` : ""}
                          </Text>
                          <Text style={styles.subItem}>
                            kcal: {Math.round(item.kcal)} | P: {Math.round(item.protein_g)} g | C: {Math.round(item.carbs_g)} g | F: {Math.round(item.fat_g)} g
                          </Text>
                          <Text style={[styles.subItem, { fontSize: 12, opacity: 0.7 }]}>
                            {item.createdAt?.seconds
                              ? new Date(item.createdAt.seconds * 1000).toLocaleTimeString()
                              : "-"}
                          </Text>
                        </View> 
                      );
                    })}
                  </ScrollView>
                )}
            </View>

            {/* Recipes */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Recipes</Text>

              <Text style={styles.subItem}>Enter ingredients (comma seperated):</Text>
              <TextInput
                style={styles.input}
                value={recipeQ}
                onChangeText={setRecipeQ}
                placeholder="e.g., chicken, rice"
                placeholderTextColor="#777"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={searchRecipes}
              />

              <Pressable onPress={searchRecipes} style={[styles.addBtn, { marginTop: 10 }]}>
                <Text style={styles.addText}>Search Recipes</Text>
              </Pressable>

              {recipesLoading && <ActivityIndicator style={{ marginTop: 10 }} />}
              {recipesError && <Text style={styles.error}>- {recipesError}</Text>}

              {!recipesLoading && !recipesError && recipes.length > 0 && (
                <ScrollView
                  style={{ maxHeight: LIST_MAX, marginTop: 10 }}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                  keyboardShouldPersistTaps="handled"
                >
                  {recipes.map((m) => (
                    <Pressable
                      key={m.idMeal}
                      onPress={() => openMealLink(m.idMeal)}
                      style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8 }}
                    >
                      <View
                        style={{
                          width: 56, height: 56, borderRadius: 8, overflow: "hidden",
                          backgronfColor: "#222", marginRight: 10,
                        }}
                      >
                        <View
                          style={{
                            flex: 1,
                            backgroundColor: "#222"
                          }}
                        />
                      </View>
                      <View style={{ flex: 1}}>
                        <Text style={styles.item}>- {m.strMeal}</Text>
                        <Text style={[styles.subItem, { fintSize: 12}]}>Tap to View Recipe</Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              {!recipesLoading && !recipesError && recipes.length === 0 && (
                <Text style={styles.subItem}>&nbsp;</Text>
              )}
            </View>
            <TouchableOpacity 
              style={{
                marginTop: 16,
                marginBottom: 24,
                backgroundColor: ORANGE,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
              }}
              onPress={() => setMacroModalOpen(true)}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>Update Macros</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Scanner Overlay */}
        {scannerOpen && (
          <View style={styles.scanOverlay}>
            {permission && !permission.granted ? (
              <View style={styles.scanInner}>
                <Text style={styles.item}>Camera permission required.</Text>
                <Pressable onPress={requestPermission} style={[styles.addBtn, { marginTop: 10 }]}>
                  <Text style={styles.addText}>Grant Permission</Text>
                </Pressable>
                <Pressable onPress={() => setScannerOpen(false)} style={[styles.addBtn, { marginTop: 10 }]}>
                  <Text style={styles.addText}>Cancel</Text>
                </Pressable>
              </View>
            ) : (
                <View style={styles.scanInner}>
                  <Text style={styles.cardTitle}>Scan a UPC</Text>
                  <View 
                    style={styles.scanFrame}
                    onLayout={(e) => setScanHeight(e.nativeEvent.layout.height)}
                  >
                    <CameraView
                      style={{ width: "100%", height: "100%" }}
                      barcodeScannerSettings={{
                        barcodeTypes: ["ean13", "upc_a", "upc_e"],
                      }}
                      onBarcodeScanned={({ data }) => onUPCScanned({ data })}
                    />
                    {/* dim mask at the edges to highlight the center */}
                    <View pointerEvents="none" style={styles.maskTop} />
                    <View pointerEvents="none" style={styles.maskBottom} />
                    <View pointerEvents="none" style={styles.maskLeft} />
                    <View pointerEvents="none" style={styles.maskRight} />

                    {/* Orange Corner Brackets */}
                    <View pointerEvents="none" style={[styles.corner, styles.cornerTL]} />
                    <View pointerEvents="none" style={[styles.corner, styles.cornerTR]} />
                    <View pointerEvents="none" style={[styles.corner, styles.cornerBL]} />
                    <View pointerEvents="none" style={[styles.corner, styles.cornerBR]} />

                    {/* Animated Scan Line */}
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.scanLine,
                        {
                          transform: [
                            {
                              translateY: lineY.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, Math.max(0, scanHeight - 32)],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                  </View>
                  <Pressable onPress={() => setScannerOpen(false)} style={[styles.addBtn, { marginTop: 10 }]}>
                    <Text style={styles.addText}>Cancel</Text>
                  </Pressable>
                </View>
              )}
          </View>
        )}


        <Modal
          visible={macroModalOpen}
          animationType="slide"
          transparent
          onRequestClose={closeMacroModal}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.35)",
              justifyContent: "flex-end",
            }}>
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.select({ ios: 90, android: 0 }) as number}
              >
                <View style={{
                  backgroundColor: "#111",
                  paddingHorizontal: 16,
                  paddingTop: 16,
                  paddingBottom: 24,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  maxHeight: "80%",
                }}>
                  {/* Header row with close */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>Edit Macro Targets</Text>
                    <TouchableOpacity onPress={closeMacroModal} hitSlop={{top:10,left:10,right:10,bottom:10}}>
                      <Text style={{ color: "#fff", fontSize: 18 }}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
                    {/* Current values hint */}
                    <Text style={{ color: "#aaa", marginBottom: 8 }}>
                      Current: kcal {targets?.kcal ?? 0} · P {targets?.protein ?? 0} · C {targets?.carbs ?? 0} · F {targets?.fats ?? 0}
                    </Text>

                    {/* Inputs */}
                    {[
                      { label: "Calories (kcal)", key: "kcal" as const },
                      { label: "Protein (g)", key: "protein" as const },
                      { label: "Carbs (g)", key: "carbs" as const },
                      { label: "Fats (g)", key: "fats" as const },
                    ].map((f) => (
                        <View key={f.key} style={{ marginBottom: 12 }}>
                          <Text style={{ color: "#ddd", marginBottom: 6 }}>{f.label}</Text>
                          <TextInput
                            style={{
                              borderWidth: 1,
                              borderColor: "#333",
                              borderRadius: 10,
                              paddingHorizontal: 12,
                              paddingVertical: 10,
                              color: "#fff",
                            }}
                            inputMode="decimal"
                            keyboardType="numeric"
                            returnKeyType="done"
                            value={String(localTargets[f.key] ?? "")}
                            onChangeText={onChangeLocal(f.key)}
                            onSubmitEditing={Keyboard.dismiss}
                          />
                        </View>
                      ))}

                    {/* Actions */}
                    <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                      <TouchableOpacity
                        style={{ flex: 1, backgroundColor: "#2a2a2a", paddingVertical: 12, borderRadius: 10, alignItems: "center" }}
                        onPress={closeMacroModal}
                      >
                        <Text style={{ color: "#fff", fontWeight: "600" }}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{ flex: 1, backgroundColor: ORANGE, paddingVertical: 12, borderRadius: 10, alignItems: "center" }}
                        onPress={onSaveTargets}
                      >
                        <Text style={{ color: "#fff", fontWeight: "700" }}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </Modal>


      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  scrollBody: { padding: 20, paddingBottom: 40 },

  header: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 12,
  },

  card: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f1f1f",
    marginBottom: 16,
  },
  cardTitle: { color: ORANGE, fontWeight: "800", marginBottom: 8, fontSize: 16},

  item: { color: "#eee", marginTop: 2, fontSize: 14 },
  subItem: { color: "#bdbdbd", marginTop: 2, fontSize: 13 },

  input: {
    backgroundColor: "#0e0e0e",
    borderColor: "#1f1f1f",
    borderWidth: 1,
    color: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
  },
  inputSm: {
    backgroundColor: "#0e0e0e",
    borderColor: "#1f1f1f",
    borderWidth: 1,
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 6,
    width: 120,
  },

  sep: { height: 8 },
  block: { marginTop: 8, marginBottom: 8 },

  error: { color: "#ff6b6b", marginTop: 8, fontSize: 13 },

  addBtn: {
    backgroundColor: ORANGE,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    marginTop: 10,
  },
  addText: { color: "#000", fontWeight: "800" },

  barTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#222",
    overflow: "hidden",
    marginTop: 6,
    marginBottom: 8,
  },
  barFill: {height: 8, backgroundColor: ORANGE },
  addBtnPressed: { backgroundColor: "#e05f00"},

  orRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
    marginBottom: 6,
  },
  orLine: { flex: 1, height: 1, backgroundColor: "#1f1f1f" },
  orText: { color: "#777", fontSize: 12, fontWeight: "700" },

  scanBtn: {
    backgroundColor: ORANGE,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  scanBtnText: { color: "#000", fontWeight: "800" },

  scanOverlay: {
    position: "absolute",
    left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  scanInner: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#111",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f1f1f",
    paddingColor: 16,
  },
  scanFrame: {
    marginTop: 10,
    width: "100%",
    aspectRatio: 1,
    overflow: "hidden",
    borderRadius : 12,
    borderColor: "#333",
    borderWidth: 1,
    backgroundColor: "#000",
    position: "relative"
  },

  maskTop: { position: "absolute", left: 0, right: 0, top: 0, height: 16, backgroundColor: "rgba(0,0,0,0.35)" },
  maskBottom: { position: "absolute", left: 0, right: 0, bottom: 0, height: 16, backgroundColor: "rgba(0,0,0,0.35)" },
  maskLeft: { position: "absolute", left: 0, top: 0, bottom: 0, width: 16, backgroundColor: "rgba(0,0,0,0.35)" },
  maskRight: { position: "absolute", right: 0, top: 0, bottom: 0, width: 16, backgroundColor: "rgba(0,0,0,0.35)" },

  corner: {
    position: "absolute",
    width: 26,
    height: 26,
    borderColor: ORANGE,
  },

  cornerTL: { top: 8, left: 8, borderLeftWidth: 3, borderTopWidth: 3, borderTopLeftRadius: 6 },
  cornerTR: { top: 8, right: 8, borderRightWidth: 3, borderTopWidth: 3, borderTopRightRadius: 6 },
  cornerBL: { bottom: 8, left: 8, borderLeftWidth: 3, borderBottomWidth: 3, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 8, right: 8, borderRightWidth: 3, borderBottomWidth: 3, borderBottomRightRadius: 6 },

  scanLine: {
    position: "absolute",
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: ORANGE,
    top: 16,
    opacity: 0.95,
  },

  updateBtn: {
    backgroundColor: ORANGE, // you already have ORANGE = '#FF6A00'
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 24,
  },
  updateBtnTxt: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#111", // match your dark theme
    padding: 16,
    paddingBottom: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", marginVertical: 6 },
  lbl: { width: 110, opacity: 0.8 },
  inp: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: "#fff",
  },
  modalBtns: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12, gap: 8 },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  btnGhost: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#444" },
  btnGhostTxt: { color: "#ddd", fontWeight: "600" },
  btnPrimary: { backgroundColor: ORANGE },
  btnPrimaryTxt: { color: "#fff", fontWeight: "700" },

});
