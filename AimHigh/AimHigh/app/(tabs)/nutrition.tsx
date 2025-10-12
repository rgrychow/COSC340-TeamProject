// app/(tabs)/nutrition.tsx
// New

import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { Ring } from "../../components/nutrition-ring";

const ORANGE = "#FF6A00";
const USDA_API_KEY = Constants.expoConfig?.extra?.USDA_API_KEY || "";
const LIST_MAX = Math.min(420, Math.round(Dimensions.get("window").height * 0.5));
const MEAL_BASE = "https://themealdb.com/api/json/v1/1";

// Daily Targets (will update for user input when backend applied)
const TARGETS = { kcal: 2200, protein_g: 160, carbs_g: 220, fat_g: 70};

// USDA nutrient nums
const NUM = { kcal: "208", protein: "203", carbs: "205", fat: "204" };
const r1 = (x: number) => Math.round(x * 10) / 10;

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

function scale(per100: any, grams: number) {
  return {
    kcal: (per100.kcal * grams) / 100,
    protein_g: (per100.protein_g * grams) / 100,
    carbs_g: (per100.carbs_g * grams) / 100,
    fat_g: (per100.fat_g * grams) / 100,
  };
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

export default function Nutrition() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Array<{ id: string; name: string; brand: string | null}>>([]);
  const [detail, setDetail] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // serving / consumption
  const [manualGramServing, setManualGramServing] = useState<string>("100"); // If USDA has now serving amt
  const [servingsCount, setServingsCount] = useState<string>("1");

  // daily totals (no backend - local only)
  const [totals, setTotals] = useState({
    kcal: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
  });

  // Daily Log Entries
  const [entries, setEntries] = useState<LogEntry[]>([]);

  // Recipe Search state
  const [recipeQ, setRecipeQ] = useState("");
  const [recipes, setRecipes] = useState<any[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [recipesError, setRecipesError] = useState<string | null>(null);

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

  // Animated add button
  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
  const btnScale = useRef(new Animated.Value(1)).current;

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

    setLoading(true);
    try {
      const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
      url.searchParams.set("query", text.trim());
      url.searchParams.set("pageSize", "15");
      url.searchParams.set("api_key", USDA_API_KEY);

      const r = await fetch(url.toString());
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
      setLoading(false);
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
    setLoading(true);
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
          label: portion.portionDEscription || portion.modifier || "serving",
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
      setLoading(false);
    }
  };

  // computed macros for UI
  const hasServing = !!detail?.serving;
  const gramsPerServing = hasServing
    ? detail.serving.grams
    : Math.max(1, parseFloat(manualGramServing) || 0);
  const macrosPerServing = 
    detail && gramsPerServing 
      ? scale(detail.per100, gramsPerServing) 
      : { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0};

  const servingsN = Math.max(0, parseFloat(servingsCount) || 0);
  const macrosThisEntry = {
    kcal: macrosPerServing.kcal * servingsN, 
    protein_g: macrosPerServing.protein_g * servingsN, 
    carbs_g: macrosPerServing.carbs_g * servingsN, 
    fat_g: macrosPerServing.fat_g * servingsN, 
  };

  const addToDaily = () => {
    setTotals((t) => ({
      kcal: t.kcal + macrosThisEntry.kcal,
      protein_g: t.protein_g + macrosThisEntry.protein_g,
      carbs_g: t.carbs_g + macrosThisEntry.carbs_g,
      fat_g: t.fat_g + macrosThisEntry.fat_g,
    }));

    // Log Entry
    if (detail) {
      const entry: LogEntry = {
        id: `${detail.id}-${Date.now()}`,
        name: detail.name,
        brand: detail.brand,
        servings: servingsN,
        gramsPerServing: gramsPerServing,
        macros: {
          kcal: macrosThisEntry.kcal,
          protein_g: macrosThisEntry.protein_g,
          carbs_g: macrosThisEntry.carbs_g,
          fat_g: macrosThisEntry.fat_g,
        },
        atISO: new Date().toISOString(),
      };
      setEntries((prev) => [entry, ...prev]);
    }
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
                  value={totals.kcal}
                  target={TARGETS.kcal}
                  color="#FF6A00"
                  label="Calories"
                  sublabel={`${Math.round(totals.kcal)} / ${TARGETS.kcal} kcal`}
                />
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 6 }}>
                <Ring
                  size={92}
                  value={totals.protein_g}
                  target={TARGETS.protein_g}
                  color="#7abaff"
                  label="Protein"
                  sublabel={`${Math.round(totals.protein_g)} / ${TARGETS.protein_g} g`}
                />
                <Ring
                  size={92}
                  value={totals.carbs_g}
                  target={TARGETS.carbs_g}
                  color="#9BE37D"
                  label="Carbs"
                  sublabel={`${Math.round(totals.carbs_g)} / ${TARGETS.carbs_g} g`}
                />
                <Ring
                  size={92}
                  value={totals.fat_g}
                  target={TARGETS.fat_g}
                  color="#F6C945"
                  label="Fats"
                  sublabel={`${Math.round(totals.fat_g)} / ${TARGETS.fat_g} g`}
                />
              </View>
            </View>


            {/* Search */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Search Foods</Text>
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
                    {hasServing ? (
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
                        inputMode="numeric"
                        value={servingsCount}
                        onChangeText={(t) => setServingsCount(t.replace(/[^0-9.]/g, ""))}
                        placeholder="e.g., 1.5"
                        placeholderTextColor="#777"
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
                    showsVerticalScrollINdicator
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 6 }}
                  >
                    {entries.map((item) => (
                      <View key={item.id} style={{ marginBottom: 8}}>
                        <Text style={styles.item}>
                          - {item.name}{item.brand ? ` - ${item.brand}` : ""}
                        </Text>
                        <Text style={styles.subItem}>
                          {item.servings} * {Math.round(item.gramsPerServing)} g -- kcal {Math.round(item.macros.kcal)} - P {Math.round(item.macros.protein_g)} g - C {Math.round(item.macros.carbs_g)} g - F {Math.round(item.macros.fat_g)} g
                        </Text>
                        <Text style={[styles.subItem, { fontSize: 12, opacity: 0.7 }]}>
                          {new Date(item.atISO).toLocaleTimeString()}
                        </Text>
                      </View> 
                    ))}
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
          </View>
        </ScrollView>
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
});
