// app/index.tsx
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebase'; // Adjust path to your firebaseConfig.js

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [step, setStep] = useState(0);

  const handleLoginOrSignUp = async () => {
    if (isSignUp) {
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
      try {
        // Sign up with Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Store user data in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email: email,
          createdAt: new Date().toISOString(),
        });

        Alert.alert('Success', 'Account created! Please log in.');
        setIsSignUp(false);
        setPassword('');
        setConfirmPassword('');
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to create account');
      }
    } else {
      try {
        // Log in with Firebase Authentication
        await signInWithEmailAndPassword(auth, email, password);
        Alert.alert('Success', 'Logged in!');
        router.replace('/(tabs)/home');
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to log in');
      }
    }
  };

  const handleSkip = () => {
    setShowOnboarding(true);
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      setShowOnboarding(false);
      router.replace('/(tabs)/home');
    }
  };

  const steps = [
    {
      title: 'Welcome to the Home Tab!',
      description: 'Your dashboard for an overview of your fitness journey, quick access to features, and personalized recommendations.',
    },
    {
      title: 'Fitness Tab',
      description: 'Track your workouts, add exercises, and log sets with reps and weights to stay consistent with your training goals.',
    },
    {
      title: 'Nutrition Tab',
      description: 'Monitor your daily meals, track calories and macros, and update your nutrition targets for balanced eating.',
    },
    {
      title: 'Progress Tab',
      description: 'View your progress stats, like weekly workouts and average calories, to see how far you’ve come and stay motivated.',
    },
  ];

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
          <Text style={styles.buttonText}>{isSignUp ? 'Sign Up' : 'Log In'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toggleButton} onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={styles.toggleButtonText}>
            {isSignUp ? 'Already have an account? Log In' : 'No account? Sign Up'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>
      <Modal visible={showOnboarding} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.stepTitle}>{steps[step].title}</Text>
            <Text style={styles.description}>{steps[step].description}</Text>
            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>{step < steps.length - 1 ? 'Next' : 'Done'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 32,
    color: '#000000',
  },
  inputContainer: {
    width: '80%',
  },
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
});

export default LoginScreen;