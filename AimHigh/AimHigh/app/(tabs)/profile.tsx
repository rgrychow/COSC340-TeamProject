// app/profile.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "../../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

import { useNutrition } from "../../hooks/useNutrition";

const ORANGE = "#FF6A00";

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [originalProfile, setOriginalProfile] = useState<any | null>(null);

  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const router = useRouter();

  // Nutrition
  const { targets, updateTargets, loading: nutritionLoading } = useNutrition();
  const [kcal, setKcal] = useState("2200");
  const [protein_g, setProtein] = useState("160");
  const [carbs_g, setCarbs] = useState("220");
  const [fat_g, setFat] = useState("70");

  // Safe Object
  const uiTargets = targets ?? { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0};

  // Form State
  const [form, setForm] = useState({
    kcal: uiTargets.kcal,
    protein_g: uiTargets.protein_g,
    carbs_g: uiTargets.carbs_g,
    fat_g: uiTargets.fat_g,
  });

  // local edit buffer for macro targets
  const [formTargets, setFormTargets] = useState({
    kcal: 0,
    protein_g: 0,
    carbs_g: 0,
    fats_g: 0,
  });

  useEffect(() => {
    if (!targets) return;
    setForm({
      kcal: targets.kcal ?? 0,
      protein_g: targets.protein_g ?? 0,
      carbs_g: targets.carbs_g ?? 0,
      fat_g: targets.fat_g ?? 0,
    });
  }, [targets]);

  const toNum = (t: string) => {
    const cleaned = t.replace(/[^\d.]/g, "");
    return cleaned === "" ? "" : Number(cleaned);
  };


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          Alert.alert("Error", "You must be logged in to view your profile.");
          return;
        }

        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          // Edit
          const data = docSnap.data() || {};
          setProfile(data);
          const t = data?.nutrition?.target || {};
          setFormTargets({
            kcal: Number(t.kcal) || 0,
            protein_g: Number(t.protein_g) || 0,
            carbs_g: Number(t.carbs_g) || 0,
            fat_g: Number(t.fat_g) || 0,
          });
        } else {
          const blank = {
            name: "",
            email: user.email || "",
            height: "",
            weightLb: "",
            age: "",
            gender: "",
            nutrition: {
              target: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
              current: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }, 
            },
          };
          setProfile(blank);
          setFormTargets(blank.nutrition.target);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        Alert.alert("Error", "Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // New
  const handleSaveTargets = async () => {
    try {
      const payload = {
        kcal: Number(form.kcal) || 0,
        protein_g: Number(form.protein_g) || 0,
        carbs_g: Number(form.carbs_g) || 0,
        fat_g: Number(form.fat_g) || 0,
      };
      await updateTargets(payload);
      setEditMode(false);
      Alert.alert("Saved", "Nutrition targets updated.");
    } catch (e: any) {
      Alert.alert("Save failed", e?.message ?? "Unknown error");
    }
  };

  const handleCancelEdit = () => {
    if (targets) {
      setForm({
        kcal: targets.kcal,
        protein_g: targets.protein_g,
        carbs_g: targets.carbs_g,
        fat_g: targets.fat_g,
      });
    }
    setEditMode(false);
  }

  // Old
  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      //Edit
      const toNumbers = (t: typeof formTargets) => ({
        kcal: Number(t.kcal) || 0,
        protein_g: Number(t.protein_g) || 0,
        carbs_g: Number(t.carbs_g) || 0,
        fat_g: Number(t.fat_g) || 0,
      });

      const nextTarget = toNumbers(formTargets);

      const docRef = doc(db, "users", user.uid);
      // Edit
      await setDoc(
        docRef, 
        { nutrition: {target: nextTarget } },
        //        name: profile.name ?? "",
        //        height: profile.height ?? "",
        //        weightLb: profile.weightLb ?? "",
        //        age: profile.age ?? "",
        //        gender: profile.gender ?? "",
        { merge: true }
      );

      setProfile((prev: any) => ({
        ...prev,
        nutrition: { ...(prev?.nutrition || {}), target: nextTarget },
      }));

      setEditMode(false);
      Alert.alert("✅ Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("❌ Error", "Failed to save profile.");
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={ORANGE} />
        <Text style={{ color: "#fff", marginTop: 10 }}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>No profile data found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        {/* Header */}
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Profile</Text>
        {/* Spacer to center title */}
        <View style={{ width: 26 }}>
        </View>
      </View>

      {/* Basic Info */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Basic Info</Text>
        {["name", "email", "height", "weightLb", "age", "gender"].map((key) => (
          <View key={key} style={styles.field}>
            <Text style={styles.label}>{key}</Text>
            {editMode ? (
              <TextInput
                style={styles.input}
                value={String(profile[key] || "")}
                editable={key !== "email"} // Don’t allow editing email
                onChangeText={(text) =>
                  setProfile((prev: any) => ({ ...prev, [key]: text }))
                }
              />
            ) : (
                <Text style={styles.value}>{String(profile[key] || "-")}</Text>
              )}
          </View>
        ))}
      </View>


      {/* Nutrition Targets */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Nutrition Targets</Text>

        {(["kcal", "protein_g", "carbs_g", "fat_g"] as const).map((key) => (
          <View key={key} style={styles.field}>
            <Text style={styles.label}>{key}</Text>
            {editMode ? (
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(formTargets[key] ?? 0)}
                onChangeText={(txt) =>
                  setFormTargets((prev) => ({
                    ...prev,
                    [key]: Number(txt) || 0,
                  }))
                }
              />
            ) : (
                <Text style={styles.value}>
                  {String(profile?.nutrition?.target?.[key] ?? 0)}
                </Text>
              )}
          </View>
        ))}
      </View>




      {/* Buttons */}
      <TouchableOpacity
        style={styles.button}
        onPress={editMode ? handleSave : () => setEditMode(true)}
      >
        <Text style={styles.buttonText}>
          {editMode ? "Save Changes" : "Edit Profile"}
        </Text>
      </TouchableOpacity>

      {editMode && (
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => setEditMode(false)}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function FieldRow({
  label,
  editable,
  value,
  onChange,
}: {
    label: string;
    editable: boolean;
    value: string | number,
    onChange: (v: string) => void;
  }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {editable ? (
        <TextInput
          style={styles.input}
          value={String(value ?? "")}
          keyboardType="numeric"
          onChangeText={onChange}
        />
      ) : (
          <Text style={styles.value}>{String(value ?? "-")}</Text>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#000",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  centered: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    color: ORANGE,
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1f1f1f",
    marginBottom: 20,
  },
  field: { marginBottom: 14 },
  label: {
    color: "#aaa",
    marginBottom: 4,
    textTransform: "capitalize",
  },
  value: { color: "#fff", fontSize: 16 },
  input: {
    backgroundColor: "#222",
    color: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    padding: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: ORANGE,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: "#444",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  error: { color: "red", fontSize: 18 },
  editBtn: {
    backgroundColor: "#111",
    borderColor: "#1f1f1f",
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  editBtnText: { color: "#eee", fontWeight: "700" },
  saveBtn: {
    backgroundColor: ORANGE,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  saveBtnText: { color: "#000", fontWeight: "800" },
  cancelBtn: {
    backgroundColor: "#222",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  cancelBtnText: { color: "#eee", fonrWeight: "700" },
});
