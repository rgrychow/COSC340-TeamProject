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
} from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

const ORANGE = "#FF6A00";

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const router = useRouter();

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
          setProfile(docSnap.data());
        } else {
          setProfile({
            name: "",
            email: user.email || "",
            height: "",
            weightLb: "",
            age: "",
            gender: "",
            nutrition: {
              target: {
                kcal: "",
                protein: "",
                fats: "",
                carbs: "",
              },
              current: {
                kcal: 0,
                protein: 0,
                fats: 0,
                carbs: 0,
              },
            },
          });
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

  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, "users", user.uid);
      await setDoc(docRef, profile, { merge: true });

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 26 }} /> {/* Spacer to center title */}
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
        {Object.entries(profile.nutrition.target).map(([key, val]) => (
          <View key={key} style={styles.field}>
            <Text style={styles.label}>{key}</Text>
            {editMode ? (
              <TextInput
                style={styles.input}
                value={String(val)}
                keyboardType="numeric"
                onChangeText={(text) =>
                  setProfile((prev: any) => ({
                    ...prev,
                    nutrition: {
                      ...prev.nutrition,
                      target: { ...prev.nutrition.target, [key]: text },
                    },
                  }))
                }
              />
            ) : (
              <Text style={styles.value}>{String(val)}</Text>
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
});
