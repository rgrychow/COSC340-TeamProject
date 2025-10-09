// app/(tabs)/nutrition.tsx
// New

import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import Constants from "expo-constants";

const ORANGE = "#FF6A00";
const USDA_API_KEY = Constants.expoConfig?.extra?.USDA_API_KEY || "";

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
  };

  const ResultRow = ({ item }: any) => (
    <Pressable style={styles.row} onPress={() => openDetail(item.id)}>
      <Text style={styles.item}>- {item.name}</Text>
      {!!item.brand && <Text style={styles.subItem}>{item.brand}</Text>}
    </Pressable>
  );

  const Bar = ({ value, target }: { value: number; target: number}) => {
    const pct = Math.max(0, Math.min(1, value / target));
    return (
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct * 100}%` }]} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled">
          <Text style={styles.header}>Nutrition</Text>

          {/* Daily Intake*/}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Daily Intake</Text>
            <Text style={styles.item}>
              - Calories: {Math.round(totals.kcal)} / {TARGETS.kcal} kcal
            </Text>
            <Bar value={totals.kcal} target={TARGETS.kcal} />
            <Text style={styles.item}>
              - Protein: {r1(totals.protein_g)} / {TARGETS.protein_g} g
            </Text>
            <Bar value={totals.protein_g} target={TARGETS.protein_g} />
            <Text style={styles.item}>
            - Carbs: {r1(totals.carbs_g)} / {TARGETS.carbs_g} g
            </Text>
            <Bar value={totals.carbs_g} target={TARGETS.carbs_g} />
            <Text style={styles.item}>
              - Fats: {r1(totals.fat_g)} / {TARGETS.fat_g} g
            </Text>
            <Bar value={totals.fat_g} target={TARGETS.fat_g} />
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
                <FlatList
                  data={items}
                  keyExtractor={(it) => it.id}
                  renderItem={ResultRow}
                  keyboardShouldPersistTaps="handled"
                  ItemSeparatorComponent={() => <View style={styles.sep} />}
                  contentContainerStyle={{ paddingBottom: 6}}
                />
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

            <Pressable style={styles.addBtn} onPress={addToDaily}>
              <Text style={styles.addText}>+ Add to Daily Total</Text>
            </Pressable>

            <Pressable onPress={() => setDetail(null)} style={{ marginTop: 10 }}>
              <Text style={[styles.item, { color: "#7abaff" }]}>Back to results</Text>
            </Pressable>
          </View>
        )}
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
});
