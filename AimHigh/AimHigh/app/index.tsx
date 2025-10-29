// app/index.tsx
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebase'; // Adjust path to your firebaseConfig.js

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [name, setName] = useState<string>('');
  const [height, setHeight] = useState<string>(''); // In inches
  const [weightLb, setWeightLb] = useState<string>(''); // In pounds
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [targetKcal, setTargetKcal] = useState<string>('');
  const [targetProtein, setTargetProtein] = useState<string>('');
  const [targetFats, setTargetFats] = useState<string>('');
  const [targetCarbs, setTargetCarbs] = useState<string>('');
  const [step, setStep] = useState(0);
  const router = useRouter();
  const [newUserId, setNewUserId] = useState<string | null>(null);

  const handleLoginOrSignUp = async () => {
    if (isSignUp) {
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        setNewUserId(user.uid);
        setShowProfileModal(true);
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to create account');
      }
    } else {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        Alert.alert('Success', 'Logged in!');
        router.replace('/(tabs)/home');
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to log in');
      }
    }
  };

  const handleProfileSubmit = async () => {
    if (!name.trim() || !height || !weightLb || !age || !gender || !targetKcal || !targetProtein || !targetFats || !targetCarbs) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (isNaN(parseFloat(height)) || isNaN(parseFloat(weightLb)) || isNaN(parseInt(age)) ||
        isNaN(parseFloat(targetKcal)) || isNaN(parseFloat(targetProtein)) ||
        isNaN(parseFloat(targetFats)) || isNaN(parseFloat(targetCarbs))) {
      Alert.alert('Error', 'Please enter valid numbers for height, weight, age, and nutrition targets');
      return;
    }
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.uid !== newUserId) {
        Alert.alert('Error', 'Authentication error. Please try signing up again.');
        return;
      }
      await setDoc(doc(db, 'users', newUserId!), {
        name: name.trim(),
        email: email,
        height: parseFloat(height),
        weightLb: parseFloat(weightLb),
        age: parseInt(age),
        gender: gender,
        nutrition: {
          target: {
            kcal: parseFloat(targetKcal),
            protein: parseFloat(targetProtein),
            fats: parseFloat(targetFats),
            carbs: parseFloat(targetCarbs),
          },
          current: {
            kcal: 0,
            protein: 0,
            fats: 0,
            carbs: 0,
          },
        },
        createdAt: new Date().toISOString(),
      });
      Alert.alert('Success', 'Profile saved! Please log in.');
      setShowProfileModal(false);
      setIsSignUp(false);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setName('');
      setHeight('');
      setWeightLb('');
      setAge('');
      setGender('');
      setTargetKcal('');
      setTargetProtein('');
      setTargetFats('');
      setTargetCarbs('');
      setNewUserId(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save profile');
      console.error('Firestore Error:', error); // Log for debugging
    }
  };

  const handleSkip = () => setShowOnboarding(true);
  const handleNext = () => {
    if (step < steps.length - 1) setStep((s) => s + 1);
    else {
      setShowOnboarding(false);
      router.replace("/(tabs)/home");
    }
  };

  if (busy) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator />
        <Text style={{ marginTop: 12 }}>Checking session…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AimHigh</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#4B4B4B"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#4B4B4B"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        {isSignUp && (
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#4B4B4B"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        )}
        <TouchableOpacity style={styles.button} onPress={handleLoginOrSignUp}>
          <Text style={styles.buttonText}>{isSignUp ? 'Create Account' : 'Log In'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toggleButton} onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={styles.toggleButtonText}>
            {isSignUp ? "Already have an account? Log In" : "No account? Sign Up"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showProfileModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Complete Your Profile</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#4B4B4B"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <TextInput
              style={styles.input}
              placeholder="Height (inches)"
              placeholderTextColor="#4B4B4B"
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Weight (pounds)"
              placeholderTextColor="#4B4B4B"
              value={weightLb}
              onChangeText={setWeightLb}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Age"
              placeholderTextColor="#4B4B4B"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Gender (e.g., Male/Female/Other)"
              placeholderTextColor="#4B4B4B"
              value={gender}
              onChangeText={setGender}
              autoCapitalize="words"
            />
            <TextInput
              style={styles.input}
              placeholder="Target Calories (kcal)"
              placeholderTextColor="#4B4B4B"
              value={targetKcal}
              onChangeText={setTargetKcal}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Target Protein (grams)"
              placeholderTextColor="#4B4B4B"
              value={targetProtein}
              onChangeText={setTargetProtein}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Target Fats (grams)"
              placeholderTextColor="#4B4B4B"
              value={targetFats}
              onChangeText={setTargetFats}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Target Carbs (grams)"
              placeholderTextColor="#4B4B4B"
              value={targetCarbs}
              onChangeText={setTargetCarbs}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.button} onPress={handleProfileSubmit}>
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showOnboarding} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.stepTitle}>{steps[step].title}</Text>
            <Text style={styles.description}>{steps[step].description}</Text>
            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>{step < steps.length - 1 ? "Next" : "Done"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF", paddingHorizontal: 20 },
  title: { fontSize: 30, fontWeight: "bold", marginBottom: 32, color: "#000000" },
  inputContainer: { width: "80%" },
  input: {
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    backgroundColor: '#F97316',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  toggleButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleButtonText: {
    color: '#F97316',
    fontSize: 14,
    fontWeight: '500',
  },
  skipButton: {
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#F97316',
    fontSize: 16,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#000000',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#000000',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#4B4B4B',
  },
  button: { backgroundColor: "#F97316", borderRadius: 8, padding: 12, width: "100%", alignItems: "center", marginBottom: 16 },
  buttonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },
  toggleButton: { alignItems: "center", marginBottom: 16 },
  toggleButtonText: { color: "#F97316", fontSize: 14, fontWeight: "500" },
  skipButton: { alignItems: "center" },
  skipButtonText: { color: "#F97316", fontSize: 16, fontWeight: "500" },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.5)" },
  modalContent: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24, width: "80%", alignItems: "center" },
  stepTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 16, textAlign: "center", color: "#000000" },
  description: { fontSize: 16, textAlign: "center", marginBottom: 24, color: "#4B4B4B" },
});

export default LoginScreen;
