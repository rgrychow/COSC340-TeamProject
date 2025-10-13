// app/(tabs)/home.tsx
import { Ionicons } from "@expo/vector-icons"; // For icons
import Slider from "@react-native-community/slider";
import { useNavigation } from "@react-navigation/native";
import { useRef, useState } from "react";
import { Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"; // Import necessary components
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
  const [completedWorkouts, setCompletedWorkouts] = useState(0); // Tracks completed workouts
  const [workoutGoal, setWorkoutGoal] = useState(5); // Default workout goal set to 5
  const [macros, setMacros] = useState({
    calories: { completed: 1500, goal: 2000 },
    protein: { completed: 100, goal: 150 },
    fats: { completed: 50, goal: 70 },
    carbs: { completed: 200, goal: 250 },
  });

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / 300); // Assuming each image is 300px wide
    setCurrentIndex(index);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Welcome Jackson</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => console.log("Search button pressed")}>
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
        contentContainerStyle={styles.carouselContent} // Added contentContainerStyle
        style={styles.carousel}
      >
        {images.map((image, index) => (
          <View key={index} style={styles.carouselItem}>
            <Image source={image} style={styles.carouselImage} />
          </View>
        ))}
      </ScrollView>
      <View style={styles.carouselFooter}>
        <TouchableOpacity
          style={styles.carouselButton}
          onPress={() => {
            if (currentIndex === 0) {
              console.log("Start Run button pressed");
            } else if (currentIndex === 1) {
              console.log("Start Workout button pressed");
            } else {
              console.log("Track Meals button pressed");
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
            0/{workoutGoal}
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
    height: 250,
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
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3, // For Android shadow
  },
  carouselButtonText: {
    color: "#000",
    fontWeight: "bold",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#555",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: ORANGE,
  },
  text: { color: "#ccc", lineHeight: 20, marginBottom: 16 },
  bold: { color: "#fff", fontWeight: "700" },
  card: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f1f1f",
  },
  cardTitle: { color: ORANGE, fontWeight: "800", marginBottom: 8 },
  cardText: { color: "#eee", marginTop: 2 },
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
    marginBottom: 8,
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  progressBar: {
    flexDirection: "row",
    height: 20,
    backgroundColor: "#333", // Gray background for the progress bar
    borderRadius: 10,
    overflow: "hidden",
    flex: 1, // Ensures the progress bar takes up remaining space
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
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
    marginBottom: 16,
    textAlign: "center",
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
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  macroInputContainer: {
    flexDirection: "row",
    flex: 2,
    justifyContent: "space-between",
  },
  macroInput: {
    backgroundColor: "#222",
    color: "#fff",
    fontSize: 14,
    padding: 8,
    borderRadius: 8,
    textAlign: "center",
    width: "45%",
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
});