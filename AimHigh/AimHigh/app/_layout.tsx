// app/_layout.tsx
// app/_layout.tsx
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { WorkoutsProvider } from "../hooks/useWorkouts"; // 👈 adjust path exactly like this

export default function RootLayout() {
  return (
    <WorkoutsProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#000" },
          headerTintColor: "#fff",
          contentStyle: { backgroundColor: "#000" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* keep any other screens you already have, like "modal" */}
      </Stack>
    </WorkoutsProvider>
  );
}
