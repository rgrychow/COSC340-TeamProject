import { Ionicons } from "@expo/vector-icons"; // For icons
import Slider from "@react-native-community/slider";
import { useNavigation } from "@react-navigation/native";
import { getAuth } from "firebase/auth"; // Import Firebase Auth
import { doc, getDoc } from "firebase/firestore"; // Import Firestore
import { useEffect, useRef, useState } from "react";
import { Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"; // Import necessary components
import { db } from "../../firebase"; // Import Firestore instance from your firebaseConfig.js
import SettingsModal from "../settings_modal"; // Import the Settings Modal

const ORANGE = "#FF6A00";

const images = [
  require("../../assets/images/runningAthlete.jpg"),
  require("../../assets/images/trainingAthlete.jpg"),
  require("../../assets/images/healthyFoodWoman.jpg"),
];

export default function Home() {
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const [workoutModalVisible, setWorkoutModalVisible] = useState(false);
  const [macroModalVisible, setMacroModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false); // State for search modal
  const [searchInput, setSearchInput] = useState(""); // State for search input
  const [recentSearches, setRecentSearches] = useState<string[]>([]); // State for recent searches
  const [completedWorkouts, setCompletedWorkouts] = useState(0); // Tracks completed workouts
  const [workoutGoal, setWorkoutGoal] = useState(5); // Default workout goal set to 5
  const [macros, setMacros] = useState({
    calories: { completed: 1500, goal: 2000 },
    protein: { completed: 100, goal: 150 },
    fats: { completed: 50, goal: 70 },
    carbs: { completed: 200, goal: 250 },
  });
  const [runModalVisible, setRunModalVisible] = useState(false);
  const [mealModalVisible, setMealModalVisible] = useState(false);
  const [goalTime, setGoalTime] = useState(""); // For the "Start Run" goal time input
  const [countdown, setCountdown] = useState<number | null>(null); // For the countdown timer
  const [meals, setMeals] = useState([]); // State for meals
  const [mealNameModalVisible, setMealNameModalVisible] = useState(false); // State for showing the modal
  const [newMealName, setNewMealName] = useState(""); // State for the new meal name
  const [stepCount, setStepCount] = useState(5000); // Current step count
  const [waterIntake, setWaterIntake] = useState(1.5); // Current water intake in liters
  const [waterModalVisible, setWaterModalVisible] = useState(false); // State for water intake modal
  const [waterGoal, setWaterGoal] = useState(3); // Water intake goal in liters
  const [userName, setUserName] = useState("User"); // Default to "User"

  const handleSearchSubmit = () => {
    if (searchInput.trim() !== "") {
      setRecentSearches((prev) => [
        searchInput,
        ...prev.filter((item) => item !== searchInput),
      ]); // Add to recent searches, avoiding duplicates
      setSearchInput(""); // Clear the search input
    }
  };

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / 300); // Assuming each image is 300px wide
    setCurrentIndex(index);
  };

  const updateMealMacro = (mealId, macro, value) => {
    setMeals((prevMeals) =>
      prevMeals.map((meal) =>
        meal.id === mealId ? { ...meal, macros: { ...meal.macros, [macro]: value } } : meal
      )
    );
  };

  useEffect(() => {
    const fetchUserName = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserName(userData.name || "User"); // Set name from Firestore or fallback to "User"
          } else {
            setUserName("User");
          }
        } catch (error) {
          console.error("Error fetching user name:", error);
          setUserName("User"); // Fallback on error
        }
      } else {
        setUserName("User");
      }
    };

    fetchUserName();
  }, []);

  return (
    <ScrollView style={styles.container987}>
      <View style={styles.headerRow654}>
        <Text style={styles.header321}>Welcome, {userName}</Text>
        <View style={styles.headerButtons123}>
          <TouchableOpacity onPress={() => setSearchModalVisible(true)}>
            <Ionicons name="search" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSettingsModalVisible(true)}>
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
            <Ionicons name="person-circle" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        ref={scrollViewRef}
        contentContainerStyle={styles.carouselContent456}
        style={styles.carousel789}
      >
        {images.map((image, index) => (
          <View key={index} style={styles.carouselItem147}>
            <Image source={image} style={styles.carouselImage258} />
          </View>
        ))}
      </ScrollView>
      <View style={styles.carouselFooter}>
        <TouchableOpacity
          style={styles.carouselButton}
          onPress={() => {
            if (currentIndex === 0) {
              setRunModalVisible(true); // Open Start Run modal
            } else if (currentIndex === 1) {
              setWorkoutModalVisible(true); // Open Start Workout modal
            } else {
              setMealModalVisible(true); // Open Track Meals modal
            }
          }}
        >
          <Text style={styles.carouselButtonText}>
            {currentIndex === 0
              ? "Start Run"
              : currentIndex === 1
              ? "Start Workout"
              : "Track Meals"}
          </Text>
        </TouchableOpacity>
        <View style={styles.dotsContainer}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index ? styles.activeDot : null,
              ]}
            />
          ))}
        </View>
      </View>
      <View style={styles.dailyTracker}>
        <Text style={styles.sectionTitle}>Fitness Preview</Text>

        {/* Workout Tracker */}
        <View style={styles.workoutTracker}>
          <View style={styles.trackerHeader}>
            <Text style={styles.trackerTitle}>Workout Tracker</Text>
            <TouchableOpacity onPress={() => setWorkoutModalVisible(true)}>
              <Ionicons name="create-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.progressBarContainer}>
            <TouchableOpacity
              style={styles.logWorkoutButton}
              onPress={() => {
                // For now, pressing the button does nothing
              }}
            >
              <Text style={styles.logWorkoutButtonText}>Log Workout</Text>
            </TouchableOpacity>
            <View style={styles.progressBar}>
              {[...Array(workoutGoal)].map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressSegment,
                    { backgroundColor: index < completedWorkouts ? "#FF6A00" : "#333" }, // Gray when empty
                  ]}
                />
              ))}
            </View>
          </View>
          <Text style={styles.progressText}>
            {completedWorkouts}/{workoutGoal}
          </Text>
        </View>

        {/* Macro Tracker */}
        <View style={styles.macroTracker}>
          <View style={styles.trackerHeader}>
            <Text style={styles.trackerTitle}>Macros</Text>
            <TouchableOpacity onPress={() => setMacroModalVisible(true)}>
              <Ionicons name="create-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.macroCircles}>
            {Object.keys(macros).map((key) => (
              <View style={styles.macroItem} key={key}>
                <View style={styles.circularProgress}>
                  <Text style={styles.macroValue}>
                    {macros[key].completed}/{macros[key].goal}
                  </Text>
                </View>
                <Text style={styles.macroLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Workout Tracker Modal */}
      <Modal
        visible={workoutModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setWorkoutModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Workout Goal</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={5}
              step={1}
              value={workoutGoal}
              onValueChange={(value) => setWorkoutGoal(value)}
            />
            <Text style={styles.sliderValue}>Goal: {workoutGoal} Workouts</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setWorkoutModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Macro Tracker Modal */}
      <Modal
        visible={macroModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMacroModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Macros</Text>
            <View style={styles.macroTableHeader}>
              <Text style={[styles.macroTableHeaderText, styles.macroNameColumn]}>Macro</Text>
              <Text style={[styles.macroTableHeaderText, styles.macroColumn]}>Completed</Text>
              <Text style={[styles.macroTableHeaderText, styles.macroColumn]}>Goal</Text>
            </View>
            {Object.keys(macros).map((key) => (
              <View key={key} style={styles.macroRow}>
                <Text style={[styles.macroLabel, styles.macroNameColumn]}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Text>
                <TextInput
                  style={[styles.macroInput, styles.macroColumn]}
                  keyboardType="numeric"
                  value={String(macros[key].completed)}
                  onChangeText={(value) =>
                    setMacros((prev) => ({
                      ...prev,
                      [key]: { ...prev[key], completed: parseInt(value) || 0 },
                    }))
                  }
                />
                <TextInput
                  style={[styles.macroInput, styles.macroColumn]}
                  keyboardType="numeric"
                  value={String(macros[key].goal)}
                  onChangeText={(value) =>
                    setMacros((prev) => ({
                      ...prev,
                      [key]: { ...prev[key], goal: parseInt(value) || 0 },
                    }))
                  }
                />
              </View>
            ))}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setMacroModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

      {/* Start Run Modal */}
      <Modal
        visible={runModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRunModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.halfModalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Start Run</Text>
              <TouchableOpacity onPress={() => setRunModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            {/* Goal Time Input */}
            <View style={styles.goalTimeContainer}>
              <Text style={styles.modalSubtitle}>Set a goal run time</Text>
              <View style={styles.goalTimeInputContainer}>
                <TextInput
                  style={styles.smallInput}
                  placeholder="0"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                  value={goalTime}
                  onChangeText={setGoalTime}
                />
                <Text style={styles.goalTimeUnit}>min</Text>
              </View>
            </View>
            {/* Countdown or Start Button */}
            {countdown === null ? (
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => {
                  if (!goalTime || isNaN(Number(goalTime)) || Number(goalTime) <= 0) {
                    alert("Please enter a valid goal time.");
                    return;
                  }
                  let count = 3;
                  setCountdown(count);
                  const interval = setInterval(() => {
                    count -= 1;
                    if (count === 0) {
                      clearInterval(interval);
                      setCountdown(Number(goalTime) * 60); // Convert minutes to seconds
                      const goalInterval = setInterval(() => {
                        setCountdown((prev) => {
                          if (prev === 1) {
                            clearInterval(goalInterval);
                            setCountdown(null);
                            console.log("Run completed!");
                            return null;
                          }
                          return prev - 1;
                        });
                      }, 1000);
                    } else {
                      setCountdown(count);
                    }
                  }, 1000);
                }}
              >
                <Text style={styles.startButtonText}>Start Run</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.countdownText}>
                {countdown > 3
                  ? `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, "0")}`
                  : countdown === 1
                  ? "Start"
                  : countdown}
              </Text>
            )}
          </View>
        </View>
      </Modal>

      {/* Start Workout Modal */}
      <Modal
        visible={workoutModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setWorkoutModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Start Workout</Text>
            <TouchableOpacity onPress={() => setWorkoutModalVisible(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.text}>Workout details will go here.</Text>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => {
                console.log("Workout started");
                setWorkoutModalVisible(false);
              }}
            >
              <Text style={styles.startButtonText}>Start Workout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Track Meals Modal */}
      <Modal
        visible={mealModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMealModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.halfModalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Track Meals</Text>
              <TouchableOpacity onPress={() => setMealModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            {/* Add Meal Button */}
            <TouchableOpacity
              style={styles.addMealButton}
              onPress={() => {
                setMeals((prevMeals) => [
                  ...prevMeals,
                  {
                    id: Date.now(),
                    name: "",
                    macros: { calories: 0, protein: 0, carbs: 0, fats: 0 },
                  },
                ]);
              }}
            >
              <Text style={styles.addMealButtonText}>Add Meal</Text>
            </TouchableOpacity>
            {/* Meal List */}
            <ScrollView style={styles.mealList}>
              {meals.map((meal) => (
                <View key={meal.id} style={styles.mealItem}>
                  {/* Input for Meal Name */}
                  <TextInput
                    style={styles.mealNameInput}
                    placeholder="Enter meal name"
                    placeholderTextColor="#888"
                    value={meal.name}
                    onChangeText={(value) =>
                      setMeals((prevMeals) =>
                        prevMeals.map((m) =>
                          m.id === meal.id ? { ...m, name: value } : m
                        )
                      )
                    }
                  />
                  {/* Macros */}
                  <View style={styles.macroRow}>
                    <Text style={styles.macroLabel}>Calories:</Text>
                    <TextInput
                      style={styles.macroInput}
                      keyboardType="numeric"
                      value={String(meal.macros.calories)}
                      onChangeText={(value) =>
                        updateMealMacro(meal.id, "calories", parseInt(value) || 0)
                      }
                    />
                  </View>
                  <View style={styles.macroRow}>
                    <Text style={styles.macroLabel}>Protein:</Text>
                    <TextInput
                      style={styles.macroInput}
                      keyboardType="numeric"
                      value={String(meal.macros.protein)}
                      onChangeText={(value) =>
                        updateMealMacro(meal.id, "protein", parseInt(value) || 0)
                      }
                    />
                  </View>
                  <View style={styles.macroRow}>
                    <Text style={styles.macroLabel}>Carbs:</Text>
                    <TextInput
                      style={styles.macroInput}
                      keyboardType="numeric"
                      value={String(meal.macros.carbs)}
                      onChangeText={(value) =>
                        updateMealMacro(meal.id, "carbs", parseInt(value) || 0)
                      }
                    />
                  </View>
                  <View style={styles.macroRow}>
                    <Text style={styles.macroLabel}>Fats:</Text>
                    <TextInput
                      style={styles.macroInput}
                      keyboardType="numeric"
                      value={String(meal.macros.fats)}
                      onChangeText={(value) =>
                        updateMealMacro(meal.id, "fats", parseInt(value) || 0)
                      }
                    />
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Meal Name Input Modal */}
      <Modal
        visible={mealNameModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMealNameModalVisible(false)} // Close the modal
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Meal Name</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Meal Name"
              placeholderTextColor="#888"
              value={newMealName}
              onChangeText={setNewMealName} // Update the meal name
            />
            <TouchableOpacity
              style={styles.addMealButton}
              onPress={() => {
                if (newMealName.trim() !== "") {
                  setMeals((prevMeals) => [
                    ...prevMeals,
                    {
                      id: Date.now(),
                      name: newMealName.trim(),
                      macros: { calories: 0, protein: 0, carbs: 0, fats: 0 },
                    },
                  ]);
                  setNewMealName(""); // Clear the input
                  setMealNameModalVisible(false); // Close the modal
                } else {
                  alert("Please enter a valid meal name.");
                }
              }}
            >
              <Text style={styles.addMealButtonText}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setMealNameModalVisible(false)} // Close the modal
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
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
    fontSize: 24,
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
    height: 200,
    borderRadius: 10,
    overflow: "hidden",
    marginHorizontal: 5,
  },
  carouselImage258: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  // Add other styles as needed for the rest of your components



  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  header: { color: "#fff", fontSize: 28, fontWeight: "800" },
  headerButtons: {
    flexDirection: "row",
    gap: 16,
  },
  carousel: {
    marginTop: 8,
    width: 365,
    height: 240, // Matches the height of the carousel
    overflow: "hidden",
  },
  carouselItem: {
    width: 365,
    height: 250, // Matches the height of the image
    justifyContent: "center",
    alignItems: "center",
  },
  carouselImage: {
    width: 350,
    height: 250, // Matches the height of the image
    borderRadius: 14,
  },
  carouselFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 20, // Adds spacing on both sides
  },
  carouselButton: {
    borderRadius: 14,
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4, // For Android shadow
  },
  carouselButtonText: {
    color: ORANGE,
    fontWeight: "bold",
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
  },
  activeDot: {
    backgroundColor: ORANGE,
  },
  dailyTracker: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#111",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f1f1f",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  workoutTracker: {
    marginBottom: 16,
  },
  trackerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  trackerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressBar: {
    flex: 1, // Ensures the progress bar takes up remaining space
    height: 10, // Gray background for the progress bar
    backgroundColor: "#333",
    borderRadius: 5,
    overflow: "hidden",
    flexDirection: "row",
  },
  progressSegment: {
    height: "100%",
    flex: 1, // Each segment takes equal space
  },
  logWorkoutButton: {
    backgroundColor: ORANGE,
    paddingVertical: 6, // Smaller height
    paddingHorizontal: 12, // Smaller width
    borderRadius: 6,
    marginRight: 12, // Adds spacing between the button and the progress bar
  },
  logWorkoutButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12, // Smaller font size
    textAlign: "center",
  },
  progressText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "right",
    marginTop: 4,
    alignSelf: "flex-end", // Aligns the text to the right
  },
  macroTracker: {
    marginTop: 16,
  },
  macroCircles: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  macroItem: {
    alignItems: "center",
    marginBottom: 16,
  },
  macroLabel: {
    color: "#fff",
    fontSize: 14,
    marginTop: 8, // Adds spacing between the circle and the label
    textAlign: "left",
  },
  circularProgress: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: "#FF6A00",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  macroValue: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
  },
  modalContent: {
    backgroundColor: "#111",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: "100%",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  slider: {
    width: "100%",
    marginBottom: 16,
  },
  sliderValue: {
    color: "#fff",
    fontSize: 16,
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
  macroRow: {
    flexDirection: "row", // Align items in a row
    justifyContent: "space-between", // Space between labels and inputs
    alignItems: "center", // Vertically align items
    marginBottom: 12, // Add spacing between rows
  },
  macroInputContainer: {
    flexDirection: "row", // Align inputs in a row
    justifyContent: "space-between", // Space between inputs
  },
  macroInput: {
    backgroundColor: "#222", // Dark background for input
    color: "#fff", // White text
    fontSize: 14, // Font size for input text
    padding: 8, // Padding inside the input
    borderRadius: 8, // Rounded corners
    textAlign: "center", // Center text
    width: 80, // Fixed width for input
  },
  macroTableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center", // Aligns headers vertically with text boxes
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  macroTableHeaderText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  macroNameColumn: {
    width: "30%", // Fixed width for the macro name column
  },
  macroColumn: {
    width: "35%", // Fixed width for the completed and goal columns
  },
  searchInput: {
    backgroundColor: "#222",
    color: "#fff",
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  recentSearchesContainer: {
    marginTop: 16,
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
  fullScreenModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)", // Dark background with slight transparency
  },
  fullScreenModalContent: {
    flex: 1,
    backgroundColor: "#111", // Full-screen modal background
    padding: 20,
    borderTopLeftRadius: 0, // No rounded corners for full-screen
    borderTopRightRadius: 0,
  },
  threeQuarterModalContent: {
    height: "75%", // Takes up 3/4 of the screen height
    backgroundColor: "#111", // Modal background color
    padding: 20,
    borderTopLeftRadius: 20, // Rounded top corners
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  goalTimeContainer: {
    width: "100%",
    marginBottom: 16,
  },
  goalTimeInputContainer: {
    flexDirection: "row", // Align input and "min" text in a row
    alignItems: "center",
  },
  smallInput: {
    backgroundColor: "#222",
    color: "#fff",
    fontSize: 16,
    padding: 8,
    borderRadius: 8,
    textAlign: "center",
    width: 80, // Fixed width for the input box
    marginRight: 8,
  },
  goalTimeUnit: {
    color: "#fff",
    fontSize: 16,
  },
  startButton: {
    backgroundColor: ORANGE,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  startButtonText: {
    color: "#000", // Black text for the button
    fontWeight: "bold",
    fontSize: 16,
  },
  countdownText: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 16,
  },
  halfModalContent: {
    height: "50%", // Takes up half the screen height
    backgroundColor: "#111", // Modal background color
    padding: 20,
    borderTopLeftRadius: 20, // Rounded top corners
    borderTopRightRadius: 20,
  },
  modalSubtitle: {
    color: "#fff", // White text for "Set a goal run time"
    fontSize: 16,
    marginBottom: 16,
  },
  addMealButton: {
    backgroundColor: ORANGE,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  addMealButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
  mealList: {
    flex: 1,
    marginTop: 8,
  },
  mealNameInput: {
    backgroundColor: "#222",
    color: "#fff",
    fontSize: 16,
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  mealItem: {
    backgroundColor: "#333",
    color: "#fff",
    fontSize: 16,
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  circularProgressContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  circularProgressItem: {
    alignItems: "center",
    justifyContent: "center",
    height: 80,
    width: 80,
  },
  circularProgressText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 8,
  },
  circularProgressLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  editButton: {
    backgroundColor: ORANGE,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  editButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 12,
  },
});