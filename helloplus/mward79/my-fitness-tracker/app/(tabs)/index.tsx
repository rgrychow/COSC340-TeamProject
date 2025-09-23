import { Button, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏋️ My Fitness Tracker</Text>
      <Text style={styles.subtitle}>Welcome! Start tracking your workouts below.</Text>

      <View style={styles.buttonContainer}>
        <Button
          title="Log Workout"
          onPress={() => alert("Workout logging screen coming soon!")}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="View Progress"
          onPress={() => alert("Progress screen coming soon!")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f7',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
  },
  buttonContainer: {
    marginVertical: 10,
    width: '60%',
  },
});