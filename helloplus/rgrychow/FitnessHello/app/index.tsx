import React, { useState } from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';

export default function App() {
  const [steps, setSteps] = useState(0);

  const addSteps = () => {
    setSteps(steps + 100); // fake step counter
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🏋️ Fitness Hello+ App</Text>
      <Text style={styles.text}>Steps Taken: {steps}</Text>
      <Button title="Add 100 Steps" onPress={addSteps} />
      <Text style={styles.footer}>Keep moving forward!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  text: {
    fontSize: 20,
    marginVertical: 10,
  },
  footer: {
    marginTop: 20,
    fontSize: 16,
    fontStyle: 'italic',
  },
});

