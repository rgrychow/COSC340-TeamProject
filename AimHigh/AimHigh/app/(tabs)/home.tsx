import { Ionicons } from "@expo/vector-icons"; // For icons
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth"; // Import Firebase Auth
import { doc, onSnapshot } from "firebase/firestore"; // Import Firestore
import { useEffect, useState } from "react";
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

  const handleStartRun = () => {
    // Adjust path to your actual route (e.g., "/run/start")
    router.push("/run");
  };
  const handleStartWorkout = () => {
    // Adjust path to your actual route (e.g., "/workout/start")
    router.push("/workout");
  };
  const handleTrackNutrition = () => {
    // Adjust path to your actual route (e.g., "/nutrition/track")
    router.push("/nutrition");
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
