import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, TextInput, Button, FlatList, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Workout = {
  id: string;
  date: string;     // e.g. 2025-09-16
  type: string;     // e.g. Legs / Run / Push
  name: string;     // e.g. Back Squat
  durationMin: string; // keep as string for simple inputs
  sets: string;
  reps: string;
  weight: string;
  notes: string;
};

const STORAGE_KEY = "workouts.v1";

export default function App() {
  const [items, setItems] = useState<Workout[]>([]);
  const [w, setW] = useState<Workout>({
    id: "",
    date: "",
    type: "",
    name: "",
    durationMin: "",
    sets: "",
    reps: "",
    weight: "",
    notes: "",
  });

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    })();
  }, []);

  const saveAll = async (next: Workout[]) => {
    setItems(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addWorkout = async () => {
    const nw: Workout = { ...w, id: Date.now().toString() };
    await saveAll([nw, ...items]);
    setW({ id: "", date: "", type: "", name: "", durationMin: "", sets: "", reps: "", weight: "", notes: "" });
  };

  const clearAll = async () => {
    await saveAll([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.h1}>My Workouts</Text>

      <View style={styles.row}>
        <Input label="Date" value={w.date} onChangeText={(t) => setW({ ...w, date: t })} placeholder="YYYY-MM-DD" />
        <Input label="Type" value={w.type} onChangeText={(t) => setW({ ...w, type: t })} placeholder="Legs/Run/Push" />
      </View>

      <Input label="Name" value={w.name} onChangeText={(t) => setW({ ...w, name: t })} placeholder="Back Squat" />
      <View style={styles.row}>
        <Input label="Duration (min)" value={w.durationMin} onChangeText={(t) => setW({ ...w, durationMin: t })} placeholder="45" keyboardType="numeric" />
        <Input label="Sets" value={w.sets} onChangeText={(t) => setW({ ...w, sets: t })} placeholder="5" keyboardType="numeric" />
      </View>
      <View style={styles.row}>
        <Input label="Reps" value={w.reps} onChangeText={(t) => setW({ ...w, reps: t })} placeholder="5" keyboardType="numeric" />
        <Input label="Weight" value={w.weight} onChangeText={(t) => setW({ ...w, weight: t })} placeholder="225" keyboardType="numeric" />
      </View>
      <Input label="Notes" value={w.notes} onChangeText={(t) => setW({ ...w, notes: t })} placeholder="optional" />

      <View style={styles.buttons}>
        <Button title="Add Workout" onPress={addWorkout} />
        <Button title="Clear All" color="#c33" onPress={clearAll} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.date} • {item.type} • {item.name}</Text>
            <Text style={styles.cardLine}>Duration: {item.durationMin} min  |  Sets x Reps: {item.sets} x {item.reps}  |  Weight: {item.weight}</Text>
            {item.notes ? <Text style={styles.cardLine}>Notes: {item.notes}</Text> : null}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.muted}>No workouts yet. Add one above.</Text>}
      />
    </SafeAreaView>
  );
}

function Input(props: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
}) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        style={styles.input}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        keyboardType={props.keyboardType ?? "default"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10 },
  h1: { fontSize: 24, fontWeight: "700", marginBottom: 6 },
  row: { flexDirection: "row", gap: 8 },
  inputWrap: { flex: 1 },
  label: { fontSize: 12, color: "#555" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, fontSize: 16 },
  buttons: { flexDirection: "row", justifyContent: "space-between", marginVertical: 8 },
  card: { padding: 10, borderWidth: 1, borderColor: "#ddd", borderRadius: 10, marginBottom: 8 },
  cardTitle: { fontWeight: "600", marginBottom: 2 },
  cardLine: { color: "#333" },
  muted: { color: "#777", marginTop: 20, textAlign: "center" },
});

