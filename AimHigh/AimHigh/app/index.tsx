// app/index.tsx
import { useRouter } from 'expo-router';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from '../firebase';
import NutritionCalculator, { NutritionGoals } from './nutrition_calculator'; // Fixed path

const LoginScreen: React.FC = () => {
  const router = useRouter();

  // ────── Auth state ──────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // ────── Name input modal (replaces Alert.prompt) ──────
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempName, setTempName] = useState('');
  const [pendingUserUid, setPendingUserUid] = useState<string | null>(null);

  // ────── Calculator modal ──────
  const [showCalculator, setShowCalculator] = useState(false);
  const [finalName, setFinalName] = useState('');
  const [finalUid, setFinalUid] = useState<string | null>(null);

  // ────── Onboarding (skip) ──────
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [step, setStep] = useState(0);
  const steps = [
    { title: 'Welcome!', description: 'Get ready to track your fitness.' },
    { title: 'Nutrition', description: 'Set your goals with our calculator.' },
    { title: 'Track', description: 'Log meals and workouts.' },
    { title: 'Progress', description: 'See your results over time.' },
  ];

  // ────── Sign Up Flow ──────
  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      // Step 1: Show name modal
      setPendingUserUid(uid);
      setShowNameModal(true);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create account');
    }
  };

  // ────── Confirm Name → Open Calculator ──────
  const confirmName = () => {
    const name = tempName.trim();
    if (!name) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setFinalName(name);
    setFinalUid(pendingUserUid);
    setShowNameModal(false);
    setShowCalculator(true); // Open calculator
    setTempName('');
  };

  // ────── Save Profile + Goals ──────
  const handleCalculatorComplete = async (goals: NutritionGoals) => {
    if (!finalUid) return;

    try {
      await setDoc(
        doc(db, 'users', finalUid),
        {
          name: finalName,
          email: auth.currentUser?.email,
          nutritionGoals: goals,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );

      Alert.alert('Welcome!', 'Your profile is ready.');
      setShowCalculator(false);
      router.replace('/(tabs)/home');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save profile');
    }
  };

  // ────── Skip → Onboarding ──────
  const handleSkip = () => setShowOnboarding(true);
  const handleNext = () => {
    if (step < steps.length - 1) setStep(s => s + 1);
    else {
      setShowOnboarding(false);
      router.replace('/(tabs)/home');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AimHigh</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {isSignUp && (
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={isSignUp ? handleSignUp : async () => {
            try {
              await signInWithEmailAndPassword(auth, email, password);
              router.replace('/(tabs)/home');
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          }}
        >
          <Text style={styles.buttonText}>{isSignUp ? 'Create Account' : 'Log In'}</Text>
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

      {/* ────── Name Input Modal ────── */}
      <Modal visible={showNameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>What's your name?</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={tempName}
              onChangeText={setTempName}
              autoFocus
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.navBtn, styles.secondaryBtn]}
                onPress={() => {
                  setShowNameModal(false);
                  auth.currentUser?.delete(); // clean up
                }}
              >
                <Text style={styles.secondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navBtn} onPress={confirmName}>
                <Text style={styles.navText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ────── Nutrition Calculator ────── */}
      <NutritionCalculator
        visible={showCalculator}
        onClose={() => {
          setShowCalculator(false);
          auth.currentUser?.delete(); // optional: delete if they back out
          router.replace('/(tabs)/home');
        }}
        onComplete={handleCalculatorComplete}
      />

      {/* ────── Onboarding ────── */}
      <Modal visible={showOnboarding} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.stepTitle}>{steps[step].title}</Text>
            <Text style={styles.description}>{steps[step].description}</Text>
            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>
                {step < steps.length - 1 ? 'Next' : 'Get Started'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 20 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 32, color: '#000' },
  inputContainer: { width: '85%' },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    backgroundColor: '#FFF',
    fontSize: 16,
  },
  button: { backgroundColor: '#F97316', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  toggleButton: { alignItems: 'center', marginBottom: 16 },
  toggleButtonText: { color: '#F97316', fontSize: 15 },
  skipButton: { alignItems: 'center' },
  skipButtonText: { color: '#F97316', fontSize: 16, fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, width: '88%', maxWidth: 400 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 16, color: '#000' },
  stepTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  description: { fontSize: 16, textAlign: 'center', color: '#555', marginBottom: 24 },

  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  navBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  secondaryBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#F97316' },
  secondaryText: { color: '#F97316', fontWeight: '600' },
  navText: { color: '#FFF', fontWeight: '600' },
});

export default LoginScreen;