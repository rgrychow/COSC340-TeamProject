// app/_layout.tsx
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";
import { WorkoutsProvider } from "../hooks/useWorkouts";

// Global Nutrition context
import { NutritionProvider } from "../hooks/useNutrition";

export default function RootLayout() {
  // Recommended for react-native-screens on Android
  useEffect(() => {
    if (Platform.OS === "android") {
      try {
        // noop; react-native-screens is auto-initialized in Expo
      } catch {}
    }
  }, []);

  return (
    <WorkoutsProvider>
      <NutritionProvider>
        <>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: "#000" },
              headerTintColor: "#fff",
              contentStyle: { backgroundColor: "#000" },
            }}
          >
            {/* index.tsx is the Login screen */}
            <Stack.Screen name="index" options={{ headerShown: false }} />
            {/* (tabs) contains the 4 main pages */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </>
      </NutritionProvider>
    </WorkoutsProvider>
  );
}
