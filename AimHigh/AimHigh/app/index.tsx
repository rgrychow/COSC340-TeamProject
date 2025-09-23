// app/index.tsx
import { Link, router } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const ORANGE = "#FF6A00";

export default function Login() {
  const handleLogin = () => {
    // Dummy auth: always succeed → go to tabbed app
    router.replace("/(tabs)/home");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AimHigh</Text>
      <Text style={styles.subtitle}>Fitness • Nutrition • Progress</Text>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>

      <Text style={styles.helper}>
        (Dummy login — tap “Continue” to enter)
      </Text>

      {/* handy for dev to jump around */}
      <Link href="/(tabs)/home" style={styles.link}>
        Skip to Home
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: "#aaa",
    marginTop: 8,
    marginBottom: 40,
  },
  button: {
    backgroundColor: ORANGE,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
  },
  buttonText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 18,
  },
  helper: {
    color: "#888",
    marginTop: 16,
  },
  link: {
    color: ORANGE,
    marginTop: 8,
    textDecorationLine: "underline",
  },
});
